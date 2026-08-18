export interface SlackClient {
  notify(message: string): Promise<void>;
}
