import { ensureTransaction } from './data';

/**
 * Transitions
 *
 * These strings must sync with values defined in Flex API,
 * since transaction objects given by API contain info about last transitions.
 * All the actions in API side happen in transitions,
 * so we need to understand what those strings mean.
 */

// When a customer makes an order for a listing, a transaction is
// created with the initial request-payment transition.
// At this transition a PaymentIntent is created by Marketplace API.
// After this transition, the actual payment must be made on client-side directly to Stripe.
export const TRANSITION_REQUEST_PAYMENT = 'transition/request-payment';
export const TRANSITION_REQUEST_PAYMENT_AFFIRM = 'transition/request-payment-affirm';

// A customer can also initiate a transaction with an enquiry, and
// then transition that with a request.
export const TRANSITION_ENQUIRE = 'transition/enquire';
export const TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY = 'transition/request-payment-after-enquiry';

// Stripe SDK might need to ask 3D security from customer, in a separate front-end step.
// Therefore we need to make another transition to Marketplace API,
// to tell that the payment is confirmed.
export const TRANSITION_CONFIRM_PAYMENT = 'transition/confirm-payment';

// If the payment is not confirmed in the time limit set in transaction process (by default 15min)
// the transaction will expire automatically.
export const TRANSITION_EXPIRE_PAYMENT = 'transition/expire-payment';

// Provider can mark the product shipped/delivered
export const TRANSITION_MARK_DELIVERED = 'transition/mark-delivered';

export const TRANSITION_MARK_DELIVERED_BY_OPERATOR = 'transition/mark-delivered-by-operator';

// Customer can mark the product received (e.g. picked up from provider)
export const TRANSITION_MARK_RECEIVED_FROM_PURCHASED = 'transition/mark-received-from-purchased';

// Automatic cancellation happens if none marks the delivery happened
export const TRANSITION_AUTO_CANCEL = 'transition/auto-cancel';

// Operator can cancel the purchase before product has been marked as delivered / received
export const TRANSITION_CANCEL = 'transition/cancel';

// If provider has marked the product delivered (e.g. shipped),

export const TRANSITION_MARK_SHIPPED_BY_OPERATOR = 'transition/mark-shipped-by-operator'
// customer can then mark the product received
export const TRANSITION_MARK_RECEIVED = 'transition/mark-received';

export const TRANSITION_MARK_RECEIVED_BY_OPERATOR = 'transition/mark-received-by-operator';

// If customer doesn't mark the product received manually, it can happen automatically
export const TRANSITION_AUTO_MARK_RECEIVED = 'transition/auto-mark-received';

// When provider has marked the product delivered, customer can dispute the transaction
export const TRANSITION_DISPUTE = 'transition/dispute';

// If nothing is done to disputed transaction it ends up to Canceled state
export const TRANSITION_AUTO_CANCEL_FROM_DISPUTED = 'transition/auto-cancel-from-disputed';

// Operator can cancel disputed transaction manually
export const TRANSITION_CANCEL_FROM_DISPUTED = 'transition/cancel-from-disputed';

// Operator can mark the disputed transaction as received
export const TRANSITION_MARK_RECEIVED_FROM_DISPUTED = 'transition/mark-received-from-disputed';

// System moves transaction automatically from received state to complete state
// This makes it possible to to add notifications to that single transition.
export const TRANSITION_AUTO_COMPLETE = 'transition/auto-complete';

// Reviews are given through transaction transitions. Review 1 can be
// by provider or customer, and review 2 will be the other party of
// the transaction.
export const TRANSITION_REVIEW_1_BY_PROVIDER = 'transition/review-1-by-provider';
export const TRANSITION_REVIEW_2_BY_PROVIDER = 'transition/review-2-by-provider';
export const TRANSITION_REVIEW_1_BY_CUSTOMER = 'transition/review-1-by-customer';
export const TRANSITION_REVIEW_2_BY_CUSTOMER = 'transition/review-2-by-customer';
export const TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD = 'transition/expire-customer-review-period';
export const TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD = 'transition/expire-provider-review-period';
export const TRANSITION_EXPIRE_REVIEW_PERIOD = 'transition/expire-review-period';

// UPS

export const TRANSITION_UPS_SHIPPING_TO_REFIND = 'transition/ups-shipping-to-refind';
export const TRANSITION_UPS_AUTHENTICATION_IN_PROGRESS =
  'transition/ups-authentication-in-progress';
export const TRANSITION_UPS_SHIPPING_TO_CLIENT = 'transition/ups-shipping-to-client';

