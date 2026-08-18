import 'reflect-metadata';
import { config } from 'dotenv';

config();

// Integration tests run against their own database so a failed run cannot corrupt dev data.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
