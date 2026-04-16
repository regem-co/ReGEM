import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// Import global thunk functions
import { isScrollingDisabled } from '../../ducks/UI.duck';
import {
  confirmAffirmPayment,
  confirmCardPayment,
  retrievePaymentIntent,
} from '../../ducks/stripe.duck';
import { savePaymentMethod } from '../../ducks/paymentMethods.duck';

// Import modules from this directory
import {
  initiateOrderCard,
  setInitialValues,
  speculateTransactionCard,
  stripeCustomer,
  confirmPaymentCard,
  sendMessage,
  initiateOrderAffirm,
  confirmPaymentAffirm,
  speculateTransactionAffirm,
} from './CheckoutPage.duck';
import { storeData } from './CheckoutPageSessionHelpers';
import { getSelectedPm } from './utils';
import CardCheckoutPage from './containers/CardCheckoutPage/CardCheckoutPage';
import { injectIntl } from 'react-intl';
import AffirmCheckoutPage from './containers/AffirmCheckoutPage/AffirmCheckoutPage';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const STORAGE_KEY = 'CheckoutPage';

const CheckoutPageComponent = props => {
  const selectedPM = getSelectedPm();

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  //Steps to add a new payment method
  //______________________________________________________________________________
  //Step 1: Create a custom checkout page component like the ones below
  //eg. <GiropayCheckoutPage/>
  //Step 2: Create a custom stripe payment form specific for the new payment method
  //eg. src > forms > StripePaymentFormCard
  //Step 3: Add the new StripePaymentForm to the new checkout page component
  //Step 4: Create a separate initiateOrder function according to the new payment method
  //eg. initiateOrderCard below on mapDispatchToProps
  //Step 5: Overwrite the onInitiateOrder prop with the new initiateOrder function
  //eg. see below -> onInitiateOrder={props.onInitiateOrderCard}
  //Step 6: Create a separate confirmPayment function according to the new payment method
  //eg. confirmPaymentCard below on mapDispatchToProps
  //Step 7: Overwrite the onConfirmPayment prop with the new confirmPayment function
  //eg. see below -> onConfirmPayment={props.onConfirmPaymentCard}
  //Step 8: Create a separate speculateTransaction function according to the new payment method
  //eg. speculateTransactionCard below on mapDispatchToProps
  //Step 9: Overwrite the fetchSpeculatedTransaction prop with the new speculateTransaction function
  //eg. see below -> fetchSpeculatedTransaction={props.fetchSpeculatedTransactionCard}
  //Step 10: Create a new /initiate-privileged endpoint
  //eg. /initiate-privileged-card
  //Step 11: Create a new initiatePrivileged function in src > util > api
  //eg. initiatePrivilegedCard
  //Step 12: Add the new initiatePrivileged function to the new initiateOrder and speculateTransaction functions in CheckoutPage.duck
  //Step 13: Create new transitions for transition/request-payment and  MAYBE transition/confirm-payment-instant ( eg. affirm needs )
  // do a search and see all the places they need to be added eg. in CheckoutPage.duck for confirmPayment and initiate order functions
  //eg. transition/request-payment-card, transition/confirm-payment-instant-card ( this is necessary for affirm, might not be necessary for other payment methods)
  //PAY ATTENTION!!!, there is a onConfirmGiropayPayment and a onConfirmPaymentAffirm, no time for refactor now

  if (selectedPM === 'card') {
    return (
      <CardCheckoutPage
        {...props}
        onInitiateOrder={props.onInitiateOrderCard}
        onConfirmPayment={props.onConfirmPaymentCard}
        fetchSpeculatedTransaction={props.fetchSpeculatedTransactionCard}
      />
    );
  }

  if (selectedPM === 'affirm') {
    return (
      <AffirmCheckoutPage
        {...props}
        onInitiateOrder={props.onInitiateOrderAffirm}
        onConfirmPayment={props.onConfirmPaymentAffirm}
        fetchSpeculatedTransaction={props.fetchSpeculatedTransactionAffirm}
      />
    );
  }
};

const mapStateToProps = state => {
  const {
    listing,
    orderData,
    stripeCustomerFetched,
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    transaction,
    initiateOrderError,
    confirmPaymentError,
  } = state.CheckoutPage;
  const { currentUser } = state.user;
  const { confirmCardPaymentError, paymentIntent, retrievePaymentIntentError } = state.stripe;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    stripeCustomerFetched,
    orderData,
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    transaction,
    listing,
    initiateOrderError,
    confirmCardPaymentError,
    confirmPaymentError,
    paymentIntent,
    retrievePaymentIntentError,
  };
};

const mapDispatchToProps = dispatch => ({
  dispatch,
  // 3________________________________________________________
  fetchSpeculatedTransactionCard: (params, transactionId) =>
    dispatch(speculateTransactionCard(params, transactionId)),

  fetchSpeculatedTransactionAffirm: (params, transactionId) =>
    dispatch(speculateTransactionAffirm(params, transactionId)),
  // 3________________________________________________________

  fetchStripeCustomer: () => dispatch(stripeCustomer()),

  // 1________________________________________________________
  onInitiateOrderCard: (params, transactionId) =>
    dispatch(initiateOrderCard(params, transactionId)),
  onInitiateOrderAffirm: (params, transactionId) =>
    dispatch(initiateOrderAffirm(params, transactionId)),
  // 1________________________________________________________

  onRetrievePaymentIntent: params => dispatch(retrievePaymentIntent(params)),
  // 4________________________________________________________
  onConfirmCardPayment: params => dispatch(confirmCardPayment(params)),
  onConfirmAffirmPayment: params => dispatch(confirmAffirmPayment(params)),

  // 4________________________________________________________

  // 2________________________________________________________
  onConfirmPaymentCard: params => dispatch(confirmPaymentCard(params)),
  onConfirmPaymentAffirm: params => dispatch(confirmPaymentAffirm(params)),
  // 2________________________________________________________
  onSendMessage: params => dispatch(sendMessage(params)),
  onSavePaymentMethod: (stripeCustomer, stripePaymentMethodId) =>
    dispatch(savePaymentMethod(stripeCustomer, stripePaymentMethodId)),
});

const CheckoutPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(CheckoutPageComponent);

CheckoutPage.setInitialValues = (initialValues, saveToSessionStorage = false) => {
  if (saveToSessionStorage) {
    const { listing, orderData } = initialValues;
    storeData(orderData, listing, null, STORAGE_KEY);
  }

  return setInitialValues(initialValues);
};

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
