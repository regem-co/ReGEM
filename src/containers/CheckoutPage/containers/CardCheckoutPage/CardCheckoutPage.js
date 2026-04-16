import React, { Component } from 'react';
import { bool, func, instanceOf, object, oneOfType, shape, string } from 'prop-types';

// Import configs and util modules
import config from '../../../../config';
import { FormattedMessage, intlShape } from '../../../../util/reactIntl';
import routeConfiguration from '../../../../routing/routeConfiguration';
import { pathByRouteName, findRouteByRouteName } from '../../../../util/routes';
import { propTypes, LINE_ITEM_NIGHT, LINE_ITEM_DAY, DATE_TYPE_DATE } from '../../../../util/types';
import {
  ensureListing,
  ensureCurrentUser,
  ensureUser,
  ensureTransaction,
  ensureBooking,
  ensureStripeCustomer,
  ensurePaymentMethodCard,
} from '../../../../util/data';
import { timeOfDayFromLocalToTimeZone, minutesBetween } from '../../../../util/dates';
import { createSlug } from '../../../../util/urlHelpers';
import { post } from '../../../../util/api';
import {
  isTransactionInitiateAmountTooLowError,
  isTransactionInitiateListingNotFoundError,
  isTransactionInitiateMissingStripeAccountError,
  isTransactionInitiateBookingTimeNotAvailableError,
  isTransactionInitiateListingInsufficientStockError,
  isTransactionChargeDisabledError,
  isTransactionZeroPaymentError,
  isTransitionQuantityInfoMissingError,
  transactionInitiateOrderStripeErrors,
} from '../../../../util/errors';
import { formatMoney, formatMoneyWithDecimals } from '../../../../util/currency';
import { getCaliforniaTotalWithTax } from '../../../../components/OrderBreakdown/LineItemTaxMaybe';
import {
  TRANSITION_ENQUIRE,
  txIsPaymentPending,
  txIsPaymentExpired,
  txHasPassedPaymentPending,
} from '../../../../util/transaction';

// Import shared components
import { OrderBreakdown, Logo, NamedLink, NamedRedirect, Page } from '../../../../components';

// Import modules from this directory

import StripePaymentFormCard from '../../StripePaymentFormCard/StripePaymentFormCard';
import { storeData, storedData, clearData } from '../../CheckoutPageSessionHelpers';
import css from './CardCheckoutPage.module.css';
import ShoppingCartItemsSection from '../../ShoppingCartItemsSection/ShoppingCartItemsSection';
import CustomPaymentMethodSelector from '../../components/CustomPaymentMethodSelector/CustomPaymentMethodSelector';
import { GoogleTagManagerHandler } from '../../../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

const STORAGE_KEY = 'CheckoutPage';

// Stripe PaymentIntent statuses, where user actions are already completed
// https://stripe.com/docs/payments/payment-intents/status
const STRIPE_PI_USER_ACTIONS_DONE_STATUSES = ['processing', 'requires_capture', 'succeeded'];

// Payment charge options
const ONETIME_PAYMENT = 'ONETIME_PAYMENT';
const PAY_AND_SAVE_FOR_LATER_USE = 'PAY_AND_SAVE_FOR_LATER_USE';
const USE_SAVED_CARD = 'USE_SAVED_CARD';

const paymentFlow = (selectedPaymentMethod, saveAfterOnetimePayment) => {
  // Payment mode could be 'replaceCard', but without explicit saveAfterOnetimePayment flag,
  // we'll handle it as one-time payment
  return selectedPaymentMethod === 'defaultCard'
    ? USE_SAVED_CARD
    : saveAfterOnetimePayment
      ? PAY_AND_SAVE_FOR_LATER_USE
      : ONETIME_PAYMENT;
};

const initializeOrderPage = (initialValues, routes, dispatch) => {
  const OrderPage = findRouteByRouteName('OrderDetailsPage', routes);

  // Transaction is already created, but if the initial message
  // sending failed, we tell it to the OrderDetailsPage.
  dispatch(OrderPage.setInitialValues(initialValues));
};

const checkIsPaymentExpired = existingTransaction => {
  return txIsPaymentExpired(existingTransaction)
    ? true
    : txIsPaymentPending(existingTransaction)
      ? minutesBetween(existingTransaction.attributes.lastTransitionedAt, new Date()) >= 15
      : false;
};

const getFormattedTotalPrice = (transaction, intl, shippingState) => {
  // When CA: total = item_price * (1 + tax) + shipping; show that on Confirm and Pay button
  if (shippingState === 'CA') {
    const totalWithTax = getCaliforniaTotalWithTax(transaction);
    if (totalWithTax) return formatMoneyWithDecimals(intl, totalWithTax);
  }
  const totalPrice = transaction.attributes.payinTotal;
  return formatMoney(intl, totalPrice);
};

