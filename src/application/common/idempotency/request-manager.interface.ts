export interface RequestManager {
  // Returns false when this requestId was already registered by an earlier call.
  register(requestId: string, name: string): Promise<boolean>;

  // Frees a registration whose work did not complete, so the caller can retry it.
  release(requestId: string): Promise<void>;
}
