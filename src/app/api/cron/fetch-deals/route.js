import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJson } from 'serpapi';

// Configurable routes to search for
// In a real app, this would be more dynamic or extensive
const ROUTES = [
    // BLR - Bangalore
    { origin: 'BLR', destination: 'JFK', name: 'New York', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea9ba6a80e4?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'CDG', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },

    // DEL - Delhi
    { origin: 'DEL', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea9ba6a80e4?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'CDG', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'SIN', name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },

    // BOM - Mumbai
    { origin: 'BOM', destination: 'LHR', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea9ba6a80e4?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'JFK', name: 'New York', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },

    // MAA - Chennai
    { origin: 'MAA', destination: 'SIN', name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },
    { origin: 'MAA', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },

    // HYD - Hyderabad
    { origin: 'HYD', destination: 'DXB', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea9ba6a80e4?q=80&w=800&auto=format&fit=crop' },
    { origin: 'HYD', destination: 'BKK', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' }
];

export async function GET(request) {
    // Simple protection
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SERPAPI_API_KEY) {
        return NextResponse.json({
            error: 'Configuration Error',
            message: 'SERPAPI_API_KEY is missing. Please add it to .env.local'
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

            // Wrap getJson in a promise
            const results = await new Promise((resolve, reject) => {
                getJson({
                    engine: "google_flights",
                    departure_id: route.origin,
                    arrival_id: route.destination,
                    outbound_date: departureDate,
                    return_date: returnDate,
                    currency: "INR",
                    gl: "in",
                    hl: "en",
                    api_key: process.env.SERPAPI_API_KEY
                }, (json) => {
                    resolve(json);
                });
            });

            const bestFlights = results.best_flights?.[0];

            if (bestFlights) {
                // Extract price insights if available
                const priceInsights = results.price_insights;

                // Parse the current price (remove currency symbol and commas)
                const priceStr = String(bestFlights.price);
                const currentPrice = parseInt(priceStr.replace(/[^0-9]/g, ''));
                const airline = bestFlights.flights?.[0]?.airline || 'Multiple Airlines';

                let originalPriceVal = currentPrice;
                let savingsText = '';
                let savingsPercent = 0;

                if (priceInsights && priceInsights.typical_price_range) {
                    // Use the high end of the typical range as the "original" or "comparison" price
                    const typicalHigh = priceInsights.typical_price_range[1];
                    if (typicalHigh > currentPrice) {
                        originalPriceVal = typicalHigh;
                        savingsPercent = Math.round(((typicalHigh - currentPrice) / typicalHigh) * 100);
                        savingsText = `~${savingsPercent}%`;
                    }
                }

                // Only save deal if savings are 40% or more
                if (savingsPercent >= 40) {
                    const bookingLink = results.search_metadata?.google_flights_url || 'https://www.google.com/travel/flights';

                    await db.execute({
                        sql: `INSERT INTO deals (origin, destination, price, original_price, dates, airline, savings, image, booking_link, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [
                            route.origin,
                            route.destination,
                            currentPrice,
                            originalPriceVal,
                            `${departureDate} - ${returnDate}`,
                            airline,
                            savingsText,
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
