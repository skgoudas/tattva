import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Underrated Flight Deals.<br />
                    <span className="text-gradient">Up to 90% Off.</span>
                </h1>
                <p className={styles.subtitle}>
                    We find mistake fares and exclusive deals for Indian travelers.
                    Start exploring the world without breaking the bank.
                </p>
                <div className={styles.ctaGroup}>
                    <a href="#subscribe" className="btn btn-primary" style={{ textDecoration: 'none' }}>Join Premium</a>
                    <a href="#deals" className="btn btn-outline" style={{ textDecoration: 'none' }}>View Deals</a>
                </div>
            </div>
        </section>
    );
}
