import React from 'react';
import { NamedLink } from '../../../components';
import css from './FinestFindsSection.module.css';
// images
import braceletPic from './images/braceletPic.webp';
import earringsPic from './images/earringsPic.webp';
import necklacePic from './images/necklacePic.webp';
import ringsPic from './images/ringsPic.webp';
import bodyPic from './images/bodyPic.webp';
import mensPic from './images/mensPic.webp';

const FinestFindsSection = () => {
  return (
    <div className={css.wrapper}>
      <h2 className={css.title}>
        <span className={css.mainTitle}>FINEST FINDS: Shop the Ultimate Curation on ReGEM</span>{' '}
        <NamedLink className={css.seeAllButton} name="SearchPage">
          See all
        </NamedLink>
      </h2>
      <div className={css.content}>
        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=necklaces' }}
          className={css.cardWrapper}
        >
          <img src={necklacePic} className={css.cardImage} />
          <p className={css.cardSubtitle}>NECKLACES</p>
        </NamedLink>

        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=bracelets' }}
          className={css.cardWrapper}
        >
          <img src={braceletPic} className={css.cardImage} />
          <p className={css.cardSubtitle}>BRACELETS</p>
        </NamedLink>

        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=earrings' }}
          className={css.cardWrapper}
        >
          <img src={earringsPic} className={css.cardImage} />
          <p className={css.cardSubtitle}>EARRINGS</p>
        </NamedLink>

        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=rings' }}
          className={css.cardWrapper}
        >
          <img src={ringsPic} className={css.cardImage} />
          <p className={css.cardSubtitle}>RINGS</p>
        </NamedLink>

        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=body' }}
          className={css.cardWrapper}
        >
          <img src={bodyPic} className={css.cardImage} />
          <p className={css.cardSubtitle}>BODY</p>
        </NamedLink>

        <NamedLink
          name={'SearchPage'}
          to={{ search: 'pub_category=mens' }}
          className={css.cardWrapper}
        >
          <img src={mensPic} className={css.cardImage} />
          <p className={css.cardSubtitle}>MENS</p>
        </NamedLink>
      </div>

      {/* <div className={css.categoryButtonsWrapper}>
        <NamedLink
          className={css.categoryButton}
          name="SearchPage"
          to={{ search: 'pub_category=body' }}
        >
          BODY
        </NamedLink>

        <NamedLink
          className={css.categoryButton}
          name="SearchPage"
          to={{ search: 'pub_category=mens' }}
        >
          MENS
        </NamedLink>
      </div> */}
    </div>
  );
};

export default FinestFindsSection;
