import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // Get deals from DB
        const result = await db.execute('SELECT * FROM deals ORDER BY created_at DESC LIMIT 9');
        const deals = result.rows;

        // Format DB deals to match component expectation
        const formattedDeals = deals.map(d => ({
            id: d.id,
            origin: d.origin,
            destination: d.destination,
            price: typeof d.price === 'number' ? `₹${d.price.toLocaleString()}` : d.price,
            originalPrice: typeof d.original_price === 'number' ? `₹${d.original_price.toLocaleString()}` : d.original_price,
            dates: d.dates,
            airline: d.airline,
            savings: d.savings,
            image: d.image,
            bookingLink: d.booking_link
        }));

        return NextResponse.json({ source: 'live', deals: formattedDeals });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }
}
