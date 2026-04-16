import React, { useState } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { arrayOf, array, bool, func, node, oneOfType, shape, string } from 'prop-types';
import classNames from 'classnames';
import omit from 'lodash/omit';
import affirmLogo from './ProductOrderForm/icons/affirm.png';

import config from '../../config';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import {
  propTypes,
  LISTING_STATE_CLOSED,
  LINE_ITEM_NIGHT,
  LINE_ITEM_DAY,
  LINE_ITEM_UNITS,
} from '../../util/types';
import { formatMoney } from '../../util/currency';
import { parse, stringify } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import { ModalInMobile, Button, AvatarSmall, PrimaryButton } from '../../components';
import './rating.css';
import BookingDatesForm from './BookingDatesForm/BookingDatesForm';
import ProductOrderForm from './ProductOrderForm/ProductOrderForm';
import css from './OrderPanel.module.css';
import { Rating } from '@mui/material';
import { richText } from '../../util/richText';

// This defines when ModalInMobile shows content as Modal
const MODAL_BREAKPOINT = 1023;

const priceData = (price, intl) => {
  if (price && price.currency === config.currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

const openOrderModal = (isOwnListing, isClosed, history, location) => {
  if (isOwnListing || isClosed) {
    window.scrollTo(0, 0);
  } else {
    const { pathname, search, state } = location;
    const searchString = `?${stringify({ ...parse(search), orderOpen: true })}`;
    history.push(`${pathname}${searchString}`, state);
  }
};

const closeOrderModal = (history, location) => {
  const { pathname, search, state } = location;
  const searchParams = omit(parse(search), 'orderOpen');
  const searchString = `?${stringify(searchParams)}`;
  history.push(`${pathname}${searchString}`, state);
};

const OrderPanel = props => {
  const {
    rootClassName,
    className,
    titleClassName,
    listing,
    isOwnListing,
    unitType,
    onSubmit,
    title,
    author,
    onManageDisableScrolling,
    timeSlots,
    fetchTimeSlotsError,
    history,
    location,
    intl,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    currentUser,
    deliveryMoreInfoModalOpen,
    setDeliveryMoreInfoModalOpen,
    setAffirmMoreInfoModalOpen,
    isProductAlreadyInCart,
    onUpdateCurrentUser,
    proposedPriceAmount,
    currentTransaction,
    type,
    isListingPage,
  } = props;
  const [isAddToCart, setIsAddToCart] = useState(false);

  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isDaily = unitType === LINE_ITEM_DAY;
  const isUnits = unitType === LINE_ITEM_UNITS;
  const shouldHaveBooking = isNightly || isDaily;

  const price = listing.attributes.price;
  const hasListingState = !!listing.attributes.state;
  const isClosed = hasListingState && listing.attributes.state === LISTING_STATE_CLOSED;
  const showBookingDatesForm = shouldHaveBooking && hasListingState && !isClosed;
  const showClosedListingHelpText = listing.id && isClosed;
  const { formattedPrice, priceTitle } = priceData(price, intl);
  const isOrderOpen = !!parse(location.search).orderOpen;
  const { toggleMakeOffer } = listing?.attributes?.metadata || {};
  const { isAllowOffer } = listing?.attributes?.publicData;

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const currentStock = listing.currentStock?.attributes?.quantity;

  const isSold =
    listing?.currentStock?.attributes?.quantity === 0 || listing?.attributes?.publicData?.sold;

  const isOutOfStock = (config.listingManagementType === 'stock' && currentStock === 0) || isSold;

  // Show form only when stock is fully loaded. This avoids "Out of stock" UI by
  // default before all data has been downloaded.
  const showProductOrderForm =
    config.listingManagementType === 'stock' && typeof currentStock === 'number';

  const { pickupEnabled, shippingEnabled } = listing?.attributes?.publicData || {};

  const subTitleText = showClosedListingHelpText
    ? intl.formatMessage({ id: 'OrderPanel.subTitleClosedListing' })
    : null;

  const unitTranslationKey = isNightly
    ? 'OrderPanel.perNight'
    : isDaily
      ? 'OrderPanel.perDay'
      : 'OrderPanel.perUnit';

  const authorDisplayName = userDisplayNameAsString(author, '');

  const classes = classNames(rootClassName || css.root, className);
  const titleClasses = classNames(titleClassName || css.orderTitle);

  const publicData = listing?.attributes?.publicData;
  const category = intl.formatMessage({ id: 'Filters.category.' + (publicData?.category || 'rings') });
  const description = listing?.attributes?.description;

  const Info = () => {
    return (
      <div className={css.property}>
        <p className={css.category}>{category}</p>
        <h2 className={titleClasses}>{title}</h2>
        {type !== 'transaction' && (
          <p className={type === 'transaction' && css.description}>
            {richText(description, {
              longWordMinLength: 20,
              longWordClass: css.longWord,
            })}
          </p>
        )}
        <div className={css.priceWrapper}>
          <p className={css.priceLabel}>Price</p>
          <p className={css.priceAmount}>{formatMoney(intl, price)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={classes}>
      {showBookingDatesForm ? (
        <BookingDatesForm
          className={css.bookingForm}
          formId="OrderPanelBookingDatesForm"
          submitButtonWrapperClassName={css.bookingDatesSubmitButtonWrapper}
          unitType={unitType}
          onSubmit={onSubmit}
          price={price}
          listingId={listing.id}
          isOwnListing={isOwnListing}
          timeSlots={timeSlots}
          fetchTimeSlotsError={fetchTimeSlotsError}
          onFetchTransactionLineItems={onFetchTransactionLineItems}
          lineItems={lineItems}
          fetchLineItemsInProgress={fetchLineItemsInProgress}
          fetchLineItemsError={fetchLineItemsError}
        />
      ) : showProductOrderForm ? (
        <ProductOrderForm
          formId="OrderPanelProductOrderForm"
          onSubmit={onSubmit}
          price={price}
          currentStock={currentStock}
          pickupEnabled={pickupEnabled}
          shippingEnabled={shippingEnabled}
          listingId={listing.id}
          isOwnListing={isOwnListing}
          onFetchTransactionLineItems={onFetchTransactionLineItems}
          onContactUser={onContactUser}
          lineItems={lineItems}
          fetchLineItemsInProgress={fetchLineItemsInProgress}
          fetchLineItemsError={fetchLineItemsError}
          listing={listing}
          currentUser={currentUser}
          openMakeOfferModal={props.openMakeOfferModal}
          isOfferAccepted={props.isOfferAccepted}
          proposedPriceAmount={props.proposedPriceAmount}
          history={history}
          deliveryMoreInfoModalOpen={deliveryMoreInfoModalOpen}
          setDeliveryMoreInfoModalOpen={setDeliveryMoreInfoModalOpen}
          setAffirmMoreInfoModalOpen={setAffirmMoreInfoModalOpen}
          isProductAlreadyInCart={isProductAlreadyInCart}
          onUpdateCurrentUser={onUpdateCurrentUser}
          isAddToCart={isAddToCart}
          currentTransaction={currentTransaction}
          Info={Info}
          isListingPage={isListingPage}
        />
      ) : null}
      {/* </ModalInMobile> */}
      {!props.isOfferAccepted &&
        <div className={css.openOrderForm}>
          <div className={css.priceContainer}>
            <div className={css.priceValue} title={priceTitle}>
              {formattedPrice}
            </div>
            <div className={css.perUnit}>
              <img src={affirmLogo} alt="affirm" className={css.affirmLogo} />
              {/* <br/>
            Pay over time. */}
            </div>
          </div>

          {isClosed ? (
            <div className={css.closedListingButton}>
              <FormattedMessage id="OrderPanel.closedListingButtonText" />
            </div>
          ) : (
            <PrimaryButton
              className={css.addToCartButton}
              onClick={() => {
                openOrderModal(isOwnListing, isClosed, history, location);
                setIsAddToCart(true);
              }}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? (
                <FormattedMessage id="OrderPanel.ctaButtonMessageNoStock" />
              ) : (
                <FormattedMessage id="BookingDatesForm.addToCart" />
              )}
            </PrimaryButton>
          )}

          {isOutOfStock || isClosed || isSold || toggleMakeOffer === 'off' || isAllowOffer ? null : (
            <PrimaryButton
              className={css.mobileOfferButton}
              type="button"
              onClick={props.openMakeOfferModal}
              disabled={isProductAlreadyInCart}
            >
              <FormattedMessage id="ProductOrderForm.makeAnOffer" />
            </PrimaryButton>
          )}
        </div>
      }
    </div>
  );
};

OrderPanel.defaultProps = {
  rootClassName: null,
  className: null,
  titleClassName: null,
  isOwnListing: false,
  subTitle: null,
  unitType: config.lineItemUnitType,
  timeSlots: null,
  fetchTimeSlotsError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

OrderPanel.propTypes = {
  rootClassName: string,
  className: string,
  titleClassName: string,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]),
  isOwnListing: bool,
  unitType: propTypes.lineItemUnitType,
  onSubmit: func.isRequired,
  title: oneOfType([node, string]).isRequired,
  subTitle: oneOfType([node, string]),
  onManageDisableScrolling: func.isRequired,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  onFetchTransactionLineItems: func.isRequired,
  onContactUser: func,
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

export default compose(
  withRouter,
  injectIntl
)(OrderPanel);
