import React from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <section className={styles.hero} aria-label="Hero section">
        <Image
          src="/images/tours/double-island-point.jpg"
          alt="Double Island Point coastal scenery and 4WD track - Sunshine Coast 4WD Tours adventure destination"
          fill
          priority
          sizes="100vw"
          quality={90}
          className={styles.heroImage}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <nav className={styles.navigation} aria-label="Main navigation">
          <div className={styles.logo}>
            <h1>SUNSHINE COAST</h1>
            <p>4WD TOURS</p>
          </div>
          <ul className={styles.menu} role="menubar">
            <li role="none"><a href="#home" role="menuitem" aria-label="Navigate to home section" aria-current="page">HOME</a></li>
            <li role="none"><a href="#4wd-hire" role="menuitem" aria-label="Navigate to 4WD hire section">4WD HIRE</a></li>
            <li role="none"><a href="#tours" role="menuitem" aria-label="Navigate to tours section">AND TOURS</a></li>
            <li role="none"><a href="#hike" role="menuitem" aria-label="Navigate to hike tours section">HIKE TOURS</a></li>
            <li role="none"><a href="#about" role="menuitem" aria-label="Navigate to about section">ABOUT</a></li>
            <li role="none"><a href="#media" role="menuitem" aria-label="Navigate to media section">MEDIA</a></li>
            <li role="none"><a href="#contact" role="menuitem" aria-label="Navigate to contact section">CONTACT</a></li>
          </ul>
          <button
            className={styles.reserveBtn}
            aria-label="Reserve your 4WD tour experience"
          >
            RESERVE
          </button>
        </nav>

        <main id="main-content" className={styles.heroContent}>
          <h2 className={styles.heroTitle}>
            SUNSHINE COAST<br />
            4WD HIRE & TOURS
          </h2>

          <div className={styles.ctaButtons}>
            <button
              className={styles.ctaDark}
              aria-label="Book your 4WD experience - opens booking form"
            >
              BOOK YOUR 4WD<br />EXPERIENCE
            </button>
            <button
              className={styles.ctaLight}
              aria-label="Explore summer tours on the Sunshine Coast"
            >
              ENJOY SUMMER ON THE SUNSHINE COAST
            </button>
          </div>
        </main>

        <p className={styles.subtitle} role="complementary" aria-label="Site tagline">
          BEST SUNSHINE COAST 4WD TOURS
        </p>
      </section>
    </>
  );
}
