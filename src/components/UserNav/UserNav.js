import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { ACCOUNT_SETTINGS_PAGES } from '../../routing/routeConfiguration';
import { LinkTabNavHorizontal } from '../../components';

import css from './UserNav.module.css';

const UserNav = (props) => {
  const { className, rootClassName, selectedPageName, selectedTab } = props;
  const classes = classNames(rootClassName || css.root, className);

  const tabs = [
    {
      text: <FormattedMessage id="ManageListingsPage.yourListings" />,
      selected: selectedPageName === 'ManageListingsPage',
      linkProps: {
        name: 'ManageListingsPage',
      },
    },
    {
      text: <FormattedMessage id="ManageListingsPage.favListingsPageLink" />,
      selected: selectedPageName === 'FavListingsPage',
      linkProps: {
        name: 'FavListingsPage',
      },
    },
    {
      text: <FormattedMessage id="My messages" />,
      selected: selectedPageName === 'InboxPage' && selectedTab === 'chats',
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'chats',
        },
      },
    },
    {
      text: <FormattedMessage id="My sales" />,
      selected: selectedPageName === 'InboxPage' && selectedTab === 'sales',
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'sales',
        },
      },
    },
    {
      text: <FormattedMessage id="ManageListingsPage.inboxPageLinkOrder" />,
      selected: selectedPageName === 'InboxPage' && selectedTab === 'orders',
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'orders',
        },
      },
    },
    {
      text: <FormattedMessage id="ManageListingsPage.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(selectedPageName),
      disabled: false,
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
  ];

  return (
    <LinkTabNavHorizontal className={classes} tabRootClassName={css.tab} tabs={tabs} skin="dark" />
  );
};


UserNav.defaultProps = {
  className: null,
  rootClassName: null,
};

const { string } = PropTypes;

UserNav.propTypes = {
  className: string,
  rootClassName: string,
  selectedPageName: string.isRequired,
};

export default UserNav;
