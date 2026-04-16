import React, { Component } from 'react';
import { array, arrayOf, bool, func, number, shape, string } from 'prop-types';
import classNames from 'classnames';
import memoize from 'lodash.memoize';
import { Timeline, TimelineItem } from 'rsuite';

import config from '../../../config';
import {
  TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY,
  txHasBeenReceived,
  txIsCanceled,
  txIsDelivered,
  txIsDisputed,
  txIsEnquired,
  txIsPaymentExpired,
  txIsPaymentPending,
  txIsPurchased,
  txIsReceived,
  txIsCompleted,
  txIsInFirstReviewBy,
  txIsOfferPending,
  txIsOfferAccepted,
  txIsOfferAcceptedByCustomer,
} from '../../../util/transaction';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes } from '../../../util/types';
import {
  ensureListing,
  ensureTransaction,
  ensureUser,
  userDisplayNameAsString,
} from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { formatMoney } from '../../../util/currency';
import { AvatarLarge, OrderPanel, NamedLink, UserDisplayName, PrimaryButton, Modal, SecondaryButton } from '../../../components';

import SendMessageForm from '../SendMessageForm/SendMessageForm';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
import FeedSection from './FeedSection';
import ActionButtonsMaybe from './ActionButtonsMaybe';
import DiminishedActionButtonMaybe from './DiminishedActionButtonMaybe';
import PanelHeading, {
  HEADING_ENQUIRED,
  HEADING_PAYMENT_PENDING,
  HEADING_PAYMENT_EXPIRED,
  HEADING_CANCELED,
  HEADING_PURCHASED,
  HEADING_DELIVERED,
  HEADING_DISPUTED,
  HEADING_RECEIVED,
  HEADING_OFFER_PENDING,
  HEADING_OFFER_ACCEPTED,
  HEADING_OFFER_PENDING_FROM_PROVIDER,
} from './PanelHeading';
import css from './TransactionPanel.module.css';
import 'rsuite/dist/rsuite.min.css';
import PendingOfferMessage from './PendingOfferMessage';
import PendingOfferActionButtons from './PendingOfferActionButtons';
import PreviewFile from '../../../components/PreviewFile/PreviewFile';
import dummyShippingLabel from '../../../assets/utils/dummyShippingLabel.jpg';
import ShareASalePixel from '../../../components/ShareASalePixel/ShareASalePixel';
import { createSlug } from '../../../util/urlHelpers';

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

// Helper function to get display names for different roles
const displayNames = (currentUser, currentProvider, currentCustomer, intl) => {
  const authorDisplayName = <UserDisplayName user={currentProvider} intl={intl} />;
  const customerDisplayName = <UserDisplayName user={currentCustomer} intl={intl} />;

  let otherUserDisplayName = '';
  let otherUserDisplayNameString = '';
  const currentUserIsCustomer =
    currentUser.id && currentCustomer.id && currentUser.id.uuid === currentCustomer.id.uuid;
  const currentUserIsProvider =
    currentUser.id && currentProvider.id && currentUser.id.uuid === currentProvider.id.uuid;

  if (currentUserIsCustomer) {
    otherUserDisplayName = authorDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(currentProvider, '');
  } else if (currentUserIsProvider) {
    otherUserDisplayName = customerDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(currentCustomer, '');
  }

  return {
    authorDisplayName,
    customerDisplayName,
    otherUserDisplayName,
    otherUserDisplayNameString,
  };
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toDateString();
};

// format money to show in the timeline, like $50 for 5000
const formatMoneyTimeline = (intl, money) => {
  return formatMoney(intl, money, { style: 'currency', currency: 'USD' }).replace('$', '');
};

const formatMoneyTimeline1 = (money) => {
  return `$${money / 100}`;
};