// MAKE OFFER Workflow
export const TRANSITION_OFFER_EXPIRED = 'transition/offer-expired';
export const TRANSITION_OFFER_MADE_BY_CUSTOMER = 'transition/offer-made-by-customer';
export const TRANSITION_OFFER_ACCEPTED_BY_PROVIDER = 'transition/offer-accepted-by-provider';
export const TRANSITION_OFFER_DECLINED_BY_PROVIDER = 'transition/offer-declined-by-provider';
export const TRANSITION_OFFER_ACCEPTED_BY_CUSTOMER = 'transition/offer-accepted-by-customer';
export const TRANSITION_REQUEST_PAYMENT_AFTER_OFFER_ACCEPTED =
  'transition/request-payment-after-offer-accepted';
export const TRANSITION_OFFER_MADE_BY_PROVIDER = 'transition/offer-made-by-provider';
export const TRANSITION_COUNTER_OFFER_MADE_BY_CUSTOMER = 'transition/counter-offer-made-by-customer';
//--

export const TRANSITION_UPLOAD_AUTHENTICATION_CERTIFICATE =
  'transition/upload-authentication-certificate';
/**
 * Actors
 *
 * There are 4 different actors that might initiate transitions:
 */

// Roles of actors that perform transaction transitions
export const TX_TRANSITION_ACTOR_CUSTOMER = 'customer';
export const TX_TRANSITION_ACTOR_PROVIDER = 'provider';
export const TX_TRANSITION_ACTOR_SYSTEM = 'system';
export const TX_TRANSITION_ACTOR_OPERATOR = 'operator';

export const TX_TRANSITION_ACTORS = [
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  TX_TRANSITION_ACTOR_OPERATOR,
];

/**
 * States
 *
 * These constants are only for making it clear how transitions work together.
 * You should not use these constants outside of this file.
 *
 * Note: these states are not in sync with states used transaction process definitions
 *       in Marketplace API. Only last transitions are passed along transaction object.
 */
export const STATE_INITIAL = 'initial';
export const STATE_ENQUIRY = 'enquiry';
export const STATE_PENDING_PAYMENT = 'pending-payment';
export const STATE_PAYMENT_EXPIRED = 'payment-expired';
export const STATE_PURCHASED = 'purchased';
export const STATE_DELIVERED = 'delivered';
export const STATE_RECEIVED = 'received';
export const STATE_DISPUTED = 'disputed';
export const STATE_CANCELED = 'canceled';
export const STATE_COMPLETED = 'completed';
export const STATE_REVIEWED = 'reviewed';
export const STATE_REVIEWED_BY_CUSTOMER = 'reviewed-by-customer';
export const STATE_REVIEWED_BY_PROVIDER = 'reviewed-by-provider';
// MAKE OFFER Workflow
export const STATE_OFFER_PENDING = 'offer-pending';
export const STATE_OFFER_ACCEPTED = 'offer-accepted';
export const STATE_OFFER_MADE_BY_PROVIDER = 'offer-made-by-provider';
export const STATE_OFFER_ACCEPTED_BY_CUSTOMER = 'offer-accepted-by-customer';
//--
/**
 * Description of transaction process
 *
 * You should keep this in sync with transaction process defined in Marketplace API
 *
 * Note: we don't use yet any state machine library,
 *       but this description format is following Xstate (FSM library)
 *       https://xstate.js.org/docs/
 */
