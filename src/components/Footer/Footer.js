import React from 'react';
import { string } from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import { twitterPageURL } from '../../util/urlHelpers';
import config from '../../config';
import {
  IconSocialMediaFacebook,
  IconSocialMediaInstagram,
  IconSocialMediaTwitter,
  Logo,
  ExternalLink,
  NamedLink,
} from '../../components';

import css from './Footer.module.css';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import tiktokIcon from './images/tiktokIcon.png';

const renderSocialMediaLinks = intl => {
  const { siteFacebookPage, siteInstagramPage, siteTwitterHandle, siteTiktokPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  const goToFb = intl.formatMessage({ id: 'Footer.goToFacebook' });
  const goToInsta = intl.formatMessage({ id: 'Footer.goToInstagram' });
  const goToTwitter = intl.formatMessage({ id: 'Footer.goToTwitter' });

  const tiktokLink = siteTiktokPage ? (
    <ExternalLink
      key="linkToTikTok"
      href={siteTiktokPage}
      className={css.icon}
      title={'Go to TikTok'}
    >
      <img src={tiktokIcon} className={css.smallIcon} />
    </ExternalLink>
  ) : null;

  const fbLink = siteFacebookPage ? (
    <ExternalLink key="linkToFacebook" href={siteFacebookPage} className={css.icon} title={goToFb}>
      <IconSocialMediaFacebook />
    </ExternalLink>
  ) : null;

  const twitterLink = siteTwitterPage ? (
    <ExternalLink
      key="linkToTwitter"
      href={siteTwitterPage}
      className={css.icon}
      title={goToTwitter}
    >
      <IconSocialMediaTwitter />
    </ExternalLink>
  ) : null;

  const instragramLink = siteInstagramPage ? (
    <ExternalLink
      key="linkToInstagram"
      href={siteInstagramPage}
      className={css.icon}
      title={goToInsta}
    >
      <IconSocialMediaInstagram />
    </ExternalLink>
  ) : null;
  return [fbLink, twitterLink, instragramLink, tiktokLink].filter(v => v != null);
};

const Footer = props => {
  const { rootClassName, className, intl, currentUser } = props;
  const socialMediaLinks = renderSocialMediaLinks(intl);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.topBorderWrapper}>
        <div className={css.content}>
          <div className={css.someLiksMobile}>{socialMediaLinks}</div>
          <div className={css.links}>
            <div className={css.organization} id="organization">
              <NamedLink name="LandingPage" className={css.logoLink}>
                <Logo format="desktop" className={css.logo} />
              </NamedLink>
              <div className={css.organizationInfo}>
                <p className={css.organizationDescription}>
                  <FormattedMessage id="Footer.organizationDescription" />
                </p>
                <p className={css.organizationCopyright}>
                  <NamedLink name="LandingPage" className={css.copyrightLink}>
                    <FormattedMessage id="Footer.copyright" />
                  </NamedLink>
                  <br />
                  <FormattedMessage id="Footer.allRightsReserved" />
                </p>
              </div>
            </div>

            <div className={css.infoLinks}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  <NamedLink name="NewListingPage" className={css.link}>
                    <FormattedMessage id="Footer.sell" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink name="SearchPage" className={css.link}>
                    <FormattedMessage id="Footer.buy" />
                  </NamedLink>
                </li>
                {!currentUser && (
                  <>
                    <li className={css.listItem}>
                      <NamedLink name="LoginPage" className={css.link}>
                        <FormattedMessage id="Footer.login" />
                      </NamedLink>
                    </li>
                    <li className={css.listItem}>
                      <NamedLink name="SignupPage" className={css.link}>
                        <FormattedMessage id="Footer.signup" />
                      </NamedLink>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className={css.searches}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'selling-tips' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.sellingTips" />
                  </NamedLink>
                </li>

                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'buying-tips' }} className={css.link}>
                    <FormattedMessage id="Footer.buyingTips" />
                  </NamedLink>
                </li>

                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'size-guide' }} className={css.link}>
                    <FormattedMessage id="Footer.sizeGuides" />
                  </NamedLink>
                </li>

                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'shipping' }} className={css.link}>
                    <FormattedMessage id="Footer.shippingGuide" />
                  </NamedLink>
                </li>
              </ul>
            </div>

            <div className={css.searches}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'faq' }} className={css.link}>
                    <FormattedMessage id="Footer.toFAQPage" />
                  </NamedLink>
                </li>

                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'privacy-policy' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.privacyPolicy" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'terms-of-service' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.termsOfService" />
                  </NamedLink>
                </li>

                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'returnpolicy' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.returnPolicy" />
                  </NamedLink>
                </li>
              </ul>
            </div>

            <div className={css.searches}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'book-appointment' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.bookAppointment" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink
                    name="CMSPage"
                    params={{ pageId: 'authentication' }}
                    className={css.link}
                  >
                    <FormattedMessage id="Footer.ourAuthentication" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'about' }} className={css.link}>
                    <FormattedMessage id="Footer.aboutUs" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink name="CMSPage" params={{ pageId: 'contact' }} className={css.link}>
                    <FormattedMessage id="Footer.toContactPage" />
                  </NamedLink>
                </li>
              </ul>
            </div>

            <div className={css.extraLinks}>
              <div className={css.someLinks}>{socialMediaLinks}</div>
            </div>
          </div>
          <div className={css.copyrightAndTermsMobile}>
            <NamedLink name="LandingPage" className={css.organizationCopyrightMobile}>
              <FormattedMessage id="Footer.copyright" />
            </NamedLink>
            {/* <div className={css.tosAndPrivacyMobile}>
              <NamedLink name="PrivacyPolicyPage" className={css.privacy}>
                <FormattedMessage id="Footer.privacy" />
              </NamedLink>
              <NamedLink name="TermsOfServicePage" className={css.terms}>
                <FormattedMessage id="Footer.terms" />
              </NamedLink>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

Footer.defaultProps = {
  rootClassName: null,
  className: null,
};

Footer.propTypes = {
  rootClassName: string,
  className: string,
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return { currentUser };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const FooterComponent = compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(Footer);

export default FooterComponent;
