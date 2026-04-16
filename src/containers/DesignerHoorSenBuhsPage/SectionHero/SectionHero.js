import React from 'react';
import { NamedLink } from '../../../components';
import css from './SectionHero.module.css';
import { FormattedMessage } from '../../../../src/util/reactIntl';
import reworkImage from './hoor_sen_buhs_image.png';
import hoorsenbuhsLogo from './hoor_sen_buhs_logo.png';

const SectionHero = () => {
  return (
    <div className={css.root}>
      <img src={reworkImage} className={css.image} />

      <div className={css.textSection}>
        {/* <h2 className={css.mainTitle}> */}
        {/* <FormattedMessage id="Scosha.title" /> */}
        {/* SCOSHA */}
        {/* </h2> */}
        <img src={hoorsenbuhsLogo} className={css.imageLogo} />

        <p className={css.mainTitle}>
          {/* <FormattedMessage id="Scosha.text1" /> */}
          <FormattedMessage id="HoorSenBuhs.text1" />
        </p>

        <p className={css.text}>
          <FormattedMessage id="HoorSenBuhs.text2" />
        </p>
      </div>
    </div>
  );
};

export default SectionHero;