const TimeLineComponent = ({ offersHistory, initialAmount, isCustomer, isProvider }) => {
  if (!offersHistory) {
    return null;
  }

  return (
    <Timeline>
      <Timeline.Item>Initial list price: ${initialAmount}</Timeline.Item>
      {offersHistory.map((offer) => {
        return (
          <Timeline.Item key={offer.date}>
            {formatDate(offer.date)} Offer: {formatMoneyTimeline1(offer.offer)} By: {offer.role === 'provider' ? 'seller' : offer.role === 'customer' ? 'buyer' : offer.role}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};


export class TransactionPanelComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sendMessageFormFocused: false,
      counterOfferModalOpen: false,
      makeOfferModalOpen: false,
      newOfferValue: 0,
      offerValue: 0,
      originalListingPrice: 0,
      getShippingLabelLoading: false,
      deliveryMoreInfoModalOpen: false,
      affirmMoreInfoModalOpen: false,
    };
    this.isMobSaf = false;
    this.sendMessageFormName = 'TransactionPanel.SendMessageForm';

    this.onSendMessageFormFocus = this.onSendMessageFormFocus.bind(this);
    this.onSendMessageFormBlur = this.onSendMessageFormBlur.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.scrollToMessage = this.scrollToMessage.bind(this);
    //this.onMakeOfferByProvider = this.onMakeOfferByProvider.bind(this);
  }

  componentDidMount() {
    this.isMobSaf = isMobileSafari();
    const currentTransaction = ensureTransaction(this.props.transaction);
    const currentListing = ensureListing(currentTransaction.listing);

    sdk.listings.show({ id: currentListing.id }).then(res => {
      const price = res.data.data.attributes.price.amount;
      this.setState({
        originalListingPrice: price,
      });
    });
  }

  onSendMessageFormFocus() {
    this.setState({ sendMessageFormFocused: true });
    if (this.isMobSaf) {
      // Scroll to bottom
      window.scroll({ top: document.body.scrollHeight, left: 0, behavior: 'smooth' });
    }
  }

  onSendMessageFormBlur() {
    this.setState({ sendMessageFormFocused: false });
  }

  onMessageSubmit(values, form) {
    const message = values.message ? values.message.trim() : null;
    const { transaction, onSendMessage } = this.props;
    const ensuredTransaction = ensureTransaction(transaction);

    if (!message) {
      return;
    }
    onSendMessage(ensuredTransaction.id, message)
      .then(messageId => {
        form.reset();
        this.scrollToMessage(messageId);
      })
      .catch(e => {
        // Ignore, Redux handles the error
      });
  }

  onCounterMessageSubmit(values, form) {
    const message = values.message ? values.message.trim() : null;
    const { transaction, onSendMessage } = this.props;
    const ensuredTransaction = ensureTransaction(transaction);

    if (!message) {
      return;
    }

    onSendMessage(ensuredTransaction.id, message)
      .then(messageId => {
        // form.reset();
        // this.scrollToMessage(messageId);
      })
      .catch(e => {
        // Ignore, Redux handles the error
      });
  }

  scrollToMessage(messageId) {
    const selector = `#msg-${messageId.uuid}`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }

  onCustomerSubmitOffer(values) {
    const { history, params, onSendOffer } = this.props;
    const routes = routeConfiguration();
    const listingId = new UUID(params.id);
    const { message, proposedPrice } = values;
    const proposedPriceAmount = proposedPrice?.amount;
    const protectedDataInfo = { proposedPriceAmount };

    onSendOffer(listingId, message, protectedDataInfo)
      .then(txId => {
        this.setState({ makeOfferModalOpen: false });

        // Redirect to OrderDetailsPage
        history.push(
          createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {})
        );
      })
      .catch(() => {
        // Ignore, error handling in duck file
      });
  }

  render() {
    const {
      rootClassName,
      className,
      currentUser,
      transaction,
      totalMessagePages,
      oldestMessagePageFetched,
      messages,
      initialMessageFailed,
      savePaymentMethodFailed,
      fetchMessagesInProgress,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onManageDisableScrolling,
      onOpenDisputeModal,
      onOpenReviewModal,
      onShowMoreMessages,
      transactionRole,
      intl,
      markReceivedProps,
      markReceivedFromPurchasedProps,
      markDeliveredProps,
      leaveReviewProps,
      onSubmitOrderRequest,
      timeSlots,
      fetchTimeSlotsError,
      nextTransitions,
      onFetchTransactionLineItems,
      lineItems,
      fetchLineItemsInProgress,
      fetchLineItemsError,
      onAcceptOfferByProvider,
      onDeclineOfferByProvider,
      onMakeOfferByProvider,
      isOfferAccepted,
      proposedPriceAmount,
      onAcceptOfferByCustomer,
      onMakeOfferByCustomer,
    } = this.props;

    const currentTransaction = ensureTransaction(transaction);
    const currentListing = ensureListing(currentTransaction.listing);

    // sdk.listings.show({ id: currentListing.id }).then(res => {
    //   const price = res.data.data.attributes.price.amount;
    //   this.setState({
    //     originalListingPrice: price,
    //   });
    // });

    const currentProvider = ensureUser(currentTransaction.provider);
    const currentCustomer = ensureUser(currentTransaction.customer);
    const isCustomer = transactionRole === 'customer';
    const isProvider = transactionRole === 'provider';

    const listingLoaded = !!currentListing.id;
    const listingDeleted = listingLoaded && currentListing.attributes.deleted;
    const iscustomerLoaded = !!currentCustomer.id;
    const isCustomerBanned = iscustomerLoaded && currentCustomer.attributes.banned;
    const isCustomerDeleted = iscustomerLoaded && currentCustomer.attributes.deleted;
    const isProviderLoaded = !!currentProvider.id;
    const isProviderBanned = isProviderLoaded && currentProvider.attributes.banned;
    const isProviderDeleted = isProviderLoaded && currentProvider.attributes.deleted;

    const handleCounterOffer = () => {
      // const role = isCustomer ? 'customer' : 'provider';
      // return onCounterOffer(role, currentTransaction)
      this.setState({
        counterOfferModalOpen: true,
        offerValue: proposedPriceAmount / 100,
        headingState: HEADING_OFFER_PENDING,
      });
    };

    const handleAcceptOffer = () => {
      onAcceptOfferByProvider(currentTransaction);
      // state?
    };

    const handleMakeOfferByCustomer = () => {
      // const role = isCustomer ? 'customer' : 'provider';
      // return onCounterOffer(role, currentTransaction)
      this.setState({
        makeOfferModalOpen: true,
        offerValue: proposedPriceAmount / 100,
        headingState: HEADING_OFFER_PENDING_FROM_PROVIDER
      });
    };
    const stateDataFn = memoize(tx => {
      if (txIsEnquired(tx)) {
        const transitions = Array.isArray(nextTransitions)
          ? nextTransitions.map(transition => transition.attributes.name)
          : [];
        const hasCorrectNextTransition =
          transitions.length > 0 && transitions.includes(TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY);
        return {
          headingState: HEADING_ENQUIRED,
          showOrderPanel: isCustomer && !isProviderBanned && hasCorrectNextTransition,
        };
      }
      else if (txIsOfferPending(tx)) {

        if (tx.attributes.lastTransition === 'transition/offer-made-by-provider') {

          if (isCustomer) {
            return {
              headingState: HEADING_OFFER_PENDING_FROM_PROVIDER,
              showPendingOfferPanelActionButtons: false,
              showPendingOfferFromProviderPanelActionButtons: true,
              showPendingOfferMessage: true,
              showCounteredOfferPanelActionButtons: false,
              // show the ones for customer
              showCustomerButtons: true,
              showProviderButtons: false,
            };
          }
          else {
            return {
              headingState: HEADING_OFFER_PENDING_FROM_PROVIDER, // but provider perspective
              showPendingOfferPanelActionButtons: false,
              showPendingOfferFromProviderPanelActionButtons: false,
              showPendingOfferMessage: true,
              showCounteredOfferPanelActionButtons: false,
              // show the ones for customer
              showCustomerButtons: true,
              showProviderButtons: false,
            };
          }


        } else {
          if (tx.attributes.lastTransition !== 'transition/offer-made-by-provider') {
            // customer just made an offer
            if (isCustomer) {
              return {
                headingState: HEADING_OFFER_PENDING,
                showPendingOfferPanelActionButtons: true,
                showPendingOfferFromProviderPanelActionButtons: false,
                showPendingOfferMessage: true,
                showCounteredOfferPanelActionButtons: false,

                // show the ones for provider
                showCustomerButtons: false,
                showProviderButtons: false,
              };
            }
            else {
              //transition/counter-offer-made-by-customer
              // provider just countered the offer
              return {
                headingState: HEADING_OFFER_PENDING,
                showPendingOfferPanelActionButtons: true,
                showPendingOfferFromProviderPanelActionButtons: false,
                showPendingOfferMessage: true,
                showCounteredOfferPanelActionButtons: true,

                // show the ones for provider
                showCustomerButtons: false,
                showProviderButtons: true,
              };
            }

          }
          else {
            // provider just made an offer
            return {
              headingState: HEADING_OFFER_PENDING,
              showPendingOfferPanelActionButtons: true,
              showPendingOfferFromProviderPanelActionButtons: false,
              showPendingOfferMessage: true,
              showCounteredOfferPanelActionButtons: true,

              // show the ones for provider
              showCustomerButtons: false,
              showProviderButtons: true,
            };
          }

        }
      } else if (txIsOfferAccepted(tx) || txIsOfferAcceptedByCustomer(tx)) {
        return {
          headingState: HEADING_OFFER_ACCEPTED,
          showOrderPanel: isCustomer && !isProviderBanned,
        };
      } else if (txIsPaymentPending(tx)) {
        return {
          headingState: HEADING_PAYMENT_PENDING,
          showDetailCardHeadings: isCustomer,
        };
      } else if (txIsPaymentExpired(tx)) {
        return {
          headingState: HEADING_PAYMENT_EXPIRED,
          showDetailCardHeadings: isCustomer,
        };
      } else if (txIsPurchased(tx)) {
        return {
          headingState: HEADING_PURCHASED,
          showDetailCardHeadings: isCustomer,
          showActionButtons: true,
          showDownloadShippingLabel: isProvider,
          primaryButtonProps: isCustomer ? null : markDeliveredProps,
        };
      } else if (txIsCanceled(tx)) {
        return {
          headingState: HEADING_CANCELED,
          showDetailCardHeadings: isCustomer,
        };
      } else if (txIsDelivered(tx)) {
        const primaryButtonPropsMaybe = isCustomer ? { primaryButtonProps: markReceivedProps } : {};
        return {
          headingState: HEADING_DELIVERED,
          showDetailCardHeadings: isCustomer,
          showActionButtons: isCustomer,
          ...primaryButtonPropsMaybe,
          showDispute: isCustomer,
        };
      } else if (txIsDisputed(tx)) {
        return {
          headingState: HEADING_DISPUTED,
          showDetailCardHeadings: isCustomer,
        };
      } else if (txIsReceived(tx) || txIsCompleted(tx) || txIsInFirstReviewBy(tx, !isCustomer)) {
        return {
          headingState: HEADING_RECEIVED,
          showDetailCardHeadings: isCustomer,
          showActionButtons: true,
          primaryButtonProps: leaveReviewProps,
        };
      } else if (txHasBeenReceived(tx)) {
        return {
          headingState: HEADING_RECEIVED,
          showDetailCardHeadings: isCustomer,
        };
      } else {
        return { headingState: 'unknown' };
      }
    });

    const stateData = stateDataFn(currentTransaction);

    const deletedListingTitle = intl.formatMessage({
      id: 'TransactionPanel.deletedListingTitle',
    });

    const { authorDisplayName, customerDisplayName, otherUserDisplayNameString } = displayNames(
      currentUser,
      currentProvider,
      currentCustomer,
      intl
    );

    const { publicData, geolocation } = currentListing.attributes;
    const location = publicData && publicData.location ? publicData.location : {};
    const listingTitle = currentListing.attributes.deleted
      ? deletedListingTitle
      : currentListing.attributes.title;

    const unitType = config.lineItemUnitType;
    const isNightly = unitType === LINE_ITEM_NIGHT;
    const isDaily = unitType === LINE_ITEM_DAY;

    const unitTranslationKey = isNightly
      ? 'TransactionPanel.perNight'
      : isDaily
        ? 'TransactionPanel.perDay'
        : 'TransactionPanel.perUnit';

    const price = currentListing.attributes.price;
    const bookingSubTitle = price
      ? `${formatMoney(intl, price)} ${intl.formatMessage({ id: unitTranslationKey })}`
      : '';
    const imagesOrder = currentListing?.attributes?.publicData?.imagesOrder;
    const firstChosenImageId =
      Array.isArray(imagesOrder) && imagesOrder?.length > 0 && imagesOrder[0]?.id;

    const firstImageBasic =
      currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

    const firstImage = firstChosenImageId
      ? currentListing.images && currentListing.images.length > 0
        ? currentListing.images.find(img => img?.id?.uuid === firstChosenImageId) || firstImageBasic
        : firstImageBasic
      : firstImageBasic;
    // const firstImage =
    //   currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

    const actionButtons = (
      <ActionButtonsMaybe
        showButtons={stateData.showActionButtons}
        primaryButtonProps={stateData?.primaryButtonProps}
        secondaryButtonProps={stateData?.secondaryButtonProps}
      />
    );

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

    const sendMessagePlaceholder = intl.formatMessage(
      { id: 'TransactionPanel.sendMessagePlaceholder' },
      { name: otherUserDisplayNameString }
    );

    const sendingMessageNotAllowed = intl.formatMessage({
      id: 'TransactionPanel.sendingMessageNotAllowed',
    });

    const paymentMethodsPageLink = (
      <NamedLink name="PaymentMethodsPage">
        <FormattedMessage id="TransactionPanel.paymentMethodsPageLink" />
      </NamedLink>
    );

    const classes = classNames(rootClassName || css.root, className);

    const restOfShoppingCartItems = currentTransaction?.attributes.metadata.restOfShoppingCartItems &&
      currentTransaction?.attributes.metadata.restOfShoppingCartItems.length > 0
      ? currentTransaction?.attributes.metadata.restOfShoppingCartItems.map(item => {
        return JSON.parse(item);
      })
      : false;

    const authenticationFileName =
      currentTransaction?.attributes?.protectedData?.authenticationCertificateName;

    const listingImageUrl =
      currentListing?.images[0] && currentListing?.images[0]?.attributes?.variants?.default?.url;
    const listingSlug = createSlug(currentListing?.attributes?.title || 'test');

    const showMakeOffer = stateData.showPendingOfferPanelActionButtons
      &&
      (transaction.attributes.lastTransition === 'transition/offer-made-by-customer'
        && !isCustomer);
    const formatPrice = value => {
      const num = Number(value);
      if (isNaN(num) || value === '') return '$';
      return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };
    return (
      <div className={classes}>
        <div className={css.container}>
          <div className={css.txInfoWeb}>
            {/* <DetailCardImage
              rootClassName={css.imageWrapperMobile}
              avatarWrapperClassName={css.avatarWrapperMobile}
              listingTitle={listingTitle}
              image={firstImage}
              provider={currentProvider}
              isCustomer={isCustomer}
            /> */}
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={currentCustomer} className={css.avatarDesktop} />
              </div>
            ) : null}
            {stateData.showPendingOfferMessage && (
              <PendingOfferMessage transaction={currentTransaction} intl={intl} />
            )}
            <PanelHeading
              panelHeadingState={stateData.headingState}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              isCustomerBanned={isCustomerBanned}
              listingId={currentListing.id && currentListing.id.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
              proposedPrice={proposedPriceAmount}
              history={history}
            />
            {/* <div className={css.priceContainer}>
              <div className={css.priceWrapper}>
                <p className={css.priceLabel}>Price</p>
                <p className={css.priceAmount}>{formatMoney(intl, price)}</p>
              </div>
            </div> */}
            {/* TODO EMANUEL time line, buy now button, save list or check for current chats */}
            {/* <TimeLineComponent
              offersHistory={currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory}
              isCustomer={isCustomer}
              isProvider={isProvider}
              initialAmount={currentListing?.attributes?.price?.amount / 100}
            />
            {listingImageUrl && stateData.headingState != HEADING_OFFER_PENDING && (
              <NamedLink
                name="ListingPage"
                params={{ id: currentListing?.id?.uuid, slug: listingSlug }}
              >
                <img className={css.listingImage} src={listingImageUrl} />
              </NamedLink>
            )} */}
            <div className={css.orderDetails}>
              <div className={css.orderDetailsMobileSection}>
                <BreakdownMaybe
                  transaction={currentTransaction}
                  transactionRole={transactionRole}
                  restOfShoppingCartItems={restOfShoppingCartItems}
                  listing={currentListing}
                />
                <DiminishedActionButtonMaybe
                  showDispute={stateData.showDispute}
                  onOpenDisputeModal={onOpenDisputeModal}
                />
              </div>
              {savePaymentMethodFailed ? (
                <p className={css.genericError}>
                  <FormattedMessage
                    id="TransactionPanel.savePaymentMethodFailed"
                    values={{ paymentMethodsPageLink }}
                  />
                </p>
              ) : null}
              <DeliveryInfoMaybe
                className={css.deliveryInfoSection}
                transaction={currentTransaction}
                listing={currentListing}
                isCustomer={isCustomer}
              />
            </div>
            <FeedSection
              rootClassName={css.feedContainer}
              currentTransaction={currentTransaction}
              currentUser={currentUser}
              fetchMessagesError={fetchMessagesError}
              fetchMessagesInProgress={fetchMessagesInProgress}
              initialMessageFailed={initialMessageFailed}
              messages={messages}
              oldestMessagePageFetched={oldestMessagePageFetched}
              onOpenReviewModal={onOpenReviewModal}
              onShowMoreMessages={() => onShowMoreMessages(currentTransaction.id)}
              totalMessagePages={totalMessagePages}
            />
            {showSendMessageForm ? (
              <SendMessageForm
                formId={this.sendMessageFormName}
                rootClassName={css.sendMessageForm}
                messagePlaceholder={sendMessagePlaceholder}
                inProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onFocus={this.onSendMessageFormFocus}
                onBlur={this.onSendMessageFormBlur}
                onSubmit={this.onMessageSubmit}
              />
            ) : (
              <div className={css.sendingMessageNotAllowed}>{sendingMessageNotAllowed}</div>
            )}
            {stateData.showActionButtons ? (
              <div className={css.mobileActionButtons}>{actionButtons}</div>
            ) : null}
          </div>
          <div className={css.asideDesktop}>
            <div className={css.stickySection}>
              <div className={css.detailCard}>
                {restOfShoppingCartItems ? null : (
                  <DetailCardImage
                    // avatarWrapperClassName={css.avatarWrapperDesktop}
                    listingTitle={listingTitle}
                    image={firstImage}
                    provider={currentProvider}
                    isCustomer={isCustomer}
                    originalListingPrice={this.state.originalListingPrice / 100}
                    listingId={currentListing.id && currentListing.id.uuid}
                    listingDeleted={listingDeleted}
                  />
                )}
                <center> Original Price : {formatPrice(this.state.originalListingPrice / 100)}</center>
                <div className={css.txInfoMobile}>
                  {stateData.showPendingOfferMessage && (
                    <PendingOfferMessage transaction={currentTransaction} intl={intl} />
                  )}
                </div>
                {restOfShoppingCartItems ? null : (
                  <DetailCardHeadingsMaybe
                    showDetailCardHeadings={stateData.showDetailCardHeadings}
                    listingTitle={listingTitle}
                    subTitle={bookingSubTitle}
                    location={location}
                    geolocation={geolocation}
                    showAddress={stateData.showAddress}
                  />
                )}

                {/* pending listing info modal */}
                <BreakdownMaybe
                  className={css.breakdownContainer}
                  transaction={currentTransaction}
                  transactionRole={transactionRole}
                  restOfShoppingCartItems={restOfShoppingCartItems}
                  listing={currentListing}
                />
                {authenticationFileName && isCustomer && (
                  <div className={css.authFileWrapper}>
                    <p className={css.authFileTitle}>Authentication certificate</p>
                    <PreviewFile fileName={authenticationFileName} />
                  </div>
                )}
                {stateData.showDownloadShippingLabel && (
                  <div className={css.getShippingLabelButtonWrapper}>
                    <PrimaryButton
                      className={css.getShippingLabelButton}
                      onClick={async (e) => {
                        e.preventDefault();
                        const formData = {
                          tracking_number: currentTransaction.attributes.metadata.fromSellerTrackingNumber
                        };
                        this.setState({ getShippingLabelLoading: true });
                        try {
                          const resp = await fetch(
                            `${window.location.origin}/api/ups/request-shipping-label1`,
                            // `http://localhost:3500/api/ups/request-shipping-label1`,
                            {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                              },
                              body: new URLSearchParams(formData).toString()
                            }
                          );
                          if (resp) { this.setState({ getShippingLabelLoading: false }); }

                          const data = await resp.text();
                          const labelData = JSON.parse(data);
                          window.open(labelData.LabelRecoveryResponse.LabelResults.LabelImage.URL, '_blank');
                        } catch (error) {
                          this.setState({ getShippingLabelLoading: false });
                          console.error('Error fetching token:', error);
                        }
                      }}
                      inProgress={this.state.getShippingLabelLoading}
                      disabled={this.state.getShippingLabelLoading}
                    >
                      Get shipping label
                    </PrimaryButton>
                  </div>
                )}
                {stateData.showActionButtons ? (
                  <div className={css.desktopActionButtons}>{actionButtons}</div>
                ) : null}
                {
                  showMakeOffer
                  && (
                    <>
                      <PendingOfferActionButtons
                        onAcceptOfferByProvider={() => onAcceptOfferByProvider(currentTransaction)}
                        onDeclineOfferByProvider={() => onDeclineOfferByProvider(currentTransaction)}
                        onMakeOfferByProvider={() => onMakeOfferByProvider(currentTransaction)}

                        onAcceptOfferByCustomer={() => onAcceptOfferByCustomer(currentTransaction)}
                        onMakeOfferByCustomer={() => onMakeOfferByCustomer(currentTransaction)}

                        showCustomerButtons={false}
                        showProviderButtons={false}

                        intl={intl}
                      />
                      {/* for provider when he made last offer */}
                    </>
                  )
                }
                {
                  stateData.showPendingOfferFromProviderPanelActionButtons && (
                    <>
                      <PendingOfferActionButtons
                        onAcceptOfferByProvider={() => onAcceptOfferByProvider(currentTransaction)}
                        onDeclineOfferByProvider={() => onDeclineOfferByProvider(currentTransaction)}
                        onMakeOfferByProvider={() => onMakeOfferByProvider(currentTransaction)}

                        onAcceptOfferByCustomer={() => onAcceptOfferByCustomer(currentTransaction)}
                        onMakeOfferByCustomer={() => handleMakeOfferByCustomer()}// onMakeOfferByCustomer(currentTransaction)}

                        showCustomerButtons={true}
                        showProviderButtons={false}

                        intl={intl}
                      />
                      {/* For customer when he got a new offer from provider */}
                    </>
                  )
                }
                {
                  stateData.showCounteredOfferPanelActionButtons && (
                    <div className={css.pendingOfferActionButtonsWrapper}>
                      <br />
                      <br />
                      <PrimaryButton
                        type="button"
                        className={css.offerActionButton}
                        onClick={handleAcceptOffer}
                      >
                        Accept offer
                      </PrimaryButton>
                      <br />
                      <br />
                      <SecondaryButton
                        type="button"
                        className={css.offerActionButton}
                        onClick={handleCounterOffer}
                      >
                        Counter offer
                      </SecondaryButton>
                      <br />
                      <br />
                    </div>
                  )
                }
                <PanelHeading
                  panelHeadingState={stateData.headingState}
                  transactionRole={transactionRole}
                  providerName={authorDisplayName}
                  customerName={customerDisplayName}
                  isCustomerBanned={isCustomerBanned}
                  listingId={currentListing.id && currentListing.id.uuid}
                  listingTitle={listingTitle}
                  listingDeleted={listingDeleted}
                  proposedPrice={proposedPriceAmount}
                  history={history}
                  className={css.txInfoMobile}
                />
                {stateData.showOrderPanel ? (
                  <OrderPanel
                    type="transaction"
                    className={css.orderPanel}
                    listing={currentListing}
                    isOwnListing={false}
                    unitType={unitType}
                    onSubmit={onSubmitOrderRequest}
                    title={listingTitle}
                    titleClassName={css.orderTitle}
                    author={currentProvider}
                    onManageDisableScrolling={onManageDisableScrolling}
                    timeSlots={timeSlots}
                    fetchTimeSlotsError={fetchTimeSlotsError}
                    onFetchTransactionLineItems={onFetchTransactionLineItems}
                    lineItems={lineItems}
                    fetchLineItemsInProgress={fetchLineItemsInProgress}
                    fetchLineItemsError={fetchLineItemsError}
                    currentUser={currentUser}
                    isOfferAccepted={isOfferAccepted}
                    proposedPriceAmount={proposedPriceAmount}
                    openMakeOfferModal={this.props.openMakeOfferModal}
                    currentTransaction={currentTransaction}
                    deliveryMoreInfoModalOpen={this.state.deliveryMoreInfoModalOpen}
                    setDeliveryMoreInfoModalOpen={value =>
                      this.setState({ deliveryMoreInfoModalOpen: value })
                    }
                    affirmMoreInfoModalOpen={this.state.affirmMoreInfoModalOpen}
                    setAffirmMoreInfoModalOpen={value =>
                      this.setState({ affirmMoreInfoModalOpen: value })
                    }
                  />
                ) : null}
                {/* Delivery more info modal */}

                <Modal
                  id="deliveryMoreInfoModal"
                  isOpen={this.state.deliveryMoreInfoModalOpen}
                  onClose={() => {
                    this.setState({ deliveryMoreInfoModalOpen: false });
                  }}
                  onManageDisableScrolling={() => { }}
                >
                  <div className={css.deliveryModalText}>
                    <FormattedMessage id="ListingPage.moreInfoModalText" />
                  </div>
                </Modal>

                {/* Affirm more info modal */}

                <Modal
                  id="affirmMoreInfoModal"
                  isOpen={this.state.affirmMoreInfoModalOpen}
                  onClose={() => {
                    this.setState({ affirmMoreInfoModalOpen: false });
                  }}
                  onManageDisableScrolling={() => { }}
                >
                  <div className={css.deliveryModalText}>
                    <FormattedMessage id="ListingPage.affirmMoreInfoModalText" />
                  </div>
                </Modal>
              </div >
              <DiminishedActionButtonMaybe
                showDispute={stateData.showDispute}
                onOpenDisputeModal={onOpenDisputeModal}
              />
            </div >
          </div >
          <div className={css.txInfoMobile}>
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={currentCustomer} className={css.avatarDesktop} />
              </div>
            ) : null}
            <div className={css.orderDetails}>
              <div className={css.orderDetailsMobileSection}>
                <BreakdownMaybe
                  transaction={currentTransaction}
                  transactionRole={transactionRole}
                  restOfShoppingCartItems={restOfShoppingCartItems}
                  listing={currentListing}
                />
                <DiminishedActionButtonMaybe
                  showDispute={stateData.showDispute}
                  onOpenDisputeModal={onOpenDisputeModal}
                />
              </div>
              {savePaymentMethodFailed ? (
                <p className={css.genericError}>
                  <FormattedMessage
                    id="TransactionPanel.savePaymentMethodFailed"
                    values={{ paymentMethodsPageLink }}
                  />
                </p>
              ) : null}
              <DeliveryInfoMaybe
                className={css.deliveryInfoSection}
                transaction={currentTransaction}
                listing={currentListing}
                isCustomer={isCustomer}
              />
            </div>
            <FeedSection
              rootClassName={css.feedContainer}
              currentTransaction={currentTransaction}
              currentUser={currentUser}
              fetchMessagesError={fetchMessagesError}
              fetchMessagesInProgress={fetchMessagesInProgress}
              initialMessageFailed={initialMessageFailed}
              messages={messages}
              oldestMessagePageFetched={oldestMessagePageFetched}
              onOpenReviewModal={onOpenReviewModal}
              onShowMoreMessages={() => onShowMoreMessages(currentTransaction.id)}
              totalMessagePages={totalMessagePages}
            />
            {showSendMessageForm ? (
              <SendMessageForm
                formId={this.sendMessageFormName}
                rootClassName={css.sendMessageForm}
                messagePlaceholder={sendMessagePlaceholder}
                inProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onFocus={this.onSendMessageFormFocus}
                onBlur={this.onSendMessageFormBlur}
                onSubmit={this.onMessageSubmit}
              />
            ) : (
              <div className={css.sendingMessageNotAllowed}>{sendingMessageNotAllowed}</div>
            )}
            {stateData.showActionButtons ? (
              <div className={css.mobileActionButtons}>{actionButtons}</div>
            ) : null}
          </div>
        </div >
        {/* <ShareASalePixel currentTransaction={currentTransaction} /> */}
        {/* Counter offer modal */}
        <Modal
          isOpen={this.state.counterOfferModalOpen}
          onClose={() => {
            this.setState({
              counterOfferModalOpen: false,
            });
          }}
          onManageDisableScrolling={onManageDisableScrolling}
        >
          <div className={css.offerModalWrapper}>
            <center>
              <h2 style={{ fontFamily: 'hernandezbros' }}>Make a counter offer</h2>
            </center>
            <TimeLineComponent
              offersHistory={currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory}
              isCustomer={isCustomer}
              isProvider={isProvider}
              initialAmount={currentListing?.attributes?.price?.amount / 100}
            />
            <br /><br />
            <div className={css.offerModalFieldWrapper}>
              <p style={{ fontFamily: 'hernandezbros' }}>Your counter offer</p>
              <input
                type="text"
                placeholder="50"
                className={css.offerModalField}
                min={1}
                value={this.state.offerValue}
                onChange={e => {
                  return this.setState({
                    newOfferValue: e.target.value,
                    offerValue: e.target.value,
                  });
                }}
              />
              <br /><br />
              <PrimaryButton
                type="button"
                style={{ fontFace: 'Helvetica, Aria, sans-serif' }}
                className={css.submitOfferButton}
                disabled={!this.state.newOfferValue && this.state.newOfferValue < 1}
                onClick={() => {
                  const role = isCustomer ? 'customer' : 'provider';
                  return onMakeOfferByProvider(role, currentTransaction, this.state.newOfferValue)
                    .then(resp => {
                      this.onCounterMessageSubmit({ message: `I propose a counter offer of $${this.state.newOfferValue}` });
                      // const body = {
                      //   destinationUserId: otherUserId,
                      //   newNotification: {
                      //     image: notificationImage,
                      //     message: notificationMessage,
                      //     detailPage: notificationLink,
                      //     seen: false,
                      //   },
                      // };

                      // return post('/api/send-notification', body)
                      //   .then(resp => {
                      this.setState({ counterOfferModalOpen: false, justCountered: true });
                      // })
                      // .catch(e => {
                      //   this.setState({ counterOfferModalOpen: false, justCountered: true });
                      // });
                    })
                    .catch(e => {
                      this.setState({ counterOfferModalOpen: false, justCountered: true });
                    });
                }}
              >
                Submit counter offer
              </PrimaryButton>
            </div>
            <br /><br />
          </div>
        </Modal>
        <Modal
          id="ListingPage.makeOffer"
          contentClassName={css.enquiryModalContent}
          isOpen={this.state.makeOfferModalOpen}
          onClose={() => this.setState({ makeOfferModalOpen: false })}
          usePortal
          onManageDisableScrolling={onManageDisableScrolling}
        >
          <div className={css.offerModalWrapper}>
            <center>
              <h2 style={{ fontFamily: 'hernandezbros' }}>Make an offer</h2>
            </center>
            <TimeLineComponent
              offersHistory={currentTransaction?.attributes?.protectedData?.offersHistory?.offersHistory}
              isCustomer={isCustomer}
              isProvider={isProvider}
              initialAmount={currentListing?.attributes?.price?.amount / 100}
            />
            <div className={css.offerModalFieldWrapper}>
              <p style={{ fontFamily: 'hernandezbros' }}>Your counter offer</p>
              <input
                type="text"
                placeholder="50"
                className={css.offerModalField}
                min={1}
                value={this.state.offerValue}
                onChange={e => {
                  return this.setState({
                    newOfferValue: e.target.value,
                    offerValue: e.target.value,
                  });
                }}
              />
              <PrimaryButton
                type="button"
                className={css.submitOfferButton}
                disabled={!this.state.newOfferValue && this.state.newOfferValue < 1}
                onClick={() => {
                  const role = isCustomer ? 'customer' : 'provider';
                  return onMakeOfferByCustomer(role, currentTransaction, this.state.newOfferValue)
                    .then(resp => {
                      this.onCounterMessageSubmit({ message: `I propose a counter offer of $${this.state.newOfferValue}` });
                      // const body = {
                      //   destinationUserId: otherUserId,
                      //   newNotification: {
                      //     image: notificationImage,
                      //     message: notificationMessage,
                      //     detailPage: notificationLink,
                      //     seen: false,
                      //   },
                      // };

                      // return post('/api/send-notification', body)
                      //   .then(resp => {
                      this.setState({ makeOfferModalOpen: false, justCountered: true });
                      // })
                      // .catch(e => {
                      //   this.setState({ counterOfferModalOpen: false, justCountered: true });
                      // });
                    })
                    .catch(e => {
                      this.setState({ makeOfferModalOpen: false, justCountered: true });
                    });
                }}
              >
                Submit offer
              </PrimaryButton>
            </div>
          </div >
        </Modal >
      </div >
    );
  }
}

