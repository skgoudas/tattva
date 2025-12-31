import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className="container">
                <nav className={styles.nav}>
                    <a href="/" className={styles.logo}>
                        Vayu<span>.</span>
                    </a>

                    <div className={styles.actions}>
                        <a href="#subscribe" className="btn btn-primary" style={{ textDecoration: 'none' }}>Join Premium</a>
                    </div>
                </nav>
            </div>
        </header>
    );
}