const stateDescription = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  id: 'flex-product-default-process/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: STATE_INITIAL,

  // States
  states: {
    [STATE_INITIAL]: {
      on: {
        [TRANSITION_ENQUIRE]: STATE_ENQUIRY,
        [TRANSITION_REQUEST_PAYMENT]: STATE_PENDING_PAYMENT,
        [TRANSITION_REQUEST_PAYMENT_AFFIRM]: STATE_PENDING_PAYMENT,
        // MAKE OFFER Workflow
        [TRANSITION_OFFER_MADE_BY_CUSTOMER]: STATE_OFFER_PENDING,
        //--
      },
    },
    // MAKE OFFER Workflow
    [STATE_OFFER_PENDING]: {
      on: {
        [TRANSITION_OFFER_ACCEPTED_BY_PROVIDER]: STATE_OFFER_ACCEPTED,
        [TRANSITION_OFFER_DECLINED_BY_PROVIDER]: STATE_CANCELED,
        [TRANSITION_OFFER_EXPIRED]: STATE_CANCELED,
        [TRANSITION_OFFER_MADE_BY_PROVIDER]: STATE_OFFER_PENDING,
        [TRANSITION_COUNTER_OFFER_MADE_BY_CUSTOMER]: STATE_OFFER_PENDING,
        [TRANSITION_OFFER_MADE_BY_CUSTOMER]: STATE_OFFER_PENDING
      },
    },
    [STATE_OFFER_ACCEPTED]: {
      on: {
        [TRANSITION_REQUEST_PAYMENT_AFTER_OFFER_ACCEPTED]: STATE_PENDING_PAYMENT,
      },
    },
    [STATE_OFFER_MADE_BY_PROVIDER]: {
      on: {
        [TRANSITION_OFFER_ACCEPTED_BY_CUSTOMER]: STATE_OFFER_ACCEPTED,
      },
    },
    // [STATE_OFFER_PROVIDER_PENDING]: {
    //   on: {
    //     [TRANSITION_OFFER_ACCEPTED_BY_CUSTOMER]: STATE_OFFER_ACCEPTED,
    //     [TRANSITION_OFFER_EXPIRED]: STATE_CANCELED,
    //     [TRANSITION_OFFER_MADE_BY_CUSTOMER]: STATE_OFFER_PENDING,
    //   },
    // },

    //--
    [STATE_ENQUIRY]: {
      on: {
        [TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY]: STATE_PENDING_PAYMENT,
      },
    },

    [STATE_PENDING_PAYMENT]: {
      on: {
        [TRANSITION_EXPIRE_PAYMENT]: STATE_PAYMENT_EXPIRED,
        [TRANSITION_CONFIRM_PAYMENT]: STATE_PURCHASED,
      },
    },

    [STATE_PAYMENT_EXPIRED]: {},
    [STATE_PURCHASED]: {
      on: {
        [TRANSITION_MARK_DELIVERED]: STATE_DELIVERED,
        [TRANSITION_MARK_DELIVERED_BY_OPERATOR]: STATE_DELIVERED,
        [TRANSITION_MARK_SHIPPED_BY_OPERATOR]: STATE_DELIVERED,
        [TRANSITION_MARK_RECEIVED_FROM_PURCHASED]: STATE_RECEIVED,
        [TRANSITION_AUTO_CANCEL]: STATE_CANCELED,
        [TRANSITION_CANCEL]: STATE_CANCELED,
        [TRANSITION_UPS_SHIPPING_TO_REFIND]: STATE_PURCHASED,
        [TRANSITION_UPS_AUTHENTICATION_IN_PROGRESS]: STATE_PURCHASED,
        [TRANSITION_UPS_SHIPPING_TO_CLIENT]: STATE_PURCHASED,
      },
    },

    [STATE_CANCELED]: {},

    [STATE_DELIVERED]: {
      on: {
        [TRANSITION_MARK_RECEIVED]: STATE_RECEIVED,
        [TRANSITION_AUTO_MARK_RECEIVED]: STATE_RECEIVED,
        [TRANSITION_DISPUTE]: STATE_DISPUTED,
      },
    },

    [STATE_DISPUTED]: {
      on: {
        [TRANSITION_AUTO_CANCEL_FROM_DISPUTED]: STATE_CANCELED,
        [TRANSITION_CANCEL_FROM_DISPUTED]: STATE_CANCELED,
        [TRANSITION_MARK_RECEIVED_FROM_DISPUTED]: STATE_RECEIVED,
      },
    },

    [STATE_RECEIVED]: {
      on: {
        [TRANSITION_AUTO_COMPLETE]: STATE_COMPLETED,
      },
    },

    [STATE_COMPLETED]: {
      on: {
        [TRANSITION_EXPIRE_REVIEW_PERIOD]: STATE_REVIEWED,
        [TRANSITION_REVIEW_1_BY_CUSTOMER]: STATE_REVIEWED_BY_CUSTOMER,
        [TRANSITION_REVIEW_1_BY_PROVIDER]: STATE_REVIEWED_BY_PROVIDER,
      },
    },

    [STATE_REVIEWED_BY_CUSTOMER]: {
      on: {
        [TRANSITION_REVIEW_2_BY_PROVIDER]: STATE_REVIEWED,
        [TRANSITION_EXPIRE_PROVIDER_REVIEW_PERIOD]: STATE_REVIEWED,
      },
    },
    [STATE_REVIEWED_BY_PROVIDER]: {
      on: {
        [TRANSITION_REVIEW_2_BY_CUSTOMER]: STATE_REVIEWED,
        [TRANSITION_EXPIRE_CUSTOMER_REVIEW_PERIOD]: STATE_REVIEWED,
      },
    },
    [STATE_REVIEWED]: {
      type: 'final',
    },
  },
};

// Note: currently we assume that state description doesn't contain nested states.
const statesFromStateDescription = description => description.states || {};