// Convert the picked date to moment that will represent the same time of day in UTC time zone.
const bookingDatesMaybe = bookingDates => {
  const apiTimeZone = 'Etc/UTC';
  return bookingDates
    ? {
      bookingDates: {
        bookingStart: timeOfDayFromLocalToTimeZone(bookingDates.bookingStart, apiTimeZone),
        bookingEnd: timeOfDayFromLocalToTimeZone(bookingDates.bookingEnd, apiTimeZone),
      },
    }
    : {};
};

// Collect error message checks to a single function.
const getErrorMessages = (
  listingNotFound,
  initiateOrderError,
  speculateTransactionError,
  listingLink
) => {
  let listingNotFoundErrorMessage = null;
  let initiateOrderErrorMessage = null;
  let speculateErrorMessage = null;

  const isAmountTooLowError = isTransactionInitiateAmountTooLowError(initiateOrderError);
  const isChargeDisabledError = isTransactionChargeDisabledError(initiateOrderError);
  const stripeErrors = transactionInitiateOrderStripeErrors(initiateOrderError);

  // We want to show one error at a time for the real transition
  if (listingNotFound) {
    listingNotFoundErrorMessage = <FormattedMessage id="CheckoutPage.listingNotFoundError" />;
  } else if (isAmountTooLowError) {
    initiateOrderErrorMessage = <FormattedMessage id="CheckoutPage.initiateOrderAmountTooLow" />;
  } else if (isTransactionInitiateBookingTimeNotAvailableError(initiateOrderError)) {
    // If bookings are used, there could be error related to those
    initiateOrderErrorMessage = (
      <FormattedMessage id="CheckoutPage.bookingTimeNotAvailableMessage" />
    );
  } else if (isTransitionQuantityInfoMissingError(initiateOrderError)) {
    initiateOrderErrorMessage = (
      <FormattedMessage id="CheckoutPage.correctQuantityInformationMissing" />
    );
  } else if (isTransactionInitiateListingInsufficientStockError(initiateOrderError)) {
    // If stock management is used, there could be error related to that
    initiateOrderErrorMessage = <FormattedMessage id="CheckoutPage.notEnoughStockMessage" />;
  } else if (isChargeDisabledError) {
    initiateOrderErrorMessage = <FormattedMessage id="CheckoutPage.chargeDisabledMessage" />;
  } else if (stripeErrors && stripeErrors.length > 0) {
    // NOTE: Error messages from Stripes are not part of translations.
    // By default they are in English.
    const stripeErrorsAsString = stripeErrors.join(', ');
    initiateOrderErrorMessage = (
      <FormattedMessage
        id="CheckoutPage.initiateOrderStripeError"
        values={{ stripeErrors: stripeErrorsAsString }}
      />
    );
  } else if (initiateOrderError) {
    // Generic initiate order error
    initiateOrderErrorMessage = (
      <FormattedMessage id="CheckoutPage.initiateOrderError" values={{ listingLink }} />
    );
  }

  // We want to show one error at a time for speculateTransition
  if (isTransactionInitiateMissingStripeAccountError(speculateTransactionError)) {
    speculateErrorMessage = (
      <FormattedMessage id="CheckoutPage.providerStripeAccountMissingError" />
    );
  } else if (isTransactionInitiateBookingTimeNotAvailableError(speculateTransactionError)) {
    speculateErrorMessage = <FormattedMessage id="CheckoutPage.bookingTimeNotAvailableMessage" />;
  } else if (isTransactionInitiateListingInsufficientStockError(speculateTransactionError)) {
    speculateErrorMessage = <FormattedMessage id="CheckoutPage.notEnoughStockMessage" />;
  } else if (isTransactionZeroPaymentError(speculateTransactionError)) {
    speculateErrorMessage = <FormattedMessage id="CheckoutPage.initiateOrderAmountTooLow" />;
  } else if (isTransitionQuantityInfoMissingError(speculateTransactionError)) {
    speculateErrorMessage = (
      <FormattedMessage id="CheckoutPage.correctQuantityInformationMissing" />
    );
  } else if (speculateTransactionError) {
    speculateErrorMessage = <FormattedMessage id="CheckoutPage.speculateFailedMessage" />;
  }

  // Add paragraph-container for the error message, if it exists
  const listingNotFoundErrorMessageParagraph = listingNotFoundErrorMessage ? (
    <p className={css.notFoundError}>{listingNotFoundErrorMessage}</p>
  ) : null;
  const initiateOrderErrorMessageParagraph = initiateOrderErrorMessage ? (
    <p className={css.orderError}>{initiateOrderErrorMessage}</p>
  ) : null;
  const speculateErrorMessageParagraph = speculateErrorMessage ? (
    <p className={css.orderError}>{speculateErrorMessage}</p>
  ) : null;
  const speculateTransactionErrorMessageParagraph = speculateTransactionError ? (
    <p className={css.speculateError}>
      <FormattedMessage id="CheckoutPage.speculateTransactionError" />
    </p>
  ) : null;

  return {
    listingNotFoundErrorMessage: listingNotFoundErrorMessageParagraph,
    initiateOrderErrorMessage: initiateOrderErrorMessageParagraph,
    speculateErrorMessage: speculateErrorMessageParagraph,
    speculateTransactionErrorMessage: speculateTransactionErrorMessageParagraph,
  };
};

