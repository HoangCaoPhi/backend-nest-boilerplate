import { createHmac } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@api/app.module';
import { IntegrationEventPublisher } from '@application/common/integration-event/integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from '@application/common/integration-event/integration-event.di-tokens';
import { RABBITMQ_CONNECTION } from '@infrastructure/event-bus/event-bus.di-tokens';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';

const noopPublisher: IntegrationEventPublisher = { publish: async () => undefined };

describe('API (e2e)', () => {
  let app: INestApplication;
  let http: string;
  let token: string;
  let prisma: PrismaClientExtended;

  const uniqueKey = () => `key-${Math.random().toString(36).slice(2)}`;

  const hmacHeaders = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    return {
      'X-Client-Id': 'mobile-app',
      'X-Timestamp': timestamp,
      'X-Token': createHmac('sha256', process.env.INTEGRATION_MOBILE_APP_CLIENT_SECRET!)
        .update(timestamp)
        .digest('hex'),
    };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Keeps the suite off a real broker; the outbox itself is covered elsewhere.
      .overrideProvider(RABBITMQ_CONNECTION)
      .useValue({ close: async () => undefined })
      .overrideProvider(INTEGRATION_EVENT_PUBLISHER)
      .useValue(noopPublisher)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
    http = await app.getUrl();

    prisma = app.get<PrismaClientExtended>(PRISMA_CLIENT);
    token = await app.get(JwtService).signAsync({ sub: 'test-user' });
  });

  beforeEach(async () => {
    await prisma.outboxMessage.deleteMany();
    await prisma.processedRequest.deleteMany();
    await prisma.todoItem.deleteMany();
    await prisma.todoList.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const createList = async () => {
    const response = await request(http)
      .post('/api/todo-lists')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uniqueKey())
      .send({ title: 'Groceries' })
      .expect(201);
    return response.body.id as string;
  };

  describe('auth categories', () => {
    it('serves public routes without credentials', async () => {
      const response = await request(http).get('/health').expect(200);

      expect(response.body).toMatchObject({ status: 'ok' });
      expect(response.body.requestId).toEqual(expect.any(String));
    });

    it('rejects app routes without a token', async () => {
      await request(http).get('/api/todo-lists').expect(401);
    });

    it('rejects a malformed bearer token', async () => {
      await request(http).get('/api/todo-lists').set('Authorization', 'Bearer nonsense').expect(401);
    });

    it('accepts app routes with a valid token', async () => {
      await request(http).get('/api/todo-lists').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('rejects integration routes without HMAC credentials', async () => {
      await request(http).get('/api/integration/mobile-app/todo-lists').expect(401);
    });

    it('rejects a JWT on an integration route', async () => {
      await request(http)
        .get('/api/integration/mobile-app/todo-lists')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('accepts integration routes with valid HMAC credentials', async () => {
      await request(http).get('/api/integration/mobile-app/todo-lists').set(hmacHeaders()).expect(200);
    });
  });

  describe('problem details', () => {
    it('reports validation failures with the offending fields', async () => {
      const response = await request(http)
        .post('/api/todo-lists')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uniqueKey())
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({ status: 400, instance: '/api/todo-lists' });
      expect(response.body.detail).toContain('title');
    });

    it('maps a failed Result onto its error type', async () => {
      const response = await request(http)
        .post('/api/todo-lists/does-not-exist/items')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uniqueKey())
        .send({ title: 'Bread' })
        .expect(404);

      expect(response.body).toMatchObject({ title: 'Not Found', code: 'TodoList.NotFound', status: 404 });
    });
  });

  describe('idempotency', () => {
    it('requires the header on protected routes', async () => {
      await request(http)
        .post('/api/todo-lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Groceries' })
        .expect(400);
    });

    it('rejects a replayed key with a conflict', async () => {
      const key = uniqueKey();
      const send = () =>
        request(http)
          .post('/api/todo-lists')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', key)
          .send({ title: 'Groceries' });

      await send().expect(201);
      const replay = await send().expect(409);

      expect(replay.body.code).toBe('Idempotency.DuplicateRequest');
      expect(await prisma.todoList.count()).toBe(1);
    });

    it('frees the key when the request failed, so the caller can retry it', async () => {
      const key = uniqueKey();
      const attempt = (listId: string) =>
        request(http)
          .post(`/api/todo-lists/${listId}/items`)
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', key)
          .send({ title: 'Bread' });

      await attempt('does-not-exist').expect(404);

      // Same key, this time against a list that exists: a failed attempt must not
      // lock the caller out of ever completing the request.
      const listId = await createList();
      await attempt(listId).expect(201);
    });

    it('lets a different key through', async () => {
      await request(http)
        .post('/api/todo-lists')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uniqueKey())
        .send({ title: 'A' })
        .expect(201);
      await request(http)
        .post('/api/todo-lists')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uniqueKey())
        .send({ title: 'B' })
        .expect(201);

      expect(await prisma.todoList.count()).toBe(2);
    });
  });

  describe('todo list lifecycle', () => {
    it('creates, updates, completes and lists through the command/query stack', async () => {
      const listId = await createList();

      const created = await request(http)
        .post(`/api/todo-lists/${listId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uniqueKey())
        .send({ title: 'Bread' })
        .expect(201);
      const itemId = created.body.id as string;

      await request(http)
        .put(`/api/todo-lists/${listId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Sourdough', priority: 'High' })
        .expect(200);

      await request(http)
        .post(`/api/todo-lists/${listId}/items/${itemId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const items = await request(http)
        .get(`/api/todo-lists/${listId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(items.body.items).toEqual([{ id: itemId, title: 'Sourdough', isDone: true, priority: 'High' }]);

      const lists = await request(http).get('/api/todo-lists').set('Authorization', `Bearer ${token}`).expect(200);
      expect(lists.body.items[0]).toMatchObject({ id: listId, incompleteItemCount: 0 });
    });

    it('rejects an unsupported priority', async () => {
      const listId = await createList();

      await request(http)
        .put(`/api/todo-lists/${listId}/items/any`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'x', priority: 'Whenever' })
        .expect(400);
    });

    it('paginates todo lists', async () => {
      await createList();
      await createList();

      const response = await request(http)
        .get('/api/todo-lists?page=1&pageSize=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.meta).toMatchObject({ total: 2, page: 1, pageSize: 1, lastPage: 2 });
    });
  });
});
