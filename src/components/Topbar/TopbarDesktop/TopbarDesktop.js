import React, { useState, useEffect } from 'react';
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { propTypes } from '../../../util/types';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../routing/routeConfiguration';
import ShoppingCart from '../ShoppingCart/ShoppingCart';
import {
  Avatar,
  InlineTextButton,
  Logo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  Button,
} from '../../../components';
import NotificationsBell from '../../NotificationsBell/NotificationsBell';

import HoverMenu from './HoverMenu/HoverMenu';
import css from './TopbarDesktop.module.css';
import SearchIcon from '../SearchIcon';
import { useLocation } from 'react-router-dom'; // Import useLocation from react-router-dom
const TopbarDesktop = props => {
  const {
    className,
    currentUser,
    currentPage,
    rootClassName,
    intl,
    isAuthenticated,
    onLogout,
    history,
    onSearchOpen,
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  const search = <div className={css.searchLink} />;

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const profileMenu = authenticatedOnClientSide ? (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        <MenuItem key="ManageListingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/listings', // Add active class conditionally
            })}
            name="ManageListingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.yourListingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="FavListingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/favListings', // Add active class conditionally
            })}
            name="FavListingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.FavListingsPage" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="InboxChats1Page">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/inbox/sales', // Match tab parameter
            })}
            name="InboxPage"
            params={{ tab: 'sales' }}
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="My Sales" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/inbox/orders', // Match tab parameter
            })}
            name="InboxPage"
            params={{ tab: 'orders' }}
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="My Orders" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="InboxChats2Page">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/inbox/chats', // Match tab parameter
            })}
            name="InboxPage"
            params={{ tab: 'chats' }}
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="My Messages" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, {
              [css.currentPage]: useLocation().pathname === '/account/contact-details', // Add active class conditionally
            })}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;

  const signupLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="SignupPage" className={css.signupLink}>
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );

  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );

  return (
    <>
      <nav className={classes}>
        <NamedLink className={css.logoLink} name="LandingPage">
          <Logo
            format="desktop"
            className={css.logo}
            alt={intl.formatMessage({ id: 'TopbarDesktop.logo' })}
          />
        </NamedLink>
        {search}
        {authenticatedOnClientSide && (
          <NamedLink className={css.createListingLink} name="NewListingPage">
            <span className={css.createListing}>
              <FormattedMessage id="TopbarDesktop.createListing" />{' '}
            </span>
          </NamedLink>
        )}

        {signupLink}
        {loginLink}

        {isAuthenticated && <NotificationsBell />}
        <ShoppingCart intl={intl} history={history} currentUser={currentUser} />
        <Button
          rootClassName={css.searchMenu}
          onClick={onSearchOpen}
          title={intl.formatMessage({ id: 'Topbar.searchIcon' })}
        >
          <SearchIcon className={css.searchMenuIcon} />
        </Button>
        {profileMenu}
      </nav>
      <HoverMenu history={history} />
    </>
  );
};

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  onSearchOpen: () => null,
};

TopbarDesktop.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentPage: string,
  isAuthenticated: bool.isRequired,
  onLogout: func.isRequired,
  notificationCount: number,
  intl: intlShape.isRequired,
  onSearchOpen: func,
};

export default TopbarDesktop;
