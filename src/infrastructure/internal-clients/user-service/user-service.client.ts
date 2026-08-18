import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserServiceClient as IUserServiceClient } from '@application/common/internal-clients/user-service/user-service.client.interface';

@Injectable()
export class UserServiceClient implements IUserServiceClient {
  constructor(private readonly http: HttpService) {}

  async userExists(userId: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.get(`/integration-api/users/${userId}/exists`, { validateStatus: () => true }),
    );
    return response.status >= 200 && response.status < 300;
  }
}
