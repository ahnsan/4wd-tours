import React from 'react';
import Image from 'next/image';
import styles from './Footer.module.css';

const instagramImages = [
  '/images/footer.png',
  '/images/footer.png',
  '/images/footer.png',
  '/images/footer.png',
  '/images/footer.png',
];

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <section className={styles.instagramSection} aria-labelledby="instagram-heading">
        <p className={styles.instagramTitle}>
          CURIOUS ABOUT OUR LATEST JOURNEY?
        </p>
        <h2 id="instagram-heading" className={styles.instagramHandle}>
          FOLLOW @SUNSHINECOAST_4WD ON INSTAGRAM!
        </h2>
        <div className={styles.instagramGrid} role="list" aria-label="Instagram photo gallery">
          {instagramImages.map((img, index) => (
            <a
              key={index}
              href="https://instagram.com/sunshinecoast_4wd"
              className={styles.instagramImage}
              role="listitem"
              aria-label={`View Instagram post ${index + 1} - Sunshine Coast 4WD tour adventure photo`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={img}
                alt={`Sunshine Coast 4WD tour adventure photo ${index + 1} from our Instagram feed`}
                width={260}
                height={260}
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 260px"
                quality={75}
              />
            </a>
          ))}
        </div>
      </section>

      <div className={styles.footerContent}>
        <div className={styles.footerColumn}>
          <div className={styles.logo}>
            <h3>SUNSHINE COAST</h3>
            <p>4WD TOURS</p>
          </div>
          <nav className={styles.socialIcons} aria-label="Social media links">
            <a href="https://facebook.com" aria-label="Visit our Facebook page" target="_blank" rel="noopener noreferrer">F</a>
            <a href="https://instagram.com/sunshinecoast_4wd" aria-label="Follow us on Instagram" target="_blank" rel="noopener noreferrer">IG</a>
            <a href="https://youtube.com" aria-label="Subscribe to our YouTube channel" target="_blank" rel="noopener noreferrer">YT</a>
          </nav>
          <nav aria-label="Legal information">
            <ul className={styles.legalLinks}>
              <li><a href="#terms">Terms & Conditions</a></li>
              <li><a href="#refund">Refund Policy</a></li>
              <li><a href="#cancellation">Cancellation Policy</a></li>
              <li><a href="#tagalong">Tag Along Terms & Conditions</a></li>
            </ul>
          </nav>
        </div>

        <section className={styles.footerColumn} aria-labelledby="office-details-heading">
          <h4 id="office-details-heading">OFFICE DETAILS</h4>
          <address>
            <p><strong>Mobile:</strong> <a href="tel:+81405280017">+81.40.528.017</a></p>
            <p><strong>Local:</strong> <a href="tel:0741266286">(07) 4126.6286</a></p>
            <br />
            <p><strong>Mon - Fri:</strong> 8:30am - 2:00pm</p>
            <p><strong>Sat:</strong> 6:50am - 12:00pm</p>
            <br />
            <p><strong>Postal Address:</strong></p>
            <p>6 Southern Cross Circuit</p>
            <p>URANGAN QLD 4635</p>
          </address>
        </section>

        <nav className={styles.footerColumn} aria-labelledby="tours-heading">
          <h4 id="tours-heading">TOURS & ADVENTURES</h4>
          <ul>
            <li><a href="#1day-hire">1 Day 4WD Hire</a></li>
            <li><a href="#multiday-hire">Multi Day 4WD Hire</a></li>
            <li><a href="#couples-camper">4WD Couples Camper</a></li>
            <li><a href="#camping">4WD Camping</a></li>
            <li><a href="#tagalong">3 Day Tag Along Tour</a></li>
            <li><a href="#hike">Hike Tours</a></li>
            <li><a href="#accommodation">4WD + Accommodation</a></li>
          </ul>
        </nav>

        <section className={styles.footerColumn} aria-labelledby="affiliates-heading">
          <h4 id="affiliates-heading">AFFILIATE SITES</h4>
          <div className={styles.affiliateLogos} role="list" aria-label="Partner organizations">
            <a href="#kgari-hiking" className={styles.affiliateLogo} role="listitem" aria-label="Visit K'gari Hiking">K'GARI HIKING</a>
            <a href="#brengabba" className={styles.affiliateLogo} role="listitem" aria-label="Visit Brengabba Hiking">BRENGABBA HIKING</a>
            <a href="#house" className={styles.affiliateLogo} role="listitem" aria-label="Visit Bringaberalong House">BRINGABERALONG HOUSE!</a>
            <div className={styles.affiliateLogo} role="listitem" aria-label="Eco Certified Tourism">ECO CERTIFIED</div>
          </div>
        </section>
      </div>

      <div className={styles.copyright} role="contentinfo">
        <p>&copy; SUNSHINE COAST 4WD TOURS ALL RIGHTS RESERVED.</p>
        <p>WEB DESIGN BY <a href="https://deeperlook.com" target="_blank" rel="noopener noreferrer">DEEPERLOOK</a></p>
      </div>
    </footer>
  );
}
