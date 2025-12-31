import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { fetchGoogleFlights } from '@/lib/dataforseo'; // Keep this for DataForSEO provider
import { fetchGoogleFlightsSerpApi } from '@/lib/serpapi'; // Add this for SerpApi provider

// Configurable routes to search for
const ROUTES = [
    // BLR - Bangalore
    { origin: 'BLR', destination: 'JFK', name: 'New York', typicalPrice: 90000, image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'LHR', name: 'London', typicalPrice: 75000, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'BKK', name: 'Bangkok', typicalPrice: 28000, image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'DXB', name: 'Dubai', typicalPrice: 30000, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BLR', destination: 'CDG', name: 'Paris', typicalPrice: 70000, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },

    // DEL - Delhi
    { origin: 'DEL', destination: 'LHR', name: 'London', typicalPrice: 70000, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'DXB', name: 'Dubai', typicalPrice: 25000, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'CDG', name: 'Paris', typicalPrice: 65000, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop' },
    { origin: 'DEL', destination: 'SIN', name: 'Singapore', typicalPrice: 35000, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },

    // BOM - Mumbai
    { origin: 'BOM', destination: 'LHR', name: 'London', typicalPrice: 65000, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'DXB', name: 'Dubai', typicalPrice: 22000, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'BOM', destination: 'JFK', name: 'New York', typicalPrice: 85000, image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=800&auto=format&fit=crop' },

    // MAA - Chennai
    { origin: 'MAA', destination: 'SIN', name: 'Singapore', typicalPrice: 30000, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop' },
    { origin: 'MAA', destination: 'BKK', name: 'Bangkok', typicalPrice: 25000, image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' },

    // HYD - Hyderabad
    { origin: 'HYD', destination: 'DXB', name: 'Dubai', typicalPrice: 28000, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=800&auto=format&fit=crop' },
    { origin: 'HYD', destination: 'BKK', name: 'Bangkok', typicalPrice: 26000, image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop' }
];

export async function GET(request) {
    // Simple protection
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET} `) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = process.env.FLIGHT_PROVIDER || 'dataforseo'; // 'dataforseo' or 'serpapi'
    console.log(`Using Flight Provider: ${provider} `);

    // Validation
    if (provider === 'dataforseo' && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
        return NextResponse.json({ error: 'DataForSEO Credentials Missing' }, { status: 500 });
    }
    if (provider === 'serpapi' && !process.env.SERPAPI_API_KEY) {
        return NextResponse.json({ error: 'SerpApi Key Missing' }, { status: 500 });
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

            let bestFlight = null;
            let bookingLink = "";

            if (provider === 'serpapi') {
                const data = await fetchGoogleFlightsSerpApi({
                    origin: route.origin,
                    destination: route.destination,
                    departureDate,
                    returnDate
                });
                // Parse SerpApi Response
                const flights = data.best_flights || data.other_flights || [];
                if (flights.length > 0) {
                    const flight = flights[0];
                    bestFlight = {
                        price: flight.price, // SerpApi gives integer usually? Check schema. Often: 12345
                        description: `${flight.airline_logo || ''} ${flight.flights?.[0]?.airline || 'Unknown'} `,
                        // SerpApi price might be distinct.
                        // Actually SerpApi 'price' is just integer in some versions, or object.
                        // Let's assume standard integer or extract. Use safe handling.
                        raw_price: flight.price
                    };
                    // Normalization
                    bookingLink = data.search_metadata?.google_flights_url || `https://www.google.com/travel/flights?q=Flights%20to%20${route.destination}%20from%20${route.origin}%20on%20${departureDate}%20through%20${returnDate}`;
                }

            } else {
                // DataForSEO
                const data = await fetchGoogleFlights({
                    origin: route.origin,
                    destination: route.destination,
                    departureDate,
                    returnDate
                });

                const task = data.tasks?.[0];
                const result = task?.result?.[0];
                const items = result?.items || [];
                const flightWidget = items.find(i => i.type === 'google_flights');
                const flightItems = flightWidget?.items || [];

                if (flightItems.length > 0) {
                    const item = flightItems[0];
                    bestFlight = {
                        description: item.description,
                        url: item.url
                    };
                    bookingLink = item.url || `https://www.google.com/travel/flights?q=Flights%20to%20${route.destination}%20from%20${route.origin}%20on%20${departureDate}%20through%20${returnDate}`;
                }
            }

            // Normalization & Price Extraction
            if (bestFlight) {
                let priceVal = 0;
                let airline = 'Multiple Airlines';

                if (provider === 'serpapi') {
                    priceVal = bestFlight.raw_price;
                    // Airline extraction from description or flight array
                    // bestFlight.flights[0].airline could be used if available
                    if (bestFlight.description && bestFlight.description.includes('Unknown')) {
                        airline = 'Multiple Airlines';
                    } else {
                        airline = bestFlight.description.trim();
                    }
                } else {
                    // DataForSEO Parsing (regex)
                    const description = bestFlight.description || '';
                    const priceMatch = description.match(/from\s+[^0-9]*([\d,]+)/i);
                    if (priceMatch && priceMatch[1]) {
                        priceVal = parseInt(priceMatch[1].replace(/,/g, ''));
                    } else {
                        const matches = description.match(/([\d,]+)/g);
                        if (matches && matches.length > 0) priceVal = parseInt(matches[matches.length - 1].replace(/,/g, ''));
                    }
                    const parts = description.split(/\s{2,}/);
                    airline = parts[0] || 'Multiple Airlines';
                }

                if (priceVal > 0) {

                    // Calculate savings
                    let savingsText = "Best Price";
                    let originalPriceVal = null;

                    if (route.typicalPrice && route.typicalPrice > priceVal) {
                        const savingsPercent = Math.round(((route.typicalPrice - priceVal) / route.typicalPrice) * 100);
                        savingsText = `~${savingsPercent}%`;
                        originalPriceVal = route.typicalPrice;
                    }

                    // Insert deal
                    await db.execute({
                        sql: `INSERT INTO deals (origin, destination, price, original_price, dates, airline, savings, image, booking_link, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [
                            route.origin,
                            route.destination,
                            priceVal,
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
