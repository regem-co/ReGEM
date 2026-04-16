import React from 'react';
import { NamedLink } from '../../../components';
import css from './SectionHero.module.css';
import { FormattedMessage } from 'react-intl';
import reworkImage from './octavia_elizabeth_image.png';
import scoshaLogo from './octavia_elizabeth_logo.png';

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
          Designed by Octavia Zamagias and based in Los Angeles, Octavia Elizabeth's collections are inspired by everyday elegance and luxuries. With a commitment to sustainability, Octavia is focused on creating timeless fine jewelry for modern women and men.
<br/>
The OE Collection is gainfully made by artisans in Los Angeles and consciously sourced.
        </p>

        
      </div>
    </div>
  );
};

export default SectionHero;
