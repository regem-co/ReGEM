import React, { useEffect, useState } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import carouselImage1 from './images/carouselPic1.jpg';
import carouselImage2 from './images/carouselPic2.jpg';
import carouselImage3 from './images/carouselPic3.jpg';
import carouselImage4 from './images/carouselPic4.jpg';
import carouselImage5 from './images/carouselPic5.jpg';

import css from './SectionHero.module.css';
import KeywordsSearch from './KeywordsSearch/KeywordsSearch';

import { Carousel } from 'react-responsive-carousel';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState('buy');
  const { rootClassName, className, history, intl } = props;

  useEffect(() => {
    setMounted(true);
    require('react-responsive-carousel/lib/styles/carousel.min.css');
  }, []);

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={css.wrapper}>
      <div className={css.carouselWrapper}>
        <Carousel
          showThumbs={false}
          showArrows={false}
          showStatus={false}
          autoPlay={true}
          interval={3000}
          stopOnHover={false}
          infiniteLoop
        >
          <div className={css.carouselSlide}>
            <img src={carouselImage1} className={css.slideImage} />
          </div>
          <div className={css.carouselSlide}>
            <img src={carouselImage2} className={css.slideImage} />
          </div>
          <div className={css.carouselSlide}>
            <img src={carouselImage3} className={css.slideImage} />
          </div>
          <div className={css.carouselSlide}>
            <img src={carouselImage4} className={css.slideImage} />
          </div>
          {/* <div className={css.carouselSlide}>
            <img src={carouselImage5} className={css.slideImage} />
          </div> */}
        </Carousel>
      </div>

      <div className={css.heroContent}>
        <div className={css.formWrapper}>
          <div className={css.tabs}>
            <span
              onClick={() => setTab('buy')}
              className={tab === 'buy' ? css.selectedTab : css.tab}
            >
              {intl.formatMessage({ id: 'SectionHero.firstTabTitle' })}
            </span>{' '}
            <span
              onClick={() => setTab('sell')}
              className={tab !== 'buy' ? css.selectedTab : css.tab}
            >
              {intl.formatMessage({ id: 'SectionHero.secondTabTitle' })}
            </span>
          </div>

          {tab === 'buy' && (
            <>
              <p className={css.heroText}>
                {intl.formatMessage({ id: 'SectionHero.firstTabDetails' })}
              </p>
              <KeywordsSearch history={history} />
              {/* <NamedLink name="SearchPage" className={css.searchLink}>
                Advanced search
              </NamedLink> */}
            </>
          )}

          {tab !== 'buy' && (
            <>
              <p className={css.heroText}>
                {intl.formatMessage({ id: 'SectionHero.secondTabDetails' })}
              </p>
              <NamedLink name="NewListingPage" className={css.newListingLink}>
                {intl.formatMessage({ id: 'SectionHero.secondTabButton' })}
              </NamedLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

SectionHero.defaultProps = { rootClassName: null, className: null };

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
