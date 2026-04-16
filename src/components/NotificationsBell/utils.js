import {
  //what we need for now
  TRANSITION_OFFER_ACCEPTED_BY_PROVIDER,
  TRANSITION_OFFER_ACCEPTED_BY_CUSTOMER,
  TRANSITION_OFFER_MADE_BY_CUSTOMER,
  TRANSITION_OFFER_MADE_BY_PROVIDER,
  TRANSITION_COUNTER_OFFER_MADE_BY_CUSTOMER,
  TRANSITION_ENQUIRE,
  //What we don't need yet
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_REQUEST_PAYMENT_AFFIRM,
  TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY,
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_EXPIRE_PAYMENT,
  TRANSITION_MARK_DELIVERED,
  TRANSITION_MARK_DELIVERED_BY_OPERATOR,
  TRANSITION_MARK_RECEIVED_FROM_PURCHASED,
  TRANSITION_AUTO_CANCEL,
  TRANSITION_CANCEL,
  TRANSITION_MARK_RECEIVED,
  TRANSITION_MARK_RECEIVED_BY_OPERATOR,
  TRANSITION_AUTO_MARK_RECEIVED,
  TRANSITION_DISPUTE,
  TRANSITION_AUTO_CANCEL_FROM_DISPUTED,
  TRANSITION_CANCEL_FROM_DISPUTED,
  TRANSITION_MARK_RECEIVED_FROM_DISPUTED,
  TRANSITION_AUTO_COMPLETE,
  TRANSITION_REVIEW_1_BY_PROVIDER,
  TRANSITION_REVIEW_2_BY_PROVIDER,
  TRANSITION_REVIEW_1_BY_CUSTOMER,
  TRANSITION_REVIEW_2_BY_CUSTOMER,
  TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_UPS_SHIPPING_TO_REFIND,
  TRANSITION_UPS_AUTHENTICATION_IN_PROGRESS,
  TRANSITION_UPS_SHIPPING_TO_CLIENT,
  TRANSITION_OFFER_EXPIRED,
  TRANSITION_OFFER_DECLINED_BY_PROVIDER,
  TRANSITION_REQUEST_PAYMENT_AFTER_OFFER_ACCEPTED,
  TRANSITION_UPLOAD_AUTHENTICATION_CERTIFICATE,
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  TX_TRANSITION_ACTOR_OPERATOR,
  STATE_INITIAL,
  STATE_ENQUIRY,
  STATE_PENDING_PAYMENT,
  STATE_PAYMENT_EXPIRED,
  STATE_PURCHASED,
  STATE_DELIVERED,
  STATE_RECEIVED,
  STATE_DISPUTED,
  STATE_CANCELED,
  STATE_COMPLETED,
  STATE_REVIEWED,
  STATE_REVIEWED_BY_CUSTOMER,
  STATE_REVIEWED_BY_PROVIDER,
  STATE_OFFER_PENDING,
  STATE_OFFER_ACCEPTED,
  STATE_OFFER_MADE_BY_PROVIDER,
  TRANSITION_MARK_SHIPPED_BY_OPERATOR
} from '../../util/transaction';

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

export const fetchCurrentUserRelevantTransactions = ({ currentUser }) => {
  // Ensure currentUser.id.uuid is available
  if (!currentUser?.id?.uuid) {
    console.error('Error: Current user ID is missing or invalid.');
    return Promise.resolve([]); // Return an empty array if user ID is missing
  }
  const queryParams = {
    userId: currentUser?.id?.uuid, // Access userId as currentUser.id.uuid

    include: ['listing', 'provider', 'booking'],
  };
  // Call the SDK API
  return sdk.transactions
    .query(queryParams) // Send the query to the API
    .then(res => {
      // Check if the response has data
      if (!res?.data?.data || res.data.data.length === 0) {
        console.warn('No transactions found. Response:', res?.data?.data);
        return []; // Return empty array if no transactions found
      }
      return res.data.data;
    })
    .catch(e => {
      console.error('Error fetching transactions:', e); // Log error if the API call fails
      return []; // Return empty array on error
    });
};

export const transactionToNotification = (transactions, currentUser) => {
  const currentUserId = currentUser?.id?.uuid;
  const userPrivateData = currentUser?.attributes?.profile?.privateData;
  const notificationsSeenByUser = userPrivateData?.seenNotifications || [];
  const notifications = transactions.map(t => {
    const transactionId = t?.id?.uuid;
    const transitions = t?.attributes?.transitions;
    const lastTransition = transitions[transitions.length - 1];
    const lastTransitionRole = lastTransition.by;
    const providerId = t?.relationships?.provider?.data?.id?.uuid;
    const customerId = t?.relationships?.customer?.data?.id?.uuid;
    const isOwnTransition =
      lastTransitionRole === 'provider'
        ? providerId === currentUserId
        : customerId === currentUserId;

    const role = providerId === currentUserId ? 'provider' : 'customer';
    // const isOwnTransition = lastTransitionRole === role;

    return {
      transactionId,
      lastTransition: lastTransition?.transition,
      createdAt: lastTransition?.createdAt,
      isOwnTransition,
      role,
      seen: !!notificationsSeenByUser.find(n => {
        return (
          n?.transactionId === transactionId && n?.lastTransition === lastTransition?.transition
        );
      }),
    };
  });

  const filteredNotifications = notifications.filter(n => !n.isOwnTransition).slice(0, 10);

  return filteredNotifications;
};

