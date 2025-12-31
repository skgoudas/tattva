
import { getJson } from "serpapi";

export async function fetchGoogleFlightsSerpApi(params) {
    const { origin, destination, departureDate, returnDate } = params;

    return new Promise((resolve, reject) => {
        getJson({
            engine: "google_flights",
            departure_id: origin,
            arrival_id: destination,
            outbound_date: departureDate,
            return_date: returnDate,
            currency: "INR",
            gl: "in",
            hl: "en",
            api_key: process.env.SERPAPI_API_KEY
        }, (json) => {
            if (json.error) {
                reject(new Error(json.error));
            } else {
                resolve(json);
            }
        });
    });
}