export default class CardCheckoutPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageData: {},
      dataLoaded: false,
      submitting: false,
      shippingState: '',
    };
    this.stripe = null;

    this.onStripeInitialized = this.onStripeInitialized.bind(this);
    this.loadInitialData = this.loadInitialData.bind(this);
    this.handlePaymentIntent = this.handlePaymentIntent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleShippingStateChange = this.handleShippingStateChange.bind(this);
  }

  componentDidMount() {
    if (window) {
      this.loadInitialData();
    }
  }

  componentDidUpdate() {
    const { currentUser } = this.props;
    const savedState = currentUser?.attributes?.profile?.publicData?.ups_state;
    if (savedState && this.state.shippingState === '') {
      this.setState({ shippingState: savedState });
    }
  }

  /**
   * Load initial data for the page
   *
   * Since the data for the checkout is not passed in the URL (there
   * might be lots of options in the future), we must pass in the data
   * some other way. Currently the ListingPage sets the initial data
   * for the CheckoutPage's Redux store.
   *
   * For some cases (e.g. a refresh in the CheckoutPage), the Redux
   * store is empty. To handle that case, we store the received data
   * to window.sessionStorage and read it from there if no props from
   * the store exist.
   *
   * This function also sets of fetching the speculative transaction
   * based on this initial data.
   */
  loadInitialData() {
    const {
      orderData,
      listing,
      transaction,
      fetchSpeculatedTransaction,
      fetchStripeCustomer,
      history,
    } = this.props;

    // Fetch currentUser with stripeCustomer entity
    // Note: since there's need for data loading in "componentWillMount" function,
    //       this is added here instead of loadData static function.
    fetchStripeCustomer();

    // Browser's back navigation should not rewrite data in session store.
    // Action is 'POP' on both history.back() and page refresh cases.
    // Action is 'PUSH' when user has directed through a link
    // Action is 'REPLACE' when user has directed through login/signup process
    const hasNavigatedThroughLink = history.action === 'PUSH' || history.action === 'REPLACE';

    const hasDataInProps = !!(orderData && listing && hasNavigatedThroughLink);
    if (hasDataInProps) {
      // Store data only if data is passed through props and user has navigated through a link.
      storeData(orderData, listing, transaction, STORAGE_KEY);
    }

    // NOTE: stored data can be empty if user has already successfully completed transaction.
    const pageData = hasDataInProps ? { orderData, listing, transaction } : storedData(STORAGE_KEY);

    const tx = pageData ? pageData.transaction : null;

    // If transaction has passed payment-pending state, speculated tx is not needed.
    const shouldFetchSpeculatedTransaction =
      pageData &&
      pageData.listing &&
      pageData.listing.id &&
      pageData.orderData &&
      !txHasPassedPaymentPending(tx);

    if (shouldFetchSpeculatedTransaction) {
      const listingId = pageData.listing.id;
      const transactionId = tx ? tx.id : null;
      // NOTE: if unit type is line-item/units, quantity needs to be added.
      // The way to pass it to checkout page is through pageData.orderData
      const quantity = pageData.orderData?.quantity;
      const quantityMaybe = quantity ? { quantity } : {};
      const deliveryMethod = pageData.orderData?.deliveryMethod;

      const { proposedPriceAmount, ...restOfOrderData } = pageData.orderData;
      const newOrderData = {
        ...restOfOrderData,
        proposedPriceAmount: parseFloat(proposedPriceAmount),
      };

      const savedState = this.props.currentUser?.attributes?.profile?.publicData?.ups_state;
      
      fetchSpeculatedTransaction(
        {
          listingId,
          deliveryMethod,
          ...quantityMaybe,
          orderData: newOrderData,// pageData.orderData, // proposedPriceAmount need to be number here
          ...bookingDatesMaybe(pageData.orderData.bookingDates),
          shippingState: savedState || '',
          //protectedData: tx?.attributes?.protectedData
        },
        transactionId
      );
    }

    this.setState({ pageData: pageData || {}, dataLoaded: true });
  }

  handlePaymentIntent(handlePaymentParams) {
    const {
      currentUser,
      stripeCustomerFetched,
      onInitiateOrder,
      onConfirmCardPayment,
      onConfirmPayment,
      onSendMessage,
      onSavePaymentMethod,
    } = this.props;
    const {
      pageData,
      speculatedTransaction,
      message,
      paymentIntent,
      selectedPaymentMethod,
      saveAfterOnetimePayment,
      shippingDetails,
    } = handlePaymentParams;
    const storedTx = ensureTransaction(pageData.transaction);

    const ensuredCurrentUser = ensureCurrentUser(currentUser);
    const ensuredStripeCustomer = ensureStripeCustomer(ensuredCurrentUser.stripeCustomer);
    const ensuredDefaultPaymentMethod = ensurePaymentMethodCard(
      ensuredStripeCustomer.defaultPaymentMethod
    );

    let createdPaymentIntent = null;

    const hasDefaultPaymentMethod = !!(
      stripeCustomerFetched &&
      ensuredStripeCustomer.attributes.stripeCustomerId &&
      ensuredDefaultPaymentMethod.id
    );
    const stripePaymentMethodId = hasDefaultPaymentMethod
      ? ensuredDefaultPaymentMethod.attributes.stripePaymentMethodId
      : null;

    const selectedPaymentFlow = paymentFlow(selectedPaymentMethod, saveAfterOnetimePayment);

    // Step 1: initiate order by requesting payment from Marketplace API
    const fnRequestPayment = fnParams => {
      // fnParams should be { listingId, deliveryMethod, quantity?, bookingDates?, paymentMethod?/setupPaymentMethodForSaving? }
      const hasPaymentIntents =
        storedTx.attributes.protectedData && storedTx.attributes.protectedData.stripePaymentIntents;
      fnParams.restOfShoppingCartItems = pageData.orderData.restOfShoppingCartItems;
      fnParams.proposedPriceAmount = pageData?.orderData?.proposedPriceAmount;

      // If paymentIntent exists, order has been initiated previously.
      return hasPaymentIntents ? Promise.resolve(storedTx) : onInitiateOrder(fnParams, storedTx.id);
    };

    // Step 2: pay using Stripe SDK
    const fnConfirmCardPayment = fnParams => {
      // fnParams should be returned transaction entity

      const order = ensureTransaction(fnParams);
      if (order.id) {
        // Store order.
        const { orderData, listing } = pageData;
        storeData(orderData, listing, order, STORAGE_KEY);
        this.setState({ pageData: { ...pageData, transaction: order } });
      }

      const hasPaymentIntents =
        order.attributes.protectedData && order.attributes.protectedData.stripePaymentIntents;

      if (!hasPaymentIntents) {
        throw new Error(
          `Missing StripePaymentIntents key in transaction's protectedData. Check that your transaction process is configured to use payment intents.`
        );
      }

      const { stripePaymentIntentClientSecret } = hasPaymentIntents
        ? order.attributes.protectedData.stripePaymentIntents.default
        : null;

      const { stripe, card, billingDetails, paymentIntent } = handlePaymentParams;
      const stripeElementMaybe = selectedPaymentFlow !== USE_SAVED_CARD ? { card } : {};

      // Note: For basic USE_SAVED_CARD scenario, we have set it already on API side, when PaymentIntent was created.
      // However, the payment_method is save here for USE_SAVED_CARD flow if customer first attempted onetime payment
      const paymentParams =
        selectedPaymentFlow !== USE_SAVED_CARD
          ? {
            payment_method: {
              billing_details: billingDetails,
              card: card,
            },
          }
          : { payment_method: stripePaymentMethodId };

      const params = {
        stripePaymentIntentClientSecret,
        orderId: order.id,
        stripe,
        ...stripeElementMaybe,
        paymentParams,
      };

      // If paymentIntent status is not waiting user action,
      // confirmCardPayment has been called previously.
      const hasPaymentIntentUserActionsDone =
        paymentIntent && STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(paymentIntent.status);
      return hasPaymentIntentUserActionsDone
        ? Promise.resolve({ transactionId: order.id, paymentIntent })
        : onConfirmCardPayment(params);
    };

    // Step 3: complete order by confirming payment to Marketplace API
    // Parameter should contain { paymentIntent, transactionId } returned in step 2
    const fnConfirmPayment = fnParams => {
      createdPaymentIntent = fnParams.paymentIntent;
      return onConfirmPayment(fnParams);
    };

    // Step 4: send initial message
    const fnSendMessage = fnParams => {
      return onSendMessage({ ...fnParams, message });
    };

    // Step 5: optionally save card as defaultPaymentMethod
    const fnSavePaymentMethod = fnParams => {
      const pi = createdPaymentIntent || paymentIntent;

      if (selectedPaymentFlow === PAY_AND_SAVE_FOR_LATER_USE) {
        return onSavePaymentMethod(ensuredStripeCustomer, pi.payment_method)
          .then(response => {
            if (response.errors) {
              return { ...fnParams, paymentMethodSaved: false };
            }
            return { ...fnParams, paymentMethodSaved: true };
          })
          .catch(e => {
            // Real error cases are catched already in paymentMethods page.
            return { ...fnParams, paymentMethodSaved: false };
          });
      } else {
        return Promise.resolve({ ...fnParams, paymentMethodSaved: true });
      }
    };

    // Step 6: - remove items from basket if the case

    const emptyBasktet = fnParams => {
      const isTxWithBasket = pageData.orderData.restOfShoppingCartItems;
      if (isTxWithBasket) {
        return sdk.currentUser
          .updateProfile({
            publicData: {
              shoppingCart: [],
            },
          })
          .then(() => {
            return fnParams;
          })
          .catch(e => {
            console.log(e);
          });
      } else {
        return fnParams;
      }
    };

    // Step 7: - change quantity for the rest of shopping cart items

    const changeRestOfShoppingCartItemsQuantity = fnParams => {
      const restOfShoppingCartItems = pageData.orderData.restOfShoppingCartItems;
      return post('/api/change-all-items-quantity', { restOfShoppingCartItems })
        .then(resp => {
          return fnParams;
        })
        .catch(e => {
          return fnParams;
        });
    };

    //step 8: send email notification with shipping label
    const sendShippingLabelNotification = fnParams => {
      const authorId = pageData?.listing?.author?.id?.uuid;
      const listing = pageData?.listing;

      return post('/api/ups/send-shipping-label-to-provider', { authorId, listing })
        .then(resp => {
          return post('/api/ups/send-package-on-the-way-email-to-provider', { authorId, listing })
            .then(resp => {
              return fnParams;
            })
            .catch(e => {
              throw e;
            });
        })
        .catch(e => {
          console.log(e);
          return fnParams;
        });
    };
    // Here we create promise calls in sequence
    // This is pretty much the same as:
    // fnRequestPayment({...initialParams})
    //   .then(result => fnConfirmCardPayment({...result}))
    //   .then(result => fnConfirmPayment({...result}))
    const applyAsync = (acc, val) => acc.then(val);
    const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x));
    const handlePaymentIntentCreation = composeAsync(
      fnRequestPayment,
      fnConfirmCardPayment,
      fnConfirmPayment,
      fnSendMessage,
      fnSavePaymentMethod,
      emptyBasktet,
      changeRestOfShoppingCartItemsQuantity,
      sendShippingLabelNotification
    );

    // Create order aka transaction
    // NOTE: if unit type is line-item/units, quantity needs to be added.
    // The way to pass it to checkout page is through pageData.orderData
    const tx = speculatedTransaction ? speculatedTransaction : storedTx;

    const deliveryMethod = pageData.orderData?.deliveryMethod;
    const quantity = pageData.orderData?.quantity;
    const quantityMaybe = quantity ? { quantity } : {};
    const protectedDataMaybe =
      deliveryMethod && shippingDetails
        ? { 
            protectedData: { 
              deliveryMethod, 
              shippingDetails,
              shippingState: shippingDetails.address?.state 
            } 
          }
        : deliveryMethod
          ? { protectedData: { deliveryMethod } }
          : {};
    // Note: optionalPaymentParams contains Stripe paymentMethod,
    // but that can also be passed on Step 2
    // stripe.confirmCardPayment(stripe, { payment_method: stripePaymentMethodId })
    const optionalPaymentParams =
      selectedPaymentFlow === USE_SAVED_CARD && hasDefaultPaymentMethod
        ? { paymentMethod: stripePaymentMethodId }
        : selectedPaymentFlow === PAY_AND_SAVE_FOR_LATER_USE
          ? { setupPaymentMethodForSaving: true }
          : {};


    const { proposedPriceAmount, ...restOfOrderData } = pageData.orderData;
    const newOrderData = {
      ...restOfOrderData,
      proposedPriceAmount: parseFloat(proposedPriceAmount),
    };

    const orderParams = {
      listingId: pageData.listing.id,
      deliveryMethod,
      orderData: newOrderData,
      shippingState: shippingDetails?.address?.state,
      ...quantityMaybe,
      ...bookingDatesMaybe(pageData.orderData.bookingDates),
      ...protectedDataMaybe,
      ...optionalPaymentParams,
    };

    return handlePaymentIntentCreation(orderParams);
  }

  handleShippingStateChange(recipientState) {
    this.setState({ shippingState: recipientState || '' });
  }

  handleSubmit(values) {
    if (this.state.submitting) {
      return;
    }
    this.setState({ submitting: true });

    const { history, speculatedTransaction, currentUser, paymentIntent, dispatch } = this.props;
    const { card, message, paymentMethod, formValues } = values;
    const {
      name,
      addressLine1,
      addressLine2,
      postal,
      city,
      state,
      country,
      saveAfterOnetimePayment,
      recipientName,
      recipientPhoneNumber,
      recipientAddressLine1,
      recipientAddressLine2,
      recipientPostal,
      recipientCity,
      recipientState,
      recipientCountry,
    } = formValues;

    // Billing address is recommended.
    // However, let's not assume that <StripePaymentAddress> data is among formValues.
    // Read more about this from Stripe's docs
    // https://stripe.com/docs/stripe-js/reference#stripe-handle-card-payment-no-element
    const addressMaybe =
      addressLine1 && postal
        ? {
          address: {
            city: city,
            country: country,
            line1: addressLine1,
            line2: addressLine2,
            postal_code: postal,
            state: state,
          },
        }
        : {};
    const billingDetails = {
      name,
      email: ensureCurrentUser(currentUser).attributes.email,
      ...addressMaybe,
    };

    const shippingDetailsMaybe =
      recipientName && recipientAddressLine1 && recipientPostal
        ? {
          shippingDetails: {
            name: recipientName,
            phoneNumber: recipientPhoneNumber,
            address: {
              city: recipientCity,
              country: recipientCountry,
              line1: recipientAddressLine1,
              line2: recipientAddressLine2,
              postalCode: recipientPostal,
              state: recipientState,
            },
          },
        }
        : {};

    const requestPaymentParams = {
      pageData: this.state.pageData,
      speculatedTransaction,
      stripe: this.stripe,
      card,
      billingDetails,
      message,
      paymentIntent,
      selectedPaymentMethod: paymentMethod,
      saveAfterOnetimePayment:
        Array.isArray(saveAfterOnetimePayment) && saveAfterOnetimePayment.length > 0,
      ...shippingDetailsMaybe,
    };

    const tranckingData = {
      purchasePrice: requestPaymentParams.pageData.orderData.proposedPriceAmount ?? requestPaymentParams.pageData.listing.attributes.price.amount,
      user: {
        userID: requestPaymentParams.speculatedTransaction.id,
        userName: requestPaymentParams.billingDetails.name,
        userEmail: requestPaymentParams.billingDetails.email,
      },
      commissionAmount: (requestPaymentParams.pageData.orderData.proposedPriceAmount ?? requestPaymentParams.pageData.listing.attributes.price.amount) - requestPaymentParams.speculatedTransaction.attributes.payoutTotal.amount,
      transactionID: requestPaymentParams.pageData.transaction?.id?? null,
      items: [
        {
          item_id: requestPaymentParams.pageData.listing.id,
          item_name: requestPaymentParams.pageData.listing.attributes.title,
          item_brand: requestPaymentParams.pageData.listing.attributes.publicData.branded === 'branded' ? requestPaymentParams.pageData.listing.attributes.publicData.brandName : 'unbranded',
          item_category: requestPaymentParams.pageData.listing.attributes.publicData.category,
          item_category2: requestPaymentParams.pageData.listing.attributes.publicData.subcategory,
          price: requestPaymentParams.pageData.listing.attributes.price.amount,
          currency: requestPaymentParams.pageData.listing.attributes.price.currency,
          quantity: requestPaymentParams.pageData.listing.currentStock.attributes.quantity,

        }
      ],
    }

    this.handlePaymentIntent(requestPaymentParams)
      .then(res => {
        gtmHandler.trackCustomEvent('purchase', tranckingData);
        const { orderId, messageSuccess, paymentMethodSaved } = res;
        this.setState({ submitting: false });

        const routes = routeConfiguration();
        const initialMessageFailedToTransaction = messageSuccess ? null : orderId;
        const orderDetailsPath = pathByRouteName('OrderDetailsPage', routes, { id: orderId.uuid });
        const initialValues = {
          initialMessageFailedToTransaction,
          savePaymentMethodFailed: !paymentMethodSaved,
        };

        initializeOrderPage(initialValues, routes, dispatch);
        clearData(STORAGE_KEY);
        history.push(orderDetailsPath);
      })
      .catch(err => {
        console.error(err);
        this.setState({ submitting: false });
      });
  }

  onStripeInitialized(stripe) {
    this.stripe = stripe;

    const { paymentIntent, onRetrievePaymentIntent } = this.props;
    const tx = this.state.pageData ? this.state.pageData.transaction : null;

    // We need to get up to date PI, if payment is pending but it's not expired.
    const shouldFetchPaymentIntent =
      this.stripe &&
      !paymentIntent &&
      tx &&
      tx.id &&
      txIsPaymentPending(tx) &&
      !checkIsPaymentExpired(tx);

    if (shouldFetchPaymentIntent) {
      const { stripePaymentIntentClientSecret } =
        tx.attributes.protectedData && tx.attributes.protectedData.stripePaymentIntents
          ? tx.attributes.protectedData.stripePaymentIntents.default
          : {};

      // Fetch up to date PaymentIntent from Stripe
      onRetrievePaymentIntent({ stripe, stripePaymentIntentClientSecret });
    }
  }

  render() {
    const {
      scrollingDisabled,
      speculateTransactionInProgress,
      speculateTransactionError,
      speculatedTransaction: speculatedTransactionMaybe,
      initiateOrderError,
      confirmPaymentError,
      intl,
      params,
      currentUser,
      confirmCardPaymentError,
      paymentIntent,
      retrievePaymentIntentError,
      stripeCustomerFetched,
    } = this.props;
    // Since the listing data is already given from the ListingPage
    // and stored to handle refreshes, it might not have the possible
    // deleted or closed information in it. If the transaction
    // initiate or the speculative initiate fail due to the listing
    // being deleted or closec, we should dig the information from the
    // errors and not the listing data.
    const listingNotFound =
      isTransactionInitiateListingNotFoundError(speculateTransactionError) ||
      isTransactionInitiateListingNotFoundError(initiateOrderError);

    const isLoading = !this.state.dataLoaded || speculateTransactionInProgress;

    const { listing, transaction, orderData } = this.state.pageData;
    const existingTransaction = ensureTransaction(transaction);
    const speculatedTransaction = ensureTransaction(speculatedTransactionMaybe, {}, null);
    const currentListing = ensureListing(listing);
    const currentAuthor = ensureUser(currentListing.author);

    const listingTitle = currentListing.attributes.title;
    const title = intl.formatMessage({ id: 'CheckoutPage.title' }, { listingTitle });

    const pageProps = { title, scrollingDisabled };
    const topbar = (
      <div className={css.topbar}>
        <NamedLink className={css.home} name="LandingPage">
          <Logo
            className={css.logoMobile}
            title={intl.formatMessage({ id: 'CheckoutPage.goToLandingPage' })}
            format="mobile"
          />
          <Logo
            className={css.logoDesktop}
            alt={intl.formatMessage({ id: 'CheckoutPage.goToLandingPage' })}
            format="desktop"
          />
        </NamedLink>
      </div>
    );

    if (isLoading) {
      return <Page {...pageProps}>{topbar}</Page>;
    }

    const isOwnListing =
      currentUser &&
      currentUser.id &&
      currentAuthor &&
      currentAuthor.id &&
      currentAuthor.id.uuid === currentUser.id.uuid;

    const hasRequiredData = !!(currentListing.id && currentAuthor.id);
    const canShowPage = hasRequiredData && !isOwnListing;
    const shouldRedirect = !isLoading && !canShowPage;

    // Redirect back to ListingPage if data is missing.
    // Redirection must happen before any data format error is thrown (e.g. wrong currency)
    if (shouldRedirect) {
      // eslint-disable-next-line no-console
      console.error('Missing or invalid data for checkout, redirecting back to listing page.', {
        transaction: speculatedTransaction,
        listing,
      });
      return <NamedRedirect name="ListingPage" params={params} />;
    }

    // Show breakdown only when (speculated?) transaction is loaded
    // (i.e. have an id and lineItems)
    const tx = existingTransaction.booking ? existingTransaction : speculatedTransaction;
    const txBookingMaybe = tx.booking?.id
      ? { booking: ensureBooking(tx.booking), dateType: DATE_TYPE_DATE }
      : {};
    const breakdown =
      tx.id && tx.attributes.lineItems?.length > 0 ? (
        <OrderBreakdown
          className={css.orderBreakdown}
          userRole="customer"
          unitType={config.lineItemUnitType}
          transaction={tx}
          listing={currentListing}
          restOfShoppingCartItems={this.state.pageData.orderData.restOfShoppingCartItems}
          shippingState={this.state.shippingState}
          {...txBookingMaybe}
        />
      ) : null;

    const isPaymentExpired = checkIsPaymentExpired(existingTransaction);
    const hasDefaultPaymentMethod = !!(
      stripeCustomerFetched &&
      ensureStripeCustomer(currentUser.stripeCustomer).attributes.stripeCustomerId &&
      ensurePaymentMethodCard(currentUser.stripeCustomer.defaultPaymentMethod).id
    );

    // Allow showing page when currentUser is still being downloaded,
    // but show payment form only when user info is loaded.
    const showPaymentForm = !!(
      currentUser &&
      hasRequiredData &&
      !listingNotFound &&
      !initiateOrderError &&
      !speculateTransactionError &&
      !retrievePaymentIntentError &&
      !isPaymentExpired
    );

    const firstImage = currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

    const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
    const variants = firstImage
      ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
      : [];

    const listingLink = (
    //  <NamedLink
    //   name="OrderDetailsPage"
    //   params={{ id: existingTransaction.id.uuid }}
    //  >
    //   <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
    //  </NamedLink>
     <NamedLink
      name="ListingPage"
      params={{ id: currentListing.id.uuid, slug: createSlug(listingTitle) }}
     >
      <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
     </NamedLink>
    );

    const {
      listingNotFoundErrorMessage,
      initiateOrderErrorMessage,
      speculateErrorMessage,
      speculateTransactionErrorMessage,
    } = getErrorMessages(
      listingNotFound,
      initiateOrderError,
      speculateTransactionError,
      listingLink
    );

    const unitType = config.lineItemUnitType;
    const isNightly = unitType === LINE_ITEM_NIGHT;
    const isDaily = unitType === LINE_ITEM_DAY;

    const unitTranslationKey = isNightly
      ? 'CheckoutPage.perNight'
      : isDaily
        ? 'CheckoutPage.perDay'
        : 'CheckoutPage.perUnit';

    const price = currentListing.attributes.price;
    const formattedPrice = formatMoney(intl, price);
    const detailsSubTitle = `${formattedPrice} ${intl.formatMessage({ id: unitTranslationKey })}`;

    const showInitialMessageInput = !(
      existingTransaction && existingTransaction.attributes.lastTransition === TRANSITION_ENQUIRE
    );

    // Get first and last name of the current user and use it in the StripePaymentFormCard to autofill the name field
    const userName =
      currentUser && currentUser.attributes
        ? `${currentUser.attributes.profile.firstName} ${currentUser.attributes.profile.lastName}`
        : null;

    // If paymentIntent status is not waiting user action,
    // confirmCardPayment has been called previously.
    const hasPaymentIntentUserActionsDone =
      paymentIntent && STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(paymentIntent.status);

    // If your marketplace works mostly in one country you can use initial values to select country automatically
    // e.g. {country: 'FI'}

    const currentUserPhoneNumber = currentUser?.attributes?.profile?.protectedData?.phoneNumber;
    const currentUserPublicData = currentUser?.attributes?.profile?.publicData || {};

    const initalValuesForStripePayment = {
      name: userName,
      recipientName: userName,
      recipientPhoneNumber: currentUserPhoneNumber,
      recipientAddressLine1: currentUserPublicData?.ups_addressLine1,
      recipientAddressLine2: currentUserPublicData?.ups_addressLine2,
      recipientPostal: currentUserPublicData?.ups_zip,
      recipientCity: currentUserPublicData?.ups_city,
      recipientState: currentUserPublicData?.ups_state,
      recipientCountry: currentUserPublicData?.ups_country || 'US',
    };

    return (
      <Page {...pageProps}>
        {topbar}
        <div className={css.contentContainer}>
          <div className={css.bookListingContainer}>
            <div className={css.priceBreakdownContainer}>
              {speculateTransactionErrorMessage}
              {breakdown}
            </div>
            <ShoppingCartItemsSection
              currentListing={currentListing}
              orderData={this.state.pageData.orderData || []}
              firstImage={firstImage}
              intl={intl}
            />
          </div>
          <div className={css.detailsContainerDesktop}>
            {speculateTransactionErrorMessage}
            <h2 className={css.orderBreakdownTitle}>
              <FormattedMessage id="CheckoutPage.orderBreakdown2" />
            </h2>
            {breakdown}
          </div>
        </div>
        <CustomPaymentMethodSelector />
        <div className={css.paymentContainer}>
          {initiateOrderErrorMessage}
          {listingNotFoundErrorMessage}
          {speculateErrorMessage}
          {retrievePaymentIntentError ? (
            <p className={css.orderError}>
              <FormattedMessage
                id="CheckoutPage.retrievingStripePaymentIntentFailed"
                values={{ listingLink }}
              />
            </p>
          ) : null}
          {showPaymentForm ? (
            <StripePaymentFormCard
              className={css.paymentForm}
              onSubmit={this.handleSubmit}
              inProgress={this.state.submitting}
              formId="CheckoutPagePaymentForm"
              authorDisplayName={currentAuthor.attributes.profile.displayName}
              showInitialMessageInput={showInitialMessageInput}
              initialValues={initalValuesForStripePayment}
              onShippingStateChange={this.handleShippingStateChange}
              initiateOrderError={initiateOrderError}
              confirmCardPaymentError={confirmCardPaymentError}
              confirmPaymentError={confirmPaymentError}
              hasHandledCardPayment={hasPaymentIntentUserActionsDone}
              loadingData={!stripeCustomerFetched}
              defaultPaymentMethod={
                hasDefaultPaymentMethod ? currentUser.stripeCustomer.defaultPaymentMethod : null
              }
              paymentIntent={paymentIntent}
              onStripeInitialized={this.onStripeInitialized}
              askShippingDetails={orderData?.deliveryMethod === 'shipping'}
              pickupLocation={currentListing?.attributes?.publicData?.location}
              totalPrice={tx.id ? getFormattedTotalPrice(tx, intl, this.state.shippingState) : null}
              currentUser={currentUser}
            />
          ) : null}
          {isPaymentExpired ? (
            <p className={css.orderError}>
              <FormattedMessage id="CheckoutPage.paymentExpiredMessage" values={{ listingLink }} />
            </p>
          ) : null}
        </div>
      </Page>
    );
  }
}

