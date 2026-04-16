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

import css from './BookAppointmentPage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const BookAppointmentPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  return (
    <StaticPage
      title="Book Appointment"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'BookAppointmentPage',
        description: 'Book Appointment | Refind',
        name: 'Book Appointment',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <p className={css.content}>
            <h1>Book Appointment</h1>
            <p>
              Don't have time to post your listings?
              <br />
              ReGEM will photograph, post and manage your inventory from our HQ. <br />
              You'll save time and make room for new pieces in your jewelry box, while making money!{' '}
              <br />
              Book your concierge appointment today!
              <br />
            </p>
          </p>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default BookAppointmentPage;
