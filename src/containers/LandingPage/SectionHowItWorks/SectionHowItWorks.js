import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import { NamedLink } from '../../../components';
//images
import buyer1 from './images/buyer1.webp';
import buyer2 from './images/buyer2.webp';
import buyer3 from './images/buyer3.webp';
import seller1 from './images/seller1.webp';
import seller2 from './images/seller2.webp';
import seller3 from './images/seller3.webp';

import css from './SectionHowItWorks.module.css';
import SliderOnMobile from '../../../components/SliderOnMobile/SliderOnMobile';

const SectionHowItWorks = props => {
  const { rootClassName, className } = props;
  const [tab, setTab] = useState('seller');
  const classes = classNames(rootClassName || css.root, className);

  const sellerData = [
    {
      image: seller1,
      title: <FormattedMessage id="SectionHowItWorks.slide1Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide1Text" />,
    },
    {
      image: seller2,
      title: <FormattedMessage id="SectionHowItWorks.slide2Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide2Text" />,
    },
    {
      image: seller3,
      title: <FormattedMessage id="SectionHowItWorks.slide3Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide3Text" />,
    },
  ];

  const buyerData = [
    {
      image: buyer1,
      title: <FormattedMessage id="SectionHowItWorks.slide4Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide4Text" />,
    },
    {
      image: buyer2,
      title: <FormattedMessage id="SectionHowItWorks.slide5Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide5Text" />,
    },
    {
      image: buyer3,
      title: <FormattedMessage id="SectionHowItWorks.slide6Title" />,
      body: <FormattedMessage id="SectionHowItWorks.slide6Text" />,
    },
  ];

  const displayData = tab === 'buyer' ? buyerData : sellerData;
  return (
    <div className={classes}>
      <center>
        <h2 className={css.title}>
          {' '}
          <FormattedMessage id="SectionHowItWorks.title" />
        </h2>
      </center>
      <div className={css.tabsWrapper}>
        <div
          className={tab === 'buyer' ? css.selectedTab : css.tab}
          onClick={() => setTab('buyer')}
        >
          <FormattedMessage id="SectionHowItWorks.tab1" />
        </div>
        <div
          className={tab === 'seller' ? css.selectedTab : css.tab}
          onClick={() => setTab('seller')}
        >
          <FormattedMessage id="SectionHowItWorks.tab2" />
        </div>
      </div>

      <SliderOnMobile
        desktopContent={
          <div className={css.infoBoxesWrapper}>
            {displayData.map((d, index) => {
              return (
                <div className={css.box} key={`${index}`}>
                  <img src={d.image} className={css.boxImage} />
                  <p className={css.boxTitle}>{d.title}</p>
                  <p className={css.boxBody}>{d.body}</p>
                </div>
              );
            })}
          </div>
        }
        slidesForMobile={displayData.map((d, index) => {
          return (
            <div className={css.box} key={`${index}`}>
              <img src={d.image} className={css.boxImage} />
              <p className={css.boxTitle}>{d.title}</p>
              <p className={css.boxBody}>{d.body}</p>
            </div>
          );
        })}
        noPreview={true}
        showDots={true}
      />
    </div>
  );
};

SectionHowItWorks.defaultProps = { rootClassName: null, className: null };

const { string } = PropTypes;

SectionHowItWorks.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHowItWorks;