// Get all the transitions from states object in an array
const getTransitions = states => {
  const stateNames = Object.keys(states);

  const transitionsReducer = (transitionArray, name) => {
    const stateTransitions = states[name] && states[name].on;
    const transitionKeys = stateTransitions ? Object.keys(stateTransitions) : [];
    return [
      ...transitionArray,
      ...transitionKeys.map(key => ({ key, value: stateTransitions[key] })),
    ];
  };

  return stateNames.reduce(transitionsReducer, []);
};

// This is a list of all the transitions that this app should be able to handle.
export const TRANSITIONS = getTransitions(statesFromStateDescription(stateDescription)).map(
  t => t.key
);

// This function returns a function that has given stateDesc in scope chain.
const getTransitionsToStateFn = stateDesc => state =>
  getTransitions(statesFromStateDescription(stateDesc))
    .filter(t => t.value === state)
    .map(t => t.key);

// Get all the transitions that lead to specified state.
const getTransitionsToState = getTransitionsToStateFn(stateDescription);

// This is needed to fetch transactions that need response from provider.
// I.e. transactions which provider needs to accept or decline
export const transitionsToRequested = getTransitionsToState(STATE_PURCHASED);

/**
 * Helper functions to figure out if transaction is in a specific state.
 * State is based on lastTransition given by transaction object and state description.
 */

const txLastTransition = tx => ensureTransaction(tx).attributes.lastTransition;

export const txIsEnquired = tx =>
  getTransitionsToState(STATE_ENQUIRY).includes(txLastTransition(tx));

export const txIsPaymentPending = tx =>
  getTransitionsToState(STATE_PENDING_PAYMENT).includes(txLastTransition(tx));

export const txIsPaymentExpired = tx =>
  getTransitionsToState(STATE_PAYMENT_EXPIRED).includes(txLastTransition(tx));

export const txIsPurchased = tx =>
  getTransitionsToState(STATE_PURCHASED).includes(txLastTransition(tx));

export const txIsCanceled = tx =>
  getTransitionsToState(STATE_CANCELED).includes(txLastTransition(tx));

export const txIsDelivered = tx =>
  getTransitionsToState(STATE_DELIVERED).includes(txLastTransition(tx));

export const txIsDisputed = tx =>
  getTransitionsToState(STATE_DISPUTED).includes(txLastTransition(tx));

export const txIsReceived = tx =>
  getTransitionsToState(STATE_RECEIVED).includes(txLastTransition(tx));

export const txIsCompleted = tx =>
  getTransitionsToState(STATE_COMPLETED).includes(txLastTransition(tx));

export const txIsReviewedByCustomer = tx =>
  getTransitionsToState(STATE_REVIEWED_BY_CUSTOMER).includes(txLastTransition(tx));

export const txIsReviewedByProvider = tx =>
  getTransitionsToState(STATE_REVIEWED_BY_PROVIDER).includes(txLastTransition(tx));

const firstReviewTransitions = [
  ...getTransitionsToState(STATE_REVIEWED_BY_CUSTOMER),
  ...getTransitionsToState(STATE_REVIEWED_BY_PROVIDER),
];
export const txIsInFirstReview = tx => firstReviewTransitions.includes(txLastTransition(tx));

export const txIsInFirstReviewBy = (tx, isCustomer) =>
  isCustomer
    ? getTransitionsToState(STATE_REVIEWED_BY_CUSTOMER).includes(txLastTransition(tx))
    : getTransitionsToState(STATE_REVIEWED_BY_PROVIDER).includes(txLastTransition(tx));

export const txIsReviewed = tx =>
  getTransitionsToState(STATE_REVIEWED).includes(txLastTransition(tx));

// make offer workflow
export const txIsOfferPending = tx =>
  getTransitionsToState(STATE_OFFER_PENDING).includes(txLastTransition(tx));

export const txIsOfferAccepted = tx =>
  getTransitionsToState(STATE_OFFER_ACCEPTED).includes(txLastTransition(tx));

export const txIsOfferMadeByProvider = tx =>
  getTransitionsToState(STATE_OFFER_MADE_BY_PROVIDER).includes(txLastTransition(tx));

export const txIsOfferAcceptedByCustomer = tx =>
  getTransitionsToState(STATE_OFFER_ACCEPTED_BY_CUSTOMER).includes(txLastTransition(tx));

//--

/**
 * Helper functions to figure out if transaction has passed a given state.
 * This is based on transitions history given by transaction object.
 */

const txTransitions = tx => ensureTransaction(tx).attributes.transitions || [];
const hasPassedTransition = (transitionName, tx) =>
  !!txTransitions(tx).find(t => t.transition === transitionName);

