import React, { useState, useEffect, useRef } from 'react';
import css from './NotificationsBell.module.css';
import { injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { updateProfile } from '../../containers/ProfileSettingsPage/ProfileSettingsPage.duck';
import NotificationsDropdown from './components/NotificationsDropdown/NotificationsDropdown';
import { fetchCurrentUserRelevantTransactions, transactionToNotification } from './utils';
import { withRouter } from 'react-router-dom';

const NotificationsBellComponent = props => {
  const { onFetchCurrentUser, onUpdateProfile, currentUser, history } = props;
  const wrapperRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications'); // Default tab

  // Event listener for clicking outside of the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.id?.uuid) {
      fetchCurrentUserRelevantTransactions({ currentUser })
        .then(resp => {
          const notificationsData = transactionToNotification(resp, currentUser);
          const messageNotifications = notificationsData.filter(n => n.lastTransition === 'transition/enquire');
          const otherNotifications = notificationsData.filter(n => n.lastTransition !== 'transition/enquire');

          setMessages(messageNotifications);
          setNotifications(otherNotifications.filter(n => !n.seen));

        })
        .catch(e => console.log('Error fetching notifications:', e));
    } else {
      console.error('Error: Current user ID is missing or invalid.');
    }
  }, [currentUser]);

  function checkTransitionCondition(lastTransition, role) {
    if (
      [
        'transition/expire-provider-review-period',
        'transition/expire-review-period',
        'transition/upload-authentication-certificate',
        'transition/expire-customer-review-period'
      ].includes(lastTransition)
    ) {
      return false;
    }
    if (lastTransition === 'transition/offer-made-by-customer' && role === 'customer') {
      return false; // Don't count this notification
    }

    if (lastTransition === 'transition/counter-offer-made-by-customer' && role === 'customer') {
      return false;
    }

    if (
      [
        'transition/mark-shipped-by-operator',
        'transition/offer-declined-by-provider',
        'transition/cancel',
        'transition/confirm-payment',
        'transition/offer-expired',
        'transition/request-payment-after-offer-accepted',
        'transition/request-payment-after-enquiry',
        'transition/request-payment',
        'transition/request-payment-affirm',
        'transition/expire-payment',
        'transition/mark-delivered',
        'transition/mark-delivered-by-operator',
        'transition/mark-received-from-purchased',
        'transition/auto-cancel',
        'transition/mark-received',
        'transition/mark-received-by-operator',
        'transition/auto-mark-received',
        'transition/dispute',
        'transition/auto-cancel-from-disputed',
        'transition/mark-received-from-disputed',
        'transition/auto-complete',
        'transition/offer-confirmed',
        'transition/offer-accepted',
        'transition/offer-pending',
        'transition/offer-rejected',
        'transition/payment-in-progress',
        'transition/payment-completed',
        'transition/payment-failed',
        'transition/payment-cancelled',
        'transition/mark-cancelled',
        'transition/mark-completed',
        'transition/auto-mark-cancelled',
        'transition/auto-mark-completed',
        'transition/auto-mark-failed',
        'transition/mark-pending',
        'transition/auto-dispute',
        'transition/payment-awaiting-approval',
        'transition/payment-approved',
        'transition/auto-approve-payment',
        'transition/payment-requested',
        'transition/payment-reversed',
        'transition/payment-disputed',
        'transition/offer-taken',
        'transition/offer-withdrawn',
        'transition/payment-received',
        'transition/confirmation-pending',
        'transition/offer-sent',
        'transition/offer-updated',
        'transition/offer-modified',
        'transition/offer-withdrawn-by-provider',
        'transition/request-payment-declined',
        'transition/mark-approved',
        'transition/mark-declined',
        'transition/request-approval',
        'transition/expire-review-period',
        "transition/review-2-by-provider",
        "transition/offer-accepted-by-customer"
      ].includes(lastTransition)
    ) {
      return false;
    }


    // Default case: Allow all other conditions
    return true;
  }
  const hasNewNotification = [...notifications, ...messages]?.some(
    n => checkTransitionCondition(n?.lastTransition, n?.role) && !n?.seen
  );

  const unreadCount = [...notifications, ...messages]?.filter(
    n => checkTransitionCondition(n?.lastTransition, n?.role) && !n?.seen
  ).length;

  const notificationDot = hasNewNotification && unreadCount > 0 ? (
    <div className={css.notificationDot}>{unreadCount}</div>
  ) : null;

  const markNotificationAsSeen = notificationId => {
    const updatedNotifications = [...notifications, ...messages].map(notification =>
      notification.transactionId === notificationId ? { ...notification, seen: true } : notification
    );

    const seenNotifications = updatedNotifications
      .filter(n => n.seen)
      .map(n => ({
        transactionId: n.transactionId,
        lastTransition: n.lastTransition,
      }));

    onUpdateProfile({
      privateData: {
        seenNotifications,
      },
    });

    setTimeout(() => onFetchCurrentUser(), 500);
  };

  return (
    <div className={css.wrapper} ref={wrapperRef}>
      <button className={css.button} onClick={() => setDropdownOpen(!dropdownOpen)}>
        <svg
          viewBox="0 0 448 512"
          width={18}
          height={20}
          className={hasNewNotification && unreadCount > 0 ? css.bellRings : css.bell}
          preserveAspectRatio="none"
        >
          <path
            style={{ fill: hasNewNotification && unreadCount > 0 ? '#ff0000' : '#4a4a4a' }}
            d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"
          ></path>
        </svg>
        {notificationDot}
      </button>
      {dropdownOpen && (
        <div className={css.dropdown}>
          <div className={css.tabsContainer}>
            <button
              className={activeTab === 'notifications' ? css.activeTab : ''}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button
              className={activeTab === 'messages' ? css.activeTab : ''}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
          </div>
          <div className={css.tabContent}>
            {activeTab === 'notifications' && (
              <NotificationsDropdown
                notifications={notifications}
                history={history}
                setDropdownOpen={setDropdownOpen}
                markNotificationAsSeen={markNotificationAsSeen}
              />
            )}
            {activeTab === 'messages' && (
              <NotificationsDropdown
                notifications={messages}
                history={history}
                setDropdownOpen={setDropdownOpen}
                markNotificationAsSeen={markNotificationAsSeen}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
});

const mapDispatchToProps = dispatch => ({
  onFetchCurrentUser: () => dispatch(fetchCurrentUser()),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

export default compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(NotificationsBellComponent);



