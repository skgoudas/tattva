import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Resend } from 'resend';

// Initialize Resend safely
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function GET(request) {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!resend) {
        return NextResponse.json({ error: 'Resend API Key Missing' }, { status: 500 });
    }

    try {
        // 1. Get the latest deal
        // We assume the "current deal" is the most recently created one that has good savings
        const deal = db.prepare(`
        SELECT * FROM deals 
        ORDER BY created_at DESC 
        LIMIT 1
    `).get();

        if (!deal) {
            return NextResponse.json({ message: 'No deals found to send.' });
        }

        // 2. Get all subscribers
        const subscribers = db.prepare('SELECT email FROM subscribers').all();

        if (subscribers.length === 0) {
            return NextResponse.json({ message: 'No subscribers found.' });
        }

        // 3. Send Emails 
        // In a real app, we might use batch sending or a queue. 
        // For this MVP, we'll loop (Resend rate limits might apply if list is huge, but fine for demo).
        let sentCount = 0;

        for (const sub of subscribers) {
            const { error } = await resend.emails.send({
                from: 'Vayu Deals <deals@resend.dev>', // Use default resend testing domain or configured one
                to: sub.email,
                subject: `✈️ DEAL ALERT: ${deal.destination} for ₹${deal.price.toLocaleString()}`,
                html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h1 style="color: #0f172a; margin-bottom: 0;">Flight Price Drop</h1>
                    <p style="color: #64748b; margin-top: 5px;">Bangalore (BLR) to ${deal.destination}</p>
                    
                    <div style="margin: 20px 0;">
                        <img src="${deal.image}" alt="${deal.destination}" style="width: 100%; border-radius: 8px; height: 300px; object-fit: cover;" />
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="font-size: 24px; color: #0f172a; margin: 0;">₹${deal.price.toLocaleString()}</h2>
                        <p style="text-decoration: line-through; color: #94a3b8; margin: 5px 0 0;">Typical Price: ₹${deal.original_price.toLocaleString()}</p>
                        <p style="color: #22c55e; font-weight: bold; margin-top: 5px;">🔥 ${deal.savings} Savings</p>
                        <p style="color: #475569;">Dates: ${deal.dates}</p>
                        <p style="color: #475569;">Airline: ${deal.airline}</p>
                    </div>

                    <a href="${deal.booking_link}" style="display: block; width: 100%; text-align: center; background: #2563eb; color: white; padding: 15px 0; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Book Now
                    </a>

                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        Prices change quickly. Book soon if you see this.
                    </p>
                </div>
            `
            });

            if (!error) {
                sentCount++;
            } else {
                console.error(`Failed to send to ${sub.email}`, error);
            }
        }

        return NextResponse.json({
            message: `Newsletter sent to ${sentCount}/${subscribers.length} subscribers`,
            deal: deal.destination
        });

    } catch (error) {
        console.error('Newsletter Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
