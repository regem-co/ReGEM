import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { createSlug, stringify } from '../../../util/urlHelpers';

import { NamedLink, PrimaryButton } from '../../../components';

import css from './TransactionPanel.module.css';

export const HEADING_ENQUIRED = 'enquired';
export const HEADING_PAYMENT_PENDING = 'pending-payment';
export const HEADING_PAYMENT_EXPIRED = 'payment-expired';
export const HEADING_CANCELED = 'canceled';
export const HEADING_PURCHASED = 'purchased';
export const HEADING_DELIVERED = 'delivered';
export const HEADING_DISPUTED = 'disputed';
export const HEADING_RECEIVED = 'received';
export const HEADING_OFFER_PENDING = 'offer-pending';
export const HEADING_OFFER_ACCEPTED = 'offer-accepted';
export const HEADING_OFFER_COUNTERED = 'offer-countered';
export const HEADING_OFFER_PENDING_FROM_PROVIDER = 'offer-pending-from-provider';

const createListingLink = (listingId, label, listingDeleted, searchParams = {}, className = '') => {
  if (!listingDeleted) {
    const params = { id: listingId, slug: createSlug(label) };
    const to = { search: stringify(searchParams) };
    return (
      <NamedLink className={className} name="ListingPage" params={params} to={to}>
        {label}
      </NamedLink>
    );
  } else {
    return <FormattedMessage id="TransactionPanel.deletedListingOrderTitle" />;
  }
};

const ListingDeletedInfoMaybe = props => {
  return props.listingDeleted ? (
    <p className={css.transactionInfoMessage}>
      <FormattedMessage id="TransactionPanel.messageDeletedListing" />
    </p>
  ) : null;
};

const HeadingCustomer = props => {
  const { className, id, values, listingDeleted } = props;
  return (
    <React.Fragment>
      <h1 className={className} style={{
        fontSize: '1.8rem',
      }}>
        <span className={css.mainTitle}>
          <FormattedMessage id={id} values={values} />
        </span>
      </h1>
      {/* <div className={css.pendingOfferMessageWrapper}>
        <span className={css.mainTitle}>
          <FormattedMessage id={id} values={values} />
        </span>
      </div> */}
      <ListingDeletedInfoMaybe listingDeleted={listingDeleted} />
    </React.Fragment>
  );
};

const CustomerBannedInfoMaybe = props => {
  return props.isCustomerBanned ? (
    <p className={css.transactionInfoMessage}>
      <FormattedMessage id="TransactionPanel.customerBannedStatus" />
    </p>
  ) : null;
};

const HeadingProvider = props => {
  const { className, id, values, isCustomerBanned, children } = props;
  return (
    <React.Fragment>
      <h1 className={className}>
        <span className={css.mainTitle}>
          <FormattedMessage id={id} values={values} />
        </span>
      </h1>
      {/* <div className={className}>
        <span className={css.mainTitle}>
          <FormattedMessage id={id} values={values} />
        </span>
      </div> */}
      {children}
      <CustomerBannedInfoMaybe isCustomerBanned={isCustomerBanned} />
    </React.Fragment>
  );
};

// Functional component as a helper to choose and show Order or Sale heading info:
// title, subtitle, and message
const PanelHeading = props => {
  const {
    className,
    rootClassName,
    panelHeadingState,
    customerName,
    listingId,
    listingTitle,
    listingDeleted,
    isCustomerBanned,
    proposedPrice,
    history
  } = props;

  const isCustomer = props.transactionRole === 'customer';

  const defaultRootClassName = isCustomer ? css.headingOrder : css.headingSale;
  const titleClasses = classNames(rootClassName || defaultRootClassName, className);
  const listingLink = createListingLink(listingId, listingTitle, listingDeleted);

  const proposedPrice1 = proposedPrice ? "$" + proposedPrice.toString().slice(0, -2) : undefined;// + ".00";

  switch (panelHeadingState) {
    case HEADING_ENQUIRED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderEnquiredTitle"
          values={{ customerName, listingLink }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.saleEnquiredTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );

    // remove last two digits from proposedPrice
    // proposedPrice = proposedPrice.slice(0, -2) + " USD";
    case HEADING_OFFER_PENDING:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.offerPendingTitleForCustomer"
          values={{ customerName, listingLink, proposedPrice: proposedPrice1 }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.offerPendingTitleForProvider"
          values={{ customerName, listingLink, proposedPrice: proposedPrice1 }}
          isCustomerBanned={isCustomerBanned}
        />
      );

    case HEADING_OFFER_COUNTERED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.offerCounteredTitleForCustomer"
          values={{ customerName, listingLink }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.offerCounteredTitleForProvider"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );


    case HEADING_OFFER_ACCEPTED:
      return isCustomer ? (
        <><HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.offerAcceptedTitleForCustomer"
          values={{ customerName, listingLink, proposedPrice: proposedPrice1 }}
          listingDeleted={listingDeleted}
        />

          {/* <PrimaryButton 
          className={css.primaryButton} 
          onClick={()=> { 
            //history.push(
            //</>  createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {})
            //);
           }} 
          >Buy</PrimaryButton>  */}
        </>

      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.offerAcceptedTitleForProvider"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );

    case HEADING_PAYMENT_PENDING:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderPaymentPendingTitle"
          values={{ customerName, listingLink }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.salePaymentPendingTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        >
          <p className={css.transactionInfoMessage}>
            <FormattedMessage
              id="TransactionPanel.salePaymentPendingInfo"
              values={{ customerName }}
            />
          </p>
        </HeadingProvider>
      );
    case HEADING_PAYMENT_EXPIRED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderPaymentExpiredTitle"
          values={{ customerName, listingLink }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.salePaymentExpiredTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );
    case HEADING_PURCHASED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderPurchasedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.salePurchasedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );
    case HEADING_CANCELED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderCanceledTitle"
          values={{ customerName, listingLink }}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.saleCanceledTitle"
          values={{ customerName, listingLink }}
        />
      );
    case HEADING_DELIVERED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderDeliveredTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.saleDeliveredTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );
    case HEADING_RECEIVED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderReceivedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.saleReceivedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );
    case HEADING_DISPUTED:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.orderDisputedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      ) : (
        <HeadingProvider
          className={titleClasses}
          id="TransactionPanel.saleDisputedTitle"
          values={{ customerName, listingLink }}
          isCustomerBanned={isCustomerBanned}
        />
      );
    case HEADING_OFFER_PENDING_FROM_PROVIDER:
      return isCustomer ? (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.offerPendingFromProviderTitle"
          values={{ customerName, listingLink, providerName: props.providerName }}
          listingDeleted={listingDeleted}
        />
      ) : (
        <HeadingCustomer
          className={titleClasses}
          id="TransactionPanel.offerPendingTitleForCustomer"
          values={{ customerName: props.providerName, listingLink, proposedPrice: proposedPrice1 }}
          listingDeleted={listingDeleted}
        />
      );
    default:
      console.warn('Unknown state given to panel heading.');
      return null;
  }
};

export default PanelHeading;
