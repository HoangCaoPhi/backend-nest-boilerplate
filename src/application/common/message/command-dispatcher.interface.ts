import { Result } from '@shared-kernel/result/result';
import { Command } from './command.base';

export interface CommandDispatcher {
  dispatch<T>(command: Command<T>): Promise<Result<T>>;
}