export const getNotificationMessage = (transition, role) => {
  const EXCLUDED_TRANSITIONS = [
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_REQUEST_PAYMENT_AFFIRM,
  TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY,
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_EXPIRE_PAYMENT,
  TRANSITION_MARK_DELIVERED,
  TRANSITION_MARK_DELIVERED_BY_OPERATOR,
  TRANSITION_MARK_RECEIVED_FROM_PURCHASED,
  TRANSITION_AUTO_CANCEL,
  TRANSITION_CANCEL,
  TRANSITION_MARK_RECEIVED,
  TRANSITION_MARK_RECEIVED_BY_OPERATOR,
  TRANSITION_AUTO_MARK_RECEIVED,
  TRANSITION_DISPUTE,
  TRANSITION_AUTO_CANCEL_FROM_DISPUTED,
  TRANSITION_CANCEL_FROM_DISPUTED,
  TRANSITION_MARK_RECEIVED_FROM_DISPUTED,
  TRANSITION_AUTO_COMPLETE,
  TRANSITION_REVIEW_1_BY_PROVIDER,
  TRANSITION_REVIEW_2_BY_PROVIDER,
  TRANSITION_REVIEW_1_BY_CUSTOMER,
  TRANSITION_REVIEW_2_BY_CUSTOMER,
  TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_UPS_SHIPPING_TO_REFIND,
  TRANSITION_UPS_AUTHENTICATION_IN_PROGRESS,
  TRANSITION_UPS_SHIPPING_TO_CLIENT,
  TRANSITION_OFFER_EXPIRED,
  TRANSITION_OFFER_DECLINED_BY_PROVIDER,
  TRANSITION_REQUEST_PAYMENT_AFTER_OFFER_ACCEPTED,
  TRANSITION_UPLOAD_AUTHENTICATION_CERTIFICATE,
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  TX_TRANSITION_ACTOR_OPERATOR,
  STATE_INITIAL,
  STATE_ENQUIRY,
  STATE_PENDING_PAYMENT,
  STATE_PAYMENT_EXPIRED,
  STATE_PURCHASED,
  STATE_DELIVERED,
  STATE_RECEIVED,
  STATE_DISPUTED,
  STATE_CANCELED,
  STATE_COMPLETED,
  STATE_REVIEWED,
  STATE_REVIEWED_BY_CUSTOMER,
  STATE_REVIEWED_BY_PROVIDER,
  STATE_OFFER_PENDING,
  STATE_OFFER_ACCEPTED,
  STATE_OFFER_MADE_BY_PROVIDER,
  TRANSITION_MARK_SHIPPED_BY_OPERATOR
  ];
  // Ensure the transition value is prefixed with "transition/"
  console.log('Transition Data is here ', transition);
  console.log('Role Data is here ', role);
  const transitionType = transition?.startsWith('transition/')
    ? transition
    : `transition/${transition}`;

  let notificationMessage = 'You have a new message!';
  if (EXCLUDED_TRANSITIONS.includes(transitionType)) {
    notificationMessage = null;
  }
  //Required notfications
  else if (transitionType === TRANSITION_OFFER_MADE_BY_CUSTOMER) {
    notificationMessage = role === 'provider' ? 'You have a new offer!' : null;
  } else if (transitionType === TRANSITION_OFFER_ACCEPTED_BY_PROVIDER) {
    notificationMessage = 'Your offer has been accepted!';
  } else if (transitionType === TRANSITION_OFFER_ACCEPTED_BY_CUSTOMER) {
    notificationMessage = role === 'provider' ? 'Your offer has been accepted!' : null;
  } else if (transitionType === TRANSITION_OFFER_MADE_BY_PROVIDER) {
    notificationMessage = 'Your offer has been countered!';
  } else if (transitionType === TRANSITION_COUNTER_OFFER_MADE_BY_CUSTOMER) {
    notificationMessage = role === 'provider' ? 'Your offer has been countered!' : null;
  } else if (transitionType === TRANSITION_ENQUIRE) {
    notificationMessage = role === 'provider' ? 'You have a new message!' : 'You have a new message!';
  }
   else {
    console.log('Unmatched transition:', transitionType); // Log any unmatched transition
  }

  return notificationMessage;
};
