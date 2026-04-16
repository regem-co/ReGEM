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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';

import contactUsImage from './contactUsImage.jpg';
import css from './ContactPage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const ContactPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  return (
    <StaticPage
      title="Contact Us"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ContactPage',
        description: 'Contact | Refind',
        name: 'Contact page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <img className={css.image} src={contactUsImage} />
          <div className={css.section}>
            <h1 className={css.title}>Drop us a line!</h1>
            <p className={css.subtitle}>
              Get expert help from our always-on customer support.
              <br /> Reach us through email or live chat!
            </p>

            <div className={css.contactBox}>
              <a href="mailto:hello@joinrefind.com" className={css.contactBoxLine}>
                {' '}
                <EmailIcon className={css.icon} /> hello@joinrefind.com
              </a>
              {/* <div className={css.contactBoxLine}>
                <LocalPhoneIcon className={css.icon} /> (424) 255-5543
              </div> */}
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

export default ContactPage;
