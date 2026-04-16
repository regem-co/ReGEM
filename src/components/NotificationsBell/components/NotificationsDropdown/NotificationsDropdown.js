import React from 'react';
import css from './NotificationsDropdown.module.css';
import { getNotificationMessage } from '../../utils';

const NotificationsDropdown = ({
  notifications,
  history,
  setDropdownOpen,
  markNotificationAsSeen,
}) => {
  // Filter out hidden notifications based on their `lastTransition` value 
  const visibleNotifications = notifications.filter(notification => {
    // Define the visibility logic for notifications you want to include
    const visibleTransitions = [
      'transition/offer-made-by-customer',
      'transition/offer-accepted-by-provider',
      'transition/offer-accepted-by-customer',
      'transition/offer-made-by-provider',
      'transition/counter-offer-made-by-customer',
      'transition/enquire'
    ];

    return visibleTransitions.includes(notification.lastTransition);
  });

  if (visibleNotifications.length === 0) {
    return <div className={css.wrapperNoNotif}>{"You don't have any notifications yet:("}</div>;
  }

  return (
    <div className={css.message}>
      {visibleNotifications.map(notification => {
        const message = getNotificationMessage(notification.lastTransition, notification.role);
        const link = `/${notification.role === 'provider' ? 'sale' : 'order'}/${
          notification.transactionId
        }/details`;
        const isSeen = notification.seen;

        return message ? (
          <div
            key={notification.transactionId}
            onClick={() => {
              if (!isSeen) {
                markNotificationAsSeen(notification.transactionId);
              }
              history.push(link);
              setDropdownOpen(false);
            }}
            className={isSeen ? css.notificationItem : css.notificationItemNotSeen}
          >
            {message}
          </div>
        ) : null;
      })}
    </div>
  );
};

export default NotificationsDropdown;