TransactionPanelComponent.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  fetchMessagesError: null,
  initialMessageFailed: false,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  sendReviewError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  nextTransitions: null,
  lineItems: null,
  fetchLineItemsError: null,
};

const actionButtonShape = shape({
  inProgress: bool.isRequired,
  error: propTypes.error,
  onTransition: func.isRequired,
  buttonText: string.isRequired,
  errorText: string.isRequired,
});

TransactionPanelComponent.propTypes = {
  rootClassName: string,
  className: string,

  currentUser: propTypes.currentUser,
  transaction: propTypes.transaction.isRequired,
  totalMessagePages: number.isRequired,
  oldestMessagePageFetched: number.isRequired,
  messages: arrayOf(propTypes.message).isRequired,
  initialMessageFailed: bool,
  savePaymentMethodFailed: bool,
  fetchMessagesInProgress: bool.isRequired,
  fetchMessagesError: propTypes.error,
  sendMessageInProgress: bool.isRequired,
  sendMessageError: propTypes.error,
  onManageDisableScrolling: func.isRequired,
  onOpenDisputeModal: func.isRequired,
  onOpenReviewModal: func.isRequired,
  onShowMoreMessages: func.isRequired,
  onSendMessage: func.isRequired,
  onSubmitOrderRequest: func.isRequired,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  nextTransitions: array,

  // Tx process transition related props
  markReceivedProps: actionButtonShape.isRequired,
  markReceivedFromPurchasedProps: actionButtonShape.isRequired,
  markDeliveredProps: actionButtonShape.isRequired,
  leaveReviewProps: actionButtonShape.isRequired,

  // line items
  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape,
};

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
