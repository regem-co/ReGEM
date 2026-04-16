import React from 'react';
import { NamedLink } from '../../../components';
import css from './SectionHero.module.css';
import { FormattedMessage } from 'react-intl';
import reworkImage from './shylee_rose_image.png';
import scoshaLogo from './shylee_rose_logo.png';

const SectionHero = () => {
  return (
    <div className={css.root}>
      <img src={reworkImage} className={css.image} />

      <div className={css.textSection}>
        {/* <h2 className={css.mainTitle}> */}
          {/* <FormattedMessage id="Scosha.title" /> */}
          {/* SCOSHA */}
        {/* </h2> */}
        <img src={scoshaLogo} className={css.imageLogo} />

        <p className={css.mainTitle}>
          
          BRAND PARTNER

        </p>

        <p className={css.text}>
          {/* <FormattedMessage id="Scosha.text2" /> */}
          Shylee Rose Jewelry aims to create high quality 14k gold jewelry that can be 
          worn everyday and treasured for years to come. Founded in 2003 by Los Angeles native, 
          Erees Beyda, Shylee Rose combines elegance and edge to create a timeless collection 
          of sophisticated jewelry.
        </p>

        
      </div>
    </div>
  );
};

export default SectionHero;
