"use client";
import { useState } from 'react';
import styles from './SubscriptionCTA.module.css';

export default function SubscriptionCTA() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <section id="subscribe" className={styles.ctaSection}>
            <div className={styles.content}>
                <h2 className={styles.title}>Never Miss a <span className="text-gradient">Mistake Fare</span></h2>
                <p className={styles.description}>
                    Get instant alerts for flight deals that disappear in minutes.
                    Join thousands of smart travelers saving millions.
                </p>

                <ul className={styles.benefits}>
                    <li><span className={styles.check}>✓</span> Instant Email Alerts</li>
                    <li><span className={styles.check}>✓</span> Custom Departure Cities</li>
                    <li><span className={styles.check}>✓</span> Peak Season Deals</li>
                </ul>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '9999px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={status === 'loading' || status === 'success'}
                    >
                        {status === 'loading' ? 'Joining...' : status === 'success' ? 'Joined!' : 'Join Vayu Club'}
                    </button>
                    {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Something went wrong. Try again.</p>}
                </form>
            </div>
        </section>
    );
}
