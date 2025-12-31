import { createClient } from '@libsql/client';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'vayu.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export default client;