CardCheckoutPage.defaultProps = {
  initiateOrderError: null,
  confirmPaymentError: null,
  listing: null,
  orderData: {},
  speculateTransactionError: null,
  speculatedTransaction: null,
  transaction: null,
  currentUser: null,
  paymentIntent: null,
};

CardCheckoutPage.propTypes = {
  scrollingDisabled: bool.isRequired,
  listing: propTypes.listing,
  orderData: object,
  fetchStripeCustomer: func.isRequired,
  stripeCustomerFetched: bool.isRequired,
  fetchSpeculatedTransaction: func.isRequired,
  speculateTransactionInProgress: bool.isRequired,
  speculateTransactionError: propTypes.error,
  speculatedTransaction: propTypes.transaction,
  transaction: propTypes.transaction,
  currentUser: propTypes.currentUser,
  params: shape({
    id: string,
    slug: string,
  }).isRequired,
  onConfirmPayment: func.isRequired,
  onInitiateOrder: func.isRequired,
  onConfirmCardPayment: func.isRequired,
  onRetrievePaymentIntent: func.isRequired,
  onSavePaymentMethod: func.isRequired,
  onSendMessage: func.isRequired,
  initiateOrderError: propTypes.error,
  confirmPaymentError: propTypes.error,
  // confirmCardPaymentError comes from Stripe so that's why we can't expect it to be in a specific form
  confirmCardPaymentError: oneOfType([propTypes.error, object]),
  paymentIntent: object,

  // from connect
  dispatch: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
};
