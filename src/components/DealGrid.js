"use client";
import { useEffect, useState } from 'react';
import DealCard from './DealCard';

export default function DealGrid() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrigin, setSelectedOrigin] = useState('All');

    useEffect(() => {
        fetch('/api/deals')
            .then(res => res.json())
            .then(data => {
                setDeals(data.deals);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Extract unique origins from deals
    const origins = ['All', ...new Set(deals.map(deal => deal.origin))].sort();

    const filteredDeals = selectedOrigin === 'All'
        ? deals
        : deals.filter(deal => deal.origin === selectedOrigin);

    if (loading) {
        return (
            <section className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                <p>Loading best deals...</p>
            </section>
        );
    }

    return (
        <section id="deals" className="container" style={{ padding: '4rem 1.5rem' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Latest Flight Drops
                </h2>
                <p style={{ color: '#94a3b8' }}>
                    Hand-picked deals from across the web.
                </p>

                {/* Filter UI */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {origins.map(origin => (
                        <button
                            key={origin}
                            onClick={() => setSelectedOrigin(origin)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                border: '1px solid',
                                borderColor: selectedOrigin === origin ? '#2563eb' : '#334155',
                                background: selectedOrigin === origin ? '#2563eb' : 'transparent',
                                color: selectedOrigin === origin ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {origin === 'All' ? 'All Cities' : origin}
                        </button>
                    ))}
                </div>
            </div>

            {filteredDeals.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {filteredDeals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                    <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No deals found for {selectedOrigin}.</p>
                    <p>Try selecting another city or check back later.</p>
                </div>
            )}
        </section>
    );
}
