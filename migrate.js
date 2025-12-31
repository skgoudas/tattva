const { createClient } = require('@libsql/client');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'vayu.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

const migrate = async () => {
  console.log('Running migrations on:', url);
  // Subscribers table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      is_premium INTEGER DEFAULT 0,
      razorpay_payment_id TEXT,
      razorpay_order_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Deals table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER,
      dates TEXT,
      airline TEXT,
      savings TEXT,
      image TEXT,
      booking_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Migrations complete.');
};

migrate().catch(console.error);