const hasPassedStateFn = state => tx =>
  getTransitionsToState(state).filter(t => hasPassedTransition(t, tx)).length > 0;

// Helper function to check if the transaction has passed a certain state
export const txHasPassedPaymentPending = hasPassedStateFn(STATE_PENDING_PAYMENT);
export const txHasBeenReceived = hasPassedStateFn(STATE_RECEIVED);

/**
 * Other transaction related utility functions
 */

export const transitionIsReviewed = transition =>
  getTransitionsToState(STATE_REVIEWED).includes(transition);

export const transitionIsFirstReviewedBy = (transition, isCustomer) =>
  isCustomer
    ? getTransitionsToState(STATE_REVIEWED_BY_CUSTOMER).includes(transition)
    : getTransitionsToState(STATE_REVIEWED_BY_PROVIDER).includes(transition);

export const getReview1Transition = isCustomer =>
  isCustomer ? TRANSITION_REVIEW_1_BY_CUSTOMER : TRANSITION_REVIEW_1_BY_PROVIDER;

export const getReview2Transition = isCustomer =>
  isCustomer ? TRANSITION_REVIEW_2_BY_CUSTOMER : TRANSITION_REVIEW_2_BY_PROVIDER;

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    TRANSITION_CONFIRM_PAYMENT,
    TRANSITION_AUTO_CANCEL,
    TRANSITION_CANCEL,
    TRANSITION_MARK_RECEIVED_FROM_PURCHASED,
    TRANSITION_MARK_DELIVERED,
    TRANSITION_DISPUTE,
    TRANSITION_MARK_RECEIVED,
    TRANSITION_MARK_DELIVERED_BY_OPERATOR,
    TRANSITION_MARK_SHIPPED_BY_OPERATOR,
    TRANSITION_AUTO_MARK_RECEIVED,
    TRANSITION_MARK_RECEIVED_FROM_DISPUTED,
    TRANSITION_MARK_RECEIVED_BY_OPERATOR,
    TRANSITION_AUTO_CANCEL_FROM_DISPUTED,
    TRANSITION_CANCEL_FROM_DISPUTED,
    TRANSITION_REVIEW_1_BY_CUSTOMER,
    TRANSITION_REVIEW_1_BY_PROVIDER,
    TRANSITION_REVIEW_2_BY_CUSTOMER,
    TRANSITION_REVIEW_2_BY_PROVIDER,
    //make offer workflow
    TRANSITION_OFFER_MADE_BY_CUSTOMER,
    TRANSITION_OFFER_ACCEPTED_BY_PROVIDER,
    TRANSITION_OFFER_DECLINED_BY_PROVIDER,
    //--
    //UPS
    TRANSITION_UPS_SHIPPING_TO_REFIND,
    TRANSITION_UPS_AUTHENTICATION_IN_PROGRESS,
    TRANSITION_UPS_SHIPPING_TO_CLIENT,
    //--
  ].includes(transition);
};

export const isCustomerReview = transition => {
  return [TRANSITION_REVIEW_1_BY_CUSTOMER, TRANSITION_REVIEW_2_BY_CUSTOMER].includes(transition);
};

export const isProviderReview = transition => {
  return [TRANSITION_REVIEW_1_BY_PROVIDER, TRANSITION_REVIEW_2_BY_PROVIDER].includes(transition);
};

export const getUserTxRole = (currentUserId, transaction) => {
  const tx = ensureTransaction(transaction);
  const customer = tx.customer;
  if (currentUserId && currentUserId.uuid && tx.id && customer.id) {
    // user can be either customer or provider
    return currentUserId.uuid === customer.id.uuid
      ? TX_TRANSITION_ACTOR_CUSTOMER
      : TX_TRANSITION_ACTOR_PROVIDER;
  } else {
    throw new Error(`Parameters for "userIsCustomer" function were wrong.
      currentUserId: ${currentUserId}, transaction: ${transaction}`);
  }
};

export const txRoleIsProvider = userRole => userRole === TX_TRANSITION_ACTOR_PROVIDER;
export const txRoleIsCustomer = userRole => userRole === TX_TRANSITION_ACTOR_CUSTOMER;
export const txRoleIsOperator = userRole => userRole === TX_TRANSITION_ACTOR_OPERATOR;

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
export const isPrivileged = transition => {
  return [
    TRANSITION_REQUEST_PAYMENT,
    TRANSITION_REQUEST_PAYMENT_AFFIRM,
    TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY,
    TRANSITION_REQUEST_PAYMENT_AFTER_OFFER_ACCEPTED,
  ].includes(transition);
};
