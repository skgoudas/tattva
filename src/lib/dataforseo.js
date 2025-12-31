
export async function fetchGoogleFlights(params) {
    const { origin, destination, departureDate, returnDate } = params;

    // Construct the task payload for DataForSEO Organic API
    // We search for "flights from [origin] to [destination] on [date] returning [date]"
    // This triggers the Google Flights widget in SERP

    const keyword = `flights from ${origin} to ${destination} on ${departureDate} returning ${returnDate}`;

    const payload = [{
        "keyword": keyword,
        "location_name": "India", // Defaulting to India as origin is usually India for this app
        "language_name": "English",
        "device": "desktop",
        "os": "windows",
        "depth": 100 // Ensure we dig deep enough to find the widget if it's lower down
    }];

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');

    try {
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DataForSEO API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('DataForSEO Fetch Error:', error);
        throw error;
    }
}
