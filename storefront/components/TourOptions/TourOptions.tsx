import React from 'react';
import Image from 'next/image';
import styles from './TourOptions.module.css';
import { TOUR_PHOTOS } from '../../lib/data/photo-map';

const tours = [
  {
    id: 1,
    title: 'TAGALONG TOURS',
    description: 'Join Fraser Dingo 4wd Adventures for our relaxed and friendly guided tour staying in beach house accommodation on K\'gari. Adventure by day, comfort by night.',
    image: TOUR_PHOTOS.adventure,
    imageAlt: '4WD vehicle driving on pristine beach - Sunshine Coast 4WD Tours tagalong adventure experience'
  },
  {
    id: 2,
    title: '4WD CAMPING',
    description: 'Want to experience four wheel driving on K\'gari and spend your nights camping under the night sky? Our camping package is a hassle free way — pack less and see more.',
    image: TOUR_PHOTOS.landmarks,
    imageAlt: 'Historic Maheno Shipwreck on 75 Mile Beach, K\'gari - 4WD camping tour destination'
  },
  {
    id: 3,
    title: 'FRASER ISLAND HIKING',
    description: 'Explore K\'gari on foot, with one of Fraser Island Hiking\'s unique hiking packages. Discover the untouched nature when you slow down and walk through the diverse landscapes.',
    image: TOUR_PHOTOS.beach,
    imageAlt: 'Rainbow Beach colored cliffs and golden sand - Fraser Island hiking tour starting point'
  }
];

export default function TourOptions() {
  return (
    <section className={styles.tourOptions} aria-labelledby="tour-options-heading">
      <div className={styles.header}>
        <p className={styles.preTitle} role="doc-subtitle">BEST RAINBOW BEACH & K'GARI 4WD TOURS</p>
        <h2 id="tour-options-heading" className={styles.title}>PICK YOUR K'GARI ADVENTURE</h2>
        <p className={styles.description}>
          We offer a range of products and packages to suit different K'gari (Fraser Island) experiences. Tailor make
          your holiday with a 4WD hire, 4WD tour or hiking package, pilcalse zockages are also offered, please se ininv-
          udual pages for more information. We are based in the beautiful Hervey Bay, gateway
          to the Fraser Coast and Fraser Island. All our packages depart from Hervey Bay.
        </p>
      </div>

      <div className={styles.tourGrid} role="list" aria-label="Available tour options">
        {tours.map((tour) => (
          <article
            key={tour.id}
            className={styles.tourCard}
            role="listitem"
            aria-labelledby={`tour-title-${tour.id}`}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={tour.image}
                alt={tour.imageAlt}
                width={400}
                height={300}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={80}
                className={styles.tourImage}
              />
            </div>
            <h3 id={`tour-title-${tour.id}`} className={styles.tourTitle}>{tour.title}</h3>
            <p className={styles.tourDescription}>{tour.description}</p>
            <button
              className={styles.viewDetailsBtn}
              aria-label={`View details for ${tour.title} tour package`}
            >
              VIEW DETAILS
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
