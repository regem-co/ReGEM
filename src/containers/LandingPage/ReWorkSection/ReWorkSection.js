import React from 'react';
import { NamedLink } from '../../../components';
import css from './ReWorkSection.module.css';
import { FormattedMessage } from 'react-intl';
import reworkImage from './reworkImage.jpg';

const ReWorkSection = () => {
  return (
    <div className={css.root}>
      <img src={reworkImage} className={css.image} />

      <div className={css.textSection}>
        <h2 className={css.mainTitle}>
          <FormattedMessage id="ReWorkSection.title" />
        </h2>

        <p className={css.text}>
          <FormattedMessage id="ReWorkSection.text1" />
        </p>

        <p className={css.text}>
          <FormattedMessage id="ReWorkSection.text2" />
        </p>

        <a href="https://calendar.app.google/Gv7iLanage6HRYqt8" className={css.learnMoreButton} target="_blank">
          <FormattedMessage id="ReWorkSection.LearnMore" />
        </a>
      </div>
    </div>
  );
};

export default ReWorkSection;
