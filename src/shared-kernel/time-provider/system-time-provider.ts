import { TimeProvider } from './time-provider.interface';

export class SystemTimeProvider implements TimeProvider {
  now(): Date {
    return new Date();
  }
}
