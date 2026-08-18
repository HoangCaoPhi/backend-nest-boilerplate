export interface UserServiceClient {
  userExists(userId: string): Promise<boolean>;
}
