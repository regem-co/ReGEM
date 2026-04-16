import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import config from '../../config';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/UI.duck';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import facebookImage from '../../assets/refindFacebook-1200x630.jpg';
import twitterImage from '../../assets/refindTwitter-600x314.jpg';

import SectionHero from './SectionHero/SectionHero';
import SectionHowItWorks from '../../containers/LandingPage/SectionHowItWorks/SectionHowItWorks';
import css from './DesignerOctaviaElizabethPage.module.css';
import JoinRefindSection from '../../containers/LandingPage/JoinRefindSection/JoinRefindSection';
import ListingsSection from './ListingsOctaviaElizabethSection/ListingsSection';
import ListingsUnbrandedSection from '../../containers/LandingPage/ListingsUnbrandedSection/ListingsUnbrandedSection';
import Announcement from '../../containers/LandingPage/Announcement/Announcement';
import PressSection from '../../containers/LandingPage/PressSection/PressSection';
import ReWorkSection from '../../containers/LandingPage/ReWorkSection/ReWorkSection';
import SectionNewsLetters from '../../containers/LandingPage/SectionNewsLetters/SectionNewsLetters';
import { createResourceLocatorString } from '../../util/routes';
import routeConfiguration from '../../routing/routeConfiguration';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

export const DesignerOctaviaElizabethPageComponent = props => {
  const { history, intl, location, scrollingDisabled } = props;

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);
  // Schema for search engines (helps them to understand what this page is about)
  // http://schema.org
  // We are using JSON-LD format
  const siteTitle = config.siteTitle;
  const schemaTitle = intl.formatMessage({ id: 'LandingPage.schemaTitle' }, { siteTitle });
  const schemaDescription = intl.formatMessage({ id: 'LandingPage.schemaDescription' });
  const schemaImage = `${config.canonicalRootURL}${facebookImage}`;

  const handleDirectSearch = query => {
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, query));
  };

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      description={schemaDescription}
      title={schemaTitle}
      facebookImages={[{ url: facebookImage, width: 1200, height: 630 }]}
      twitterImages={[
        { url: `${config.canonicalRootURL}${twitterImage}`, width: 600, height: 314 },
      ]}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: schemaDescription,
        name: schemaTitle,
        image: [schemaImage],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer announcement={<Announcement intl={intl} />} />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.heroContainer}>
            <SectionHero
              rootClassName={css.heroRoot}
              className={css.hero}
              history={history}
              location={location}
              intl={intl}
            />
          </div>
          <ul className={css.sections}>

            <li className={css.section}>
              <ListingsSection />
            </li>

          </ul>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

const { bool, object } = PropTypes;

DesignerOctaviaElizabethPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,

  // from withRouter
  history: object.isRequired,
  location: object.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const DesignerOctaviaElizabethPage = compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(DesignerOctaviaElizabethPageComponent);

export default DesignerOctaviaElizabethPage;
