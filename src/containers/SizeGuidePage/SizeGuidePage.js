import React, { useEffect } from 'react';

import config from '../../config';
import { twitterPageURL } from '../../util/urlHelpers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ExternalLink,
} from '../../components';
import StaticPage from '../../containers/StaticPage/StaticPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import earringImage1 from './images/earringImage1.jpg';
import earringImage2 from './images/earringImage2.jpg';
import necklaceImage1 from './images/necklaceImage1.jpg';
import necklaceImage2 from './images/necklaceImage2.jpg';

import css from './SizeGuidePage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const SizeGuidePage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  return (
    <StaticPage
      title="Size Guide"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'SizeGuidePage',
        description: 'Size Guide | Refind',
        name: 'Size Guide',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <div className={css.content}>
            <h1>Jewelry Sizing And Fitting</h1>
            <p className={css.subTitle}>
              We all know rings have sizes, but did you know there’s a real way all jewelry is
              supposed to fit? Not to worry, we’ve made it simple to get it right whether you’re
              treating yourself or treating a very lucky someone else.
            </p>

            <div className={css.section}>
              <div className={css.subSection}>
                <p>
                  <b>Earrings</b>
                </p>
                <p>
                  Earring size only matters for huggies. Choose the size based on where it's going
                  on the ear and how you want it positioned. This diagram makes it easy:
                </p>
                <img src={earringImage1} className={css.sectionImg} />
              </div>
              <div className={css.subSection}>
                <img src={earringImage2} className={css.sectionImg} />
              </div>
            </div>

            <div className={css.section}>
              <div className={css.subSection}>
                <p>
                  <b>Bracelets</b>
                </p>
                <p>
                  Bracelets are sized by length. Just measure a bracelet you like or wrap a string
                  or soft measuring tape around your wrist to get the right size. 6.5, 7, 7.5 ,and
                  8-inch bracelets.
                </p>
                <img src={necklaceImage1} className={css.sectionImg} />
              </div>
              <div className={css.subSection}>
                <p>
                  <b>Necklaces</b>
                </p>
                <p>
                  Necklaces are also sized by length, and you should choose what's right for you
                  based on where you want it to fall on your neck. Use this diagram to pick:
                </p>
                <img src={necklaceImage2} className={css.sectionImg} />
              </div>
            </div>
          </div>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default SizeGuidePage;
