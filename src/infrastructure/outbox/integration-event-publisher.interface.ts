export interface IntegrationEventPublisher {
  publish(eventType: string, content: string): Promise<void>;
}
