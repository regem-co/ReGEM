import React from 'react';
import { NamedLink } from '../../../components';
import css from './JoinRefindSection.module.css';
import { FormattedMessage } from 'react-intl';
import joinRefindBackground from './joinRefindBackground.jpg';

const JoinRefindSection = () => {
  return (
    <div className={css.root}>
      <div className={css.textSection}>
        <p className={css.mainTitle}>
          <FormattedMessage id="JoinRefindSection.text1" />
        </p>

        <p className={css.text2}>
          <FormattedMessage id="JoinRefindSection.text2" />
        </p>

        <NamedLink className={css.learnMoreButton} name={'NewListingPage'}>
          <FormattedMessage id="JoinRefindSection.text3" />
        </NamedLink>
      </div>

      <img src={joinRefindBackground} className={css.image} />
    </div>
  );
};

export default JoinRefindSection;
