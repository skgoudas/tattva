import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { fetchGoogleFlights } from '@/lib/dataforseo';

// Configurable routes to search for
const ROUTES = [
    // BLR - Bangalore
    { origin: 'BLR', destination: 'JFK', name: 'New York', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'CDG', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },

    // DEL - Delhi
    { origin: 'DEL', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'CDG', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'SIN', name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },

    // BOM - Mumbai
    { origin: 'BOM', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'JFK', name: 'New York', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },

    // MAA - Chennai
    { origin: 'MAA', destination: 'SIN', name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },
    { origin: 'MAA', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },

    // HYD - Hyderabad
    { origin: 'HYD', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'HYD', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' }
];

export async function GET(request) {
    // Simple protection
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        return NextResponse.json({
            error: 'Configuration Error',
            message: 'DATAFORSEO credentials missing. Please add them to .env.local'
        }, { status: 500 });
    }

    let newDealsCount = 0;

    try {
        for (const route of ROUTES) {
            // Randomize dates to check different windows (between 21 and 90 days out)
            const daysOut = Math.floor(Math.random() * (90 - 21) + 21);
            const date = new Date();
            date.setDate(date.getDate() + daysOut);
            const departureDate = date.toISOString().split('T')[0];

            const dateReturn = new Date(date);
            dateReturn.setDate(dateReturn.getDate() + 7); // 1 week trip
            const returnDate = dateReturn.toISOString().split('T')[0];

            // Fetch from DataForSEO
            const data = await fetchGoogleFlights({
                origin: route.origin,
                destination: route.destination,
                departureDate,
                returnDate
            });


            // Parse response - DataForSEO Organic structure
            const task = data.tasks?.[0];
            const result = task?.result?.[0];
            const items = result?.items || [];

            // Find the google_flights item in the SERP
            const flightWidget = items.find(i => i.type === 'google_flights');
            const flightItems = flightWidget?.items || [];

            // Find the cheapest flight (first item in the widget list typically)
            const bestFlight = flightItems[0];

            if (bestFlight) {
                // Parse description for price (Format: "Airline    Duration   Nonstop   from ₹19,517")
                // We look for the last number in the string which is usually the price
                const description = bestFlight.description || '';

                // Regex to find price: looks for 'from' followed by currency symbol (optional) and digits/commas
                // Or just grab the last sequence of digits/commas
                const priceMatch = description.match(/from\s+[^0-9]*([\d,]+)/i);

                let priceVal = 0;
                if (priceMatch && priceMatch[1]) {
                    priceVal = parseInt(priceMatch[1].replace(/,/g, ''));
                } else {
                    // Fallback: try to find any large number at the end
                    const matches = description.match(/([\d,]+)/g);
                    if (matches && matches.length > 0) {
                        const lastNum = matches[matches.length - 1];
                        priceVal = parseInt(lastNum.replace(/,/g, ''));
                    }
                }

                // Parse airline from description (start of string until multiple spaces or time?)
                // Simple heuristic: Take the first word or two? Or split by multiple spaces.
                // "IndiGo      3h 55m..." -> "IndiGo"
                const parts = description.split(/\s{2,}/); // Split by 2+ spaces
                const airline = parts[0] || 'Multiple Airlines';

                // Use the direct URL provided in the element if available
                const bookingLink = bestFlight.url || `https://www.google.com/travel/flights?q=Flights%20to%20${route.destination}%20from%20${route.origin}%20on%20${departureDate}%20through%20${returnDate}`;

                if (priceVal > 0) {
                    // Insert unconditional 'Best Price' deal
                    await db.execute({
                        sql: `INSERT INTO deals (origin, destination, price, original_price, dates, airline, savings, image, booking_link, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [
                            route.origin,
                            route.destination,
                            priceVal,
                            null, // No original price comparison available
                            `${departureDate} - ${returnDate}`,
                            airline,
                            "Best Price", // Label
                            route.image,
                            bookingLink
                        ]
                    });
                    newDealsCount++;
                }
            }

            // Sleep briefly to avoid rate limits if any
            await new Promise(r => setTimeout(r, 1000));
        }

        return NextResponse.json({ message: `Fetched ${newDealsCount} deals` });

    } catch (error) {
        console.error('Fetch Deals Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
