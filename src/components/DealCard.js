/* eslint-disable @next/next/no-img-element */
import styles from './DealCard.module.css';

export default function DealCard({ deal }) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={deal.image} alt={deal.destination} className={styles.image} />
                {deal.savings && <div className={styles.badge}>{deal.savings} OFF</div>}
            </div>

            <div className={styles.content}>
                <div className={styles.route}>
                    <span>{deal.origin.split(' ')[0]}</span>
                    <span className={styles.arrow}>→</span>
                    <span>{deal.destination.split(' ')[0]}</span>
                </div>
                <div className={styles.airline}>{deal.airline}</div>

                <div className={styles.footer}>
                    <div className={styles.priceInfo}>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>{deal.price}</span>
                            {deal.originalPrice !== deal.price && (
                                <span className={styles.originalPrice}>{deal.originalPrice}</span>
                            )}
                        </div>
                        <span className={styles.dates}>{deal.dates}</span>
                    </div>
                    {deal.bookingLink ? (
                        <a
                            href={deal.bookingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}
                        >
                            Book
                        </a>
                    ) : (
                        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            View
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
