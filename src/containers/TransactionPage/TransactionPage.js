import React, { useState, useEffect } from 'react';
import { array, arrayOf, bool, func, number, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { propTypes } from '../../util/types';
import {
  ensureListing,
  ensureOwnListing,
  ensureTransaction
} from '../../util/data';
import { timeOfDayFromTimeZoneToLocal } from '../../util/dates';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../util/urlHelpers';
import { txIsPaymentPending } from '../../util/transaction';
import routeConfiguration from '../../routing/routeConfiguration';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

import {
  NamedRedirect,
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  UserDisplayName,
  Modal,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import DisputeModal from './DisputeModal/DisputeModal';
import ReviewModal from './ReviewModal/ReviewModal';
import TransactionPanel from './TransactionPanel/TransactionPanel';

import {
  dispute,
  markReceived,
  markReceivedFromPurchased,
  markDelivered,
  sendMessage,
  sendReview,
  fetchMoreMessages,
  fetchTransactionLineItems,
  acceptOfferByProvider,
  declineOfferByProvider,
  makeOfferByProvider,
  makeOfferByCustomer,
  acceptOfferByCustomer,
} from './TransactionPage.duck';

import { sendOffer } from '../ListingPage/ListingPage.duck.js'
import css from './TransactionPage.module.css';
import MakeOfferForm from '../ListingPage/MakeOfferForm/MakeOfferForm';
import { GoogleTagManagerHandler } from '../../analytics/handlers';
import { types as sdkTypes } from '../../util/sdkLoader';

const gtmHandler = new GoogleTagManagerHandler();

const PROVIDER = 'provider';
const CUSTOMER = 'customer';
const { UUID } = sdkTypes;

// TransactionPage handles data loading for Sale and Order views to transaction pages in Inbox.
export const TransactionPageComponent = props => {
  const [state, setState] = useState({
    isDisputeModalOpen: false,
    disputeSubmitted: false,
    isReviewModalOpen: false,
    reviewSubmitted: false,
    makeOfferModalOpen: false,
    errorMessage: "",
  });

  const {
    currentUser,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    fetchMessagesError,
    fetchMessagesInProgress,
    totalMessagePages,
    oldestMessagePageFetched,
    fetchTransactionError,
    history,
    intl,
    messages,
    onManageDisableScrolling,
    onSendMessage,
    onSendReview,
    onShowMoreMessages,
    params,
    scrollingDisabled,
    sendMessageError,
    sendMessageInProgress,
    sendReviewError,
    sendReviewInProgress,
    transaction,
    transactionRole,
    disputeInProgress,
    disputeError,
    onDispute,
    markReceivedInProgress,
    markReceivedError,
    onMarkReceived,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    onMarkReceivedFromPurchased,
    markDeliveredInProgress,
    markDeliveredError,
    onMarkDelivered,
    timeSlots,
    fetchTimeSlotsError,
    processTransitions,
    callSetInitialValues,
    onInitializeCardPaymentData,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    onAcceptOfferByProvider,
    onDeclineOfferByProvider,
    onMakeOfferByProvider,
    onAcceptOfferByCustomer,
    onDeclineOfferByCustomer,
    onMakeOfferByCustomer,
  } = props;

  const currentTransaction = ensureTransaction(transaction);
  const currentListing = ensureListing(currentTransaction.listing);
  const isProviderRole = transactionRole === PROVIDER;
  const isCustomerRole = transactionRole === CUSTOMER;

  let proposedPriceAmount = currentTransaction?.attributes?.protectedData?.proposedPriceAmount;
  const transitions = currentTransaction?.attributes?.transitions || [];
  const isOfferAccepted = transitions.find(
    tr => tr?.transition === 'transition/offer-accepted-by-provider'
      || tr?.transition === 'transition/offer-accepted-by-customer'
  );

  // parse proposedPriceAmount to integer
  let proposedPriceAmountInt = proposedPriceAmount ? parseInt(proposedPriceAmount) : null;

  //let proposedPriceAmount = protectedData?.proposedPriceAmount;

  const parsedProposedPriceAmount = parseFloat(proposedPriceAmount);
  if (isNaN(parsedProposedPriceAmount) || isNaN(proposedPriceAmountInt)) {
    if (currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory?.length > 0) {
      let proposedFromHistory = currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory[currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory?.length - 1]?.offer;
      proposedPriceAmount = proposedFromHistory;
    }
  }
  //TODO temporary fix, better not allow to send non numbers


  if (isNaN(proposedPriceAmountInt)) {
    proposedPriceAmountInt = proposedPriceAmount;
  }

  if (isOfferAccepted && currentTransaction) {
    currentListing.attributes.price.amount = proposedPriceAmountInt; //proposedPriceAmount;
    currentTransaction.listing.attributes.price.amount = proposedPriceAmountInt;//proposedPriceAmount;
  }

  const redirectToCheckoutPageWithInitialValues = (initialValues) => {
    const routes = routeConfiguration();
    // Customize checkout page state with current listing and selected bookingDates
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);
    callSetInitialValues(setInitialValues, initialValues);

    // Clear previous Stripe errors from store if there is any
    onInitializeCardPaymentData();

    // Redirect to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routes,
        { id: currentListing.id.uuid, slug: createSlug(currentListing.attributes.title) },
        {}
      )
    );
  };

  // If payment is pending, redirect to CheckoutPage
  if (
    txIsPaymentPending(currentTransaction) &&
    isCustomerRole &&
    currentTransaction.attributes.lineItems
  ) {
    const currentBooking = ensureListing(currentTransaction.booking);
    const bookingDatesMaybe = currentBooking.id
      ? {
        bookingDates: {
          // In day-based booking process, booking start and end come in server's time zone.
          bookingStart: timeOfDayFromTimeZoneToLocal(
            currentBooking.attributes.start,
            apiTimeZone
          ),
          bookingEnd: timeOfDayFromTimeZoneToLocal(currentBooking.attributes.end, apiTimeZone),
        },
      }
      : {};

    const apiTimeZone = 'Etc/UTC';
    const initialValues = {
      listing: currentListing,
      // Transaction with payment pending should be passed to CheckoutPage
      transaction: currentTransaction,
      // Original orderData content is not available,
      // but it is already used since booking is created.
      // (E.g. quantity is used when booking is created.)
      orderData: {
        ...bookingDatesMaybe,
      },
    };

    redirectToCheckoutPageWithInitialValues(initialValues);
  };

  // Customer can create a booking, if the tx is in "enquiry" state.
  const handleSubmitOrderRequest = values => {
    const { bookingDates, quantity: quantityRaw, ...otherOrderData } = values;
    const bookingDatesMaybe = bookingDates
      ? {
        bookingDates: {
          bookingStart: bookingDates.startDate,
          bookingEnd: bookingDates.endDate,
        },
      }
      : {};

    const initialValues = {
      listing: currentListing,
      // enquired transaction should be passed to CheckoutPage
      transaction: currentTransaction,
      orderData: {
        ...bookingDatesMaybe,
        quantity: Number.parseInt(quantityRaw, 10),
        ...otherOrderData,
        proposedPriceAmount: isOfferAccepted && proposedPriceAmount ? proposedPriceAmount : null,
      },
      confirmPaymentError: null,
    };

    redirectToCheckoutPageWithInitialValues(initialValues);
  };

  // Open review modal
  // This is called from ActivityFeed and from action buttons
  const onOpenReviewModal = () => {
    setState(prevState => ({ ...prevState, isReviewModalOpen: true }));
  };

  // Submit review and close the review modal
  const onSubmitReview = values => {
    const { reviewRating, reviewContent } = values;
    const rating = Number.parseInt(reviewRating, 10);
    onSendReview(transactionRole, currentTransaction, rating, reviewContent)
      .then(r =>
        setState(prevState => ({ ...prevState, isReviewModalOpen: false, reviewSubmitted: true }))
      )
      .catch(e => {
        // Do nothing.
      });
  };

  // Open dispute modal
  const onOpenDisputeModal = () => {
    setState(prevState => ({ ...prevState, isDisputeModalOpen: true }));
  };
  // Submit dispute and close the review modal
  const onDisputeOrder = values => {
    const { disputeReason } = values;
    onDispute(currentTransaction.id, disputeReason)
      .then(r => {
        return setState(prevState => ({ ...prevState, disputeSubmitted: true }));
      })
      .catch(e => {
        // Do nothing.
      });
  };

  const deletedListingTitle = intl.formatMessage({
    id: 'TransactionPage.deletedListing',
  });
  const listingTitle = currentListing.attributes.deleted
    ? deletedListingTitle
    : currentListing.attributes.title;

  // Redirect users with someone else's direct link to their own inbox/sales or inbox/orders page.
  const isDataAvailable =
    currentUser &&
    currentTransaction.id &&
    currentTransaction.id.uuid === params.id &&
    currentTransaction.attributes.lineItems &&
    currentTransaction.customer &&
    currentTransaction.provider &&
    !fetchTransactionError;

  const isShippable =
    isDataAvailable && currentTransaction.attributes?.protectedData?.deliveryMethod === 'shipping';

  const isOwnSale =
    isDataAvailable &&
    isProviderRole &&
    currentUser.id.uuid === currentTransaction.provider.id.uuid;
  const isOwnOrder =
    isDataAvailable &&
    isCustomerRole &&
    currentUser.id.uuid === currentTransaction.customer.id.uuid;

  if (isDataAvailable && isProviderRole && !isOwnSale) {
    // eslint-disable-next-line no-console
    console.error('Tried to access a sale that was not owned by the current user');
    return <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} />;
  } else if (isDataAvailable && isCustomerRole && !isOwnOrder) {
    // eslint-disable-next-line no-console
    console.error('Tried to access an order that was not owned by the current user');
    return <NamedRedirect name="InboxPage" params={{ tab: 'orders' }} />;
  }

  const detailsClassName = classNames(css.tabContent, css.tabContentVisible);

  const fetchErrorMessage = isCustomerRole
    ? 'TransactionPage.fetchOrderFailed'
    : 'TransactionPage.fetchSaleFailed';
  const loadingMessage = isCustomerRole
    ? 'TransactionPage.loadingOrderData'
    : 'TransactionPage.loadingSaleData';

  const loadingOrFailedFetching = fetchTransactionError ? (
    <p className={css.error}>
      <FormattedMessage id={`${fetchErrorMessage}`} />
    </p>
  ) : (
    <p className={css.loading}>
      <FormattedMessage id={`${loadingMessage}`} />
    </p>
  );

  const initialMessageFailed = !!(
    initialMessageFailedToTransaction &&
    currentTransaction.id &&
    initialMessageFailedToTransaction.uuid === currentTransaction.id.uuid
  );

  const otherUserDisplayName = isOwnOrder ? (
    <UserDisplayName user={currentTransaction.provider} intl={intl} />
  ) : (
    <UserDisplayName user={currentTransaction.customer} intl={intl} />
  );

  const onSubmitOffer = (values) => {
    if (!values || !values.proposedPrice) {
      setState(prevState => ({ ...prevState, errorMessage: "You must input price" }));
      return;
    } else if (isNaN(values.proposedPrice)) {
      setState(prevState => ({ ...prevState, errorMessage: "Please type a number" }));
      return;
    }
    const calculateEstimatedEarnings = price => {
      return price * 0.7;
    };

    const {
      history,
      params,
      onSendOffer,
      getOwnListing,
      getListing,
      onAcceptOfferByCustomer,
    } = props;

    const listingId = transaction.listing.id;
    // const listingId = new UUID(params.id);
    const isPendingApprovalVariant = params.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
    const isDraftVariant = params.variant === LISTING_PAGE_DRAFT_VARIANT;
    const currentListing =
      isPendingApprovalVariant || isDraftVariant
        ? ensureOwnListing(getOwnListing(listingId))
        : ensureListing(getListing(listingId));

    console.log(listingId)
    console.log(getListing(listingId))
    console.log(isPendingApprovalVariant)
    console.log(isDraftVariant)
    console.log(currentListing)

    const listPrice = currentListing.attributes.price.amount;
    const lowestPrice = currentListing.attributes.publicData.lowestPrice * 100;
    const proposalPrice = values.proposedPrice * 100;

    const estimated = calculateEstimatedEarnings(listPrice);
    var message;

    const routes = routeConfiguration();
    const { proposedPrice } = values;
    const proposedPriceAmount = proposedPrice * 100; //proposedPrice?.amount;

    const { toggleMakeOffer } = currentListing?.attributes?.metadata || {};

    if (toggleMakeOffer === 'off') {
      return;
    }

    if (proposalPrice < estimated) {
      setState(prevState => ({ ...prevState, errorMessage: "Your offer was declined, because it was too low. Please submit a new offer, thanks!" }));
      return;
    }

    if (proposalPrice >= lowestPrice) {
      message = "autoAccepted"
    }
    else {
      message = "normalOffer"
    }

    const protectedDataInfo = { proposedPriceAmount, message };

    onSendOffer(listingId, protectedDataInfo)
      .then(txId => {
        setState(prevState => ({ ...prevState, makeOfferModalOpen: false }));

        // Redirect to OrderDetailsPage
        history.push(
          createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {})
        );
        if (proposalPrice >= lowestPrice) {
          const params = { id: txId };
          onAcceptOfferByCustomer(params);
        }

        gtmHandler.trackCustomEvent('offer', {
          userID: this.props.currentUser.id,
          listingId: listingId,
          proposedPriceAmount: proposedPriceAmount,
        });
      })
      .catch(() => {
        // Ignore, error handling in duck file
      });
  }

  const onMakeOffer = () => {
    const {
      currentUser,
      history,
      callSetInitialValues,
      params,
      location,
      params: rawParams,
      getOwnListing,
      getListing,
    } = props;

    const listingId = transaction.listing.id;
    const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
    const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
    const currentListing =
      isPendingApprovalVariant || isDraftVariant
        ? ensureOwnListing(getOwnListing(listingId))
        : ensureListing(getListing(listingId));
    const { toggleMakeOffer } = currentListing?.attributes?.metadata || {};
    if (toggleMakeOffer === 'off') {
      return;
    }

    if (!currentUser) {
      const state = { from: `${location.pathname}${location.search}${location.hash}` };

      // We need to log in before showing the modal, but first we need to ensure
      // that modal does open when user is redirected back to this listingpage
      callSetInitialValues(setInitialValues, { enquiryModalOpenForListingId: params.id });

      // signup and return back to listingPage.
      history.push(createResourceLocatorString('SignupPage', routeConfiguration(), {}, {}), state);
    } else {
      setState(prevState => ({ ...prevState, makeOfferModalOpen: true }));
    }
  }

  // TransactionPanel is presentational component
  // that currently handles showing everything inside layout's main view area.
  const panel = isDataAvailable ? (
    <TransactionPanel
      className={detailsClassName}
      currentUser={currentUser}
      openMakeOfferModal={onMakeOffer}
      transaction={currentTransaction}
      fetchMessagesInProgress={fetchMessagesInProgress}
      totalMessagePages={totalMessagePages}
      oldestMessagePageFetched={oldestMessagePageFetched}
      messages={messages}
      initialMessageFailed={initialMessageFailed}
      savePaymentMethodFailed={savePaymentMethodFailed}
      fetchMessagesError={fetchMessagesError}
      sendMessageInProgress={sendMessageInProgress}
      sendMessageError={sendMessageError}
      onManageDisableScrolling={onManageDisableScrolling}
      onShowMoreMessages={onShowMoreMessages}
      onSendMessage={onSendMessage}
      onOpenReviewModal={onOpenReviewModal}
      onOpenDisputeModal={onOpenDisputeModal}
      transactionRole={transactionRole}
      markReceivedProps={{
        inProgress: markReceivedInProgress,
        error: markReceivedError,
        onTransition: () => onMarkReceived(currentTransaction.id),
        buttonText: intl.formatMessage({
          id: 'TransactionPage.markReceived.actionButton',
        }),
        errorText: intl.formatMessage({
          id: 'TransactionPage.markReceived.actionError',
        }),
      }}
      markReceivedFromPurchasedProps={{
        inProgress: markReceivedFromPurchasedInProgress,
        error: markReceivedFromPurchasedError,
        onTransition: () => onMarkReceivedFromPurchased(currentTransaction.id),
        buttonText: intl.formatMessage({
          id: 'TransactionPage.markReceivedFromPurchased.actionButton',
        }),
        errorText: intl.formatMessage({
          id: 'TransactionPage.markReceivedFromPurchased.actionError',
        }),
      }}
      markDeliveredProps={{
        inProgress: markDeliveredInProgress,
        error: markDeliveredError,
        onTransition: () => onMarkDelivered(currentTransaction.id),
        buttonText: intl.formatMessage({
          id: isShippable
            ? 'TransactionPage.markShipped.actionButton'
            : 'TransactionPage.markDelivered.actionButton',
        }),
        errorText: intl.formatMessage({ id: 'TransactionPage.markDelivered.actionError' }),
      }}
      leaveReviewProps={{
        inProgress: sendReviewInProgress,
        error: sendReviewError,
        onTransition: onOpenReviewModal,
        buttonText: intl.formatMessage({ id: 'TransactionPage.leaveReview.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.leaveReview.actionError' }),
      }}
      nextTransitions={processTransitions}
      onSubmitOrderRequest={handleSubmitOrderRequest}
      timeSlots={timeSlots}
      fetchTimeSlotsError={fetchTimeSlotsError}
      onFetchTransactionLineItems={onFetchTransactionLineItems}
      lineItems={lineItems}
      fetchLineItemsInProgress={fetchLineItemsInProgress}
      fetchLineItemsError={fetchLineItemsError}
      onAcceptOfferByProvider={onAcceptOfferByProvider}
      onDeclineOfferByProvider={onDeclineOfferByProvider}
      onMakeOfferByProvider={onMakeOfferByProvider}
      onMakeOfferByCustomer={onMakeOfferByCustomer}
      isOfferAccepted={isOfferAccepted}
      proposedPriceAmount={proposedPriceAmount}
      onAcceptOfferByCustomer={onAcceptOfferByCustomer}
      onDeclineOfferByCustomer={onDeclineOfferByCustomer}
    />
  ) : (
    loadingOrFailedFetching
  );

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  return (
    <Page
      title={intl.formatMessage({ id: 'TransactionPage.title' }, { title: listingTitle })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.root}>{panel}</div>
          <Modal
            id="ListingPage.makeOffer"
            contentClassName={css.enquiryModalContent}
            isOpen={state.makeOfferModalOpen}
            onClose={() => setState(prevState => ({ ...prevState, makeOfferModalOpen: false, errorMessage: "" }))}
            usePortal
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <MakeOfferForm
              className={css.enquiryForm}
              submitButtonWrapperClassName={css.enquirySubmitButtonWrapper}
              listingTitle={currentListing.attributes?.title}
              formId="MakeOfferForm"
              listingPrice={currentListing.attributes?.price || 0}
              authorDisplayName={currentListing.author?.attributues?.profile?.displayName}
              sendEnquiryError={null}
              onSubmit={onSubmitOffer}
              customErrorText={state.errorMessage}
              inProgress={false}
              onChange={() => { console.log("changing") }}
            />
          </Modal>
          <ReviewModal
            id="ReviewOrderModal"
            isOpen={state.isReviewModalOpen}
            onCloseModal={() => setState(prevState => ({ ...prevState, isReviewModalOpen: false }))}
            onManageDisableScrolling={onManageDisableScrolling}
            onSubmitReview={onSubmitReview}
            revieweeName={otherUserDisplayName}
            reviewSent={state.reviewSubmitted}
            sendReviewInProgress={sendReviewInProgress}
            sendReviewError={sendReviewError}
          />
          <DisputeModal
            id="DisputeOrderModal"
            isOpen={state.isDisputeModalOpen}
            onCloseModal={() =>
              setState(prevState => ({ ...prevState, isDisputeModalOpen: false }))
            }
            onManageDisableScrolling={onManageDisableScrolling}
            onDisputeOrder={onDisputeOrder}
            disputeSubmitted={state.disputeSubmitted}
            disputeInProgress={disputeInProgress}
            disputeError={disputeError}
          />
        </LayoutWrapperMain>
        <LayoutWrapperFooter className={css.footer}>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

TransactionPageComponent.defaultProps = {
  currentUser: null,
  fetchTransactionError: null,
  disputeError: null,
  markDeliveredError: null,
  markReceivedError: null,
  markReceivedFromPurchasedError: null,
  transaction: null,
  fetchMessagesError: null,
  initialMessageFailedToTransaction: null,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

TransactionPageComponent.propTypes = {
  params: shape({ id: string }).isRequired,
  transactionRole: oneOf([PROVIDER, CUSTOMER]).isRequired,
  currentUser: propTypes.currentUser,
  fetchTransactionError: propTypes.error,
  markReceivedInProgress: bool.isRequired,
  markReceivedError: propTypes.error,
  onMarkReceived: func.isRequired,
  markReceivedFromPurchasedInProgress: bool.isRequired,
  markReceivedFromPurchasedError: propTypes.error,
  onMarkReceivedFromPurchased: func.isRequired,
  markDeliveredInProgress: bool.isRequired,
  markDeliveredError: propTypes.error,
  onMarkDelivered: func.isRequired,
  disputeInProgress: bool.isRequired,
  disputeError: propTypes.error,
  onDispute: func.isRequired,
  scrollingDisabled: bool.isRequired,
  transaction: propTypes.transaction,
  fetchMessagesError: propTypes.error,
  totalMessagePages: number.isRequired,
  oldestMessagePageFetched: number.isRequired,
  messages: arrayOf(propTypes.message).isRequired,
  initialMessageFailedToTransaction: propTypes.uuid,
  savePaymentMethodFailed: bool,
  sendMessageInProgress: bool.isRequired,
  sendMessageError: propTypes.error,
  onShowMoreMessages: func.isRequired,
  onSendMessage: func.isRequired,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  callSetInitialValues: func.isRequired,
  onInitializeCardPaymentData: func.isRequired,
  onFetchTransactionLineItems: func.isRequired,

  // line items
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    fetchTransactionError,
    disputeInProgress,
    disputeError,
    markReceivedInProgress,
    markReceivedError,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    markDeliveredInProgress,
    markDeliveredError,
    transactionRef,
    fetchMessagesInProgress,
    fetchMessagesError,
    totalMessagePages,
    oldestMessagePageFetched,
    messages,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    sendMessageInProgress,
    sendMessageError,
    sendReviewInProgress,
    sendReviewError,
    timeSlots,
    fetchTimeSlotsError,
    processTransitions,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  } = state.TransactionPage;
  const { currentUser } = state.user;

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const transactions = getMarketplaceEntities(state, transactionRef ? [transactionRef] : []);
  const transaction = transactions.length > 0 ? transactions[0] : null;

  return {
    currentUser,
    getListing,
    getOwnListing,
    fetchTransactionError,
    disputeInProgress,
    disputeError,
    markReceivedInProgress,
    markReceivedError,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    markDeliveredInProgress,
    markDeliveredError,
    scrollingDisabled: isScrollingDisabled(state),
    transaction,
    fetchMessagesInProgress,
    fetchMessagesError,
    totalMessagePages,
    oldestMessagePageFetched,
    messages,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    sendMessageInProgress,
    sendMessageError,
    sendReviewInProgress,
    sendReviewError,
    timeSlots,
    fetchTimeSlotsError,
    processTransitions,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onDispute: (transactionId, disputeReason) => dispatch(dispute(transactionId, disputeReason)),
    onMarkReceived: transactionId => dispatch(markReceived(transactionId)),
    onMarkReceivedFromPurchased: transactionId =>
      dispatch(markReceivedFromPurchased(transactionId)),
    onMarkDelivered: transactionId => dispatch(markDelivered(transactionId)),
    onShowMoreMessages: txId => dispatch(fetchMoreMessages(txId)),
    onSendMessage: (txId, message) => dispatch(sendMessage(txId, message)),
    onManageDisableScrolling: (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    onSendReview: (role, tx, reviewRating, reviewContent) =>
      dispatch(sendReview(role, tx, reviewRating, reviewContent)),
    callSetInitialValues: (setInitialValues, values) => dispatch(setInitialValues(values)),
    onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
    onFetchTransactionLineItems: (orderData, listingId, isOwnListing) =>
      dispatch(fetchTransactionLineItems(orderData, listingId, isOwnListing)),
    onAcceptOfferByProvider: tx => dispatch(acceptOfferByProvider(tx)),
    onDeclineOfferByProvider: tx => dispatch(declineOfferByProvider(tx)),
    onMakeOfferByProvider: (role, tx, newOfferValue) => dispatch(makeOfferByProvider(role, tx, newOfferValue)),
    onAcceptOfferByCustomer: tx => dispatch(acceptOfferByCustomer(tx)),
    onDeclineOfferByCustomer: tx => dispatch(declineOfferByCustomer(tx)),
    onMakeOfferByCustomer: (role, tx, newOfferValue) => dispatch(makeOfferByCustomer(role, tx, newOfferValue)),
    onSendOffer: (listingId, protectedDataInfo) =>
      dispatch(sendOffer(listingId, protectedDataInfo)),
  };
};

const TransactionPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(TransactionPageComponent);

export default TransactionPage;
