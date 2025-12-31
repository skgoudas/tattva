
const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing Turso credentials");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function checkDeals() {
    try {
        const result = await client.execute("SELECT * FROM deals ORDER BY created_at DESC LIMIT 5");
        console.log("Latest Deals:");
        result.rows.forEach(row => {
            console.log(`[${row.created_at}] ${row.origin}->${row.destination}: ${row.savings} (${row.price})`);
        });
    } catch (e) {
        console.error(e);
    }
}

checkDeals();
