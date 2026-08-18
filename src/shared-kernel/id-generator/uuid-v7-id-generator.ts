import { v7 as uuidv7 } from 'uuid';
import { IdGenerator } from './id-generator.interface';

export class UuidV7IdGenerator implements IdGenerator {
  generate(): string {
    return uuidv7();
  }
}
