import { Entity } from './entity.base';

class Order extends Entity<string> {
  constructor(id: string) {
    super(id);
  }
}

class Invoice extends Entity<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('Entity', () => {
  it('is equal to itself', () => {
    const order = new Order('1');

    expect(order.equals(order)).toBe(true);
  });

  it('is equal to another instance of the same type with the same id', () => {
    expect(new Order('1').equals(new Order('1'))).toBe(true);
  });

  it('is not equal when ids differ', () => {
    expect(new Order('1').equals(new Order('2'))).toBe(false);
  });

  it('is not equal to a different entity type sharing the id', () => {
    expect(new Order('1').equals(new Invoice('1'))).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    expect(new Order('1').equals(undefined)).toBe(false);
  });
});
