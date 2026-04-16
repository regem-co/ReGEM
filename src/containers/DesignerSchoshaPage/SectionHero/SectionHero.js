import React from 'react';
import { NamedLink } from '../../../components';
import css from './SectionHero.module.css';
import { FormattedMessage } from 'react-intl';
import reworkImage from './scosha.jpg';
import scoshaLogo from './scosha_logo.png';

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
          {/* <FormattedMessage id="Scosha.text1" /> */}

          BRAND PARTNER

        </p>

        <p className={css.text}>
          {/* <FormattedMessage id="Scosha.text2" /> */}
          It was in the local craft markets of Jericoacoara, Brazil that Australian-born Scosha Woolridge sold her very first piece of handmade jewelry; this was the beginning of a passion for jewelry making that continues to this day. Being an avid traveler, Scosha draws her inspiration from the cultures she has observed on her expeditions through the Middle East, North Africa, South Asia, and South America.
        </p>

        
      </div>
    </div>
  );
};

export default SectionHero;
