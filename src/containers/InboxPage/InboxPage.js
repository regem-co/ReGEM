import React, { useEffect, useMemo, useState } from 'react';
import { arrayOf, bool, number, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { useListings } from '../../Context/ListingsContext';
import { useOrderPage } from '../../Context/OrderPageProvider';
import config from '../../config';
import getCleanValue from '../../util/getCleanValue';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import {
  txIsCanceled,
  txIsEnquired,
  txIsPurchased,
  txIsDelivered,
  txIsDisputed,
  txIsPaymentExpired,
  txIsPaymentPending,
  txIsReceived,
  txIsCompleted,
  txIsReviewedByCustomer,
  txIsReviewedByProvider,
  txIsReviewed,
  txIsOfferPending,
  txIsOfferAccepted,
} from '../../util/transaction';
import { propTypes } from '../../util/types';
// import { ensureCurrentUser } from '../../util/data';
import { formatDateIntoPartials } from '../../util/dates';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import {
  NamedLink,
  NotificationBadge,
  Page,
  TabNav,
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperSideNav,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  IconSpinner,
  UserDisplayName,
  UserNav,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import { getOwnListingsById } from '../ManageListingsPage/ManageListingsPage.duck';
import css from './InboxPage.module.css';
import DetailCardImage from '../TransactionPage/TransactionPanel/DetailCardImage';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();
// Translated name of the state of the given transaction
export const txState = (intl, tx, type) => {
  const isOrder = type === 'order';
  if (txIsEnquired(tx)) {
    return {
      lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
      stateClassName: css.stateNoActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.stateEnquiry',
      }),
    };
  } else if (txIsOfferPending(tx)) {
    if (type == 'order') {
      if (tx.attributes.lastTransition === 'transition/offer-made-by-provider') {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      } else if (tx.attributes.lastTransition === 'transition/counter-offer-made-by-customer') {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateNoActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      } else {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateNoActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      }
    } else {
      if (tx.attributes.lastTransition === 'transition/offer-made-by-provider') {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateNoActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      } else if (tx.attributes.lastTransition === 'transition/counter-offer-made-by-customer') {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      } else {
        return {
          lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
          stateClassName: css.stateNoActionNeeded,
          state: intl.formatMessage({
            id: 'InboxPage.stateOfferPending',
          }),
        };
      }
    }
  } else if (txIsOfferAccepted(tx)) {
    if (type == 'order') {
      return {
        lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
        stateClassName: css.stateActionNeeded,
        state: intl.formatMessage({
          id: 'InboxPage.stateOfferAccepted',
        }),
      };
    } else {
      return {
        lastTransitionedAtClassName: css.lastTransitionedAtEmphasized,
        stateClassName: css.stateNoActionNeeded,
        state: intl.formatMessage({
          id: 'InboxPage.stateOfferAccepted',
        }),
      };
    }
  } else if (txIsPaymentPending(tx)) {
    return {
      stateClassName: isOrder ? css.stateActionNeeded : css.stateNoActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.statePendingPayment',
      }),
    };
  } else if (txIsPaymentExpired(tx)) {
    return {
      stateClassName: css.stateNoActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.statePaymentExpired',
      }),
    };
  } else if (txIsCanceled(tx)) {
    return {
      stateClassName: css.stateConcluded,
      state: intl.formatMessage({
        id: 'InboxPage.stateCanceled',
      }),
    };
  } else if (txIsPurchased(tx)) {
    return {
      stateClassName: isOrder ? css.stateNoActionNeeded : css.stateActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.statePurchased',
      }),
    };
  } else if (txIsDelivered(tx)) {
    return isOrder
      ? {
        stateClassName: css.stateActionNeeded,
        state: intl.formatMessage({ id: 'InboxPage.stateDeliveredCustomer' }),
      }
      : {
        stateClassName: css.stateNoActionNeeded,
        state: intl.formatMessage({ id: 'InboxPage.stateDeliveredProvider' }),
      };
  } else if (txIsDisputed(tx)) {
    return {
      stateClassName: css.stateActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.stateDisputed',
      }),
    };
  } else if (txIsReceived(tx) || txIsCompleted(tx)) {
    return {
      stateClassName: css.stateActionNeeded,
      state: intl.formatMessage({
        id: 'InboxPage.stateReceived',
      }),
    };
  } else if (txIsReviewedByCustomer(tx)) {
    const translationKey = isOrder ? 'InboxPage.stateReviewGiven' : 'InboxPage.stateReviewNeeded';
    return {
      stateClassName: isOrder ? css.stateNoActionNeeded : css.stateActionNeeded,
      state: intl.formatMessage({
        id: translationKey,
      }),
    };
  } else if (txIsReviewedByProvider(tx)) {
    const translationKey = isOrder ? 'InboxPage.stateReviewNeeded' : 'InboxPage.stateReviewGiven';
    return {
      stateClassName: isOrder ? css.stateActionNeeded : css.stateNoActionNeeded,
      state: intl.formatMessage({
        id: translationKey,
      }),
    };
  } else if (txIsReviewed(tx)) {
    return {
      stateClassName: css.stateConcluded,
      state: intl.formatMessage({
        id: 'InboxPage.stateReviewed',
      }),
    };
  } else {
    console.warn('This transition is unknown:', tx.attributes.lastTransition);
    return null;
  }
};

export const InboxItem = React.memo(props => {
  // const { unitType, type, tx, intl, stateData, currentUser } = props;
  const { type, tx, intl, stateData, currentUser } = props;
  let isOrder = type === 'order';

  const otherUser = tx.customer.id.uuid === currentUser.id.uuid ? tx.provider : tx.customer;
  const currentUserIsCustomer = tx.customer.id.uuid === currentUser.id.uuid;
  if (currentUserIsCustomer) {
    isOrder = true;
  }

  // const unitPurchase = tx.attributes?.lineItems?.find(
  //   item => item.code === unitType && !item.reversal
  // );
  // const quantity = unitPurchase ? unitPurchase.quantity.toString() : null;

  const otherUserDisplayName = <UserDisplayName user={otherUser} intl={intl} />;
  const isOtherUserBanned = otherUser.attributes.banned;

  const isSaleNotification = !isOrder && txIsPurchased(tx);
  const rowNotificationDot = isSaleNotification ? <div className={css.notificationDot} /> : null;
  const lastTransitionedAt = formatDateIntoPartials(tx.attributes.lastTransitionedAt, intl);
  const imagesOrder = tx?.listing?.attributes?.publicData?.imagesOrder;
  const firstChosenImageId =
    Array.isArray(imagesOrder) && imagesOrder.length > 0 && imagesOrder[0]?.id;

  const fallbackImage =
    tx?.listing?.images && tx.listing.images.length > 0 ? tx.listing.images[0] : null;

  const listingImage = firstChosenImageId
    ? tx.listing.images.find(img => img?.id?.uuid === firstChosenImageId) || fallbackImage
    : fallbackImage;

  const linkClasses = classNames(css.itemLink, {
    [css.bannedUserLink]: isOtherUserBanned,
  });

  const isDisabled = tx.id.uuid === '1';

  return (
    <>
      {/* Display current transaction listing */}
      <NamedLink
        className={css.item}
        name={isOrder ? 'OrderDetailsPage' : 'SaleDetailsPage'}
        params={{ id: tx.id.uuid }}
      >
        <DetailCardImage
          className={css.itemListingImage}
          listingTitle={tx.listing?.attributes?.title}
          image={listingImage}
          isCustomer={false}
          isDisabled={isDisabled}
        />
        <div className={linkClasses}>
          <div className={css.rowNotificationDot}>{rowNotificationDot}</div>
          <div className={css.itemInfo}>
            <div className={css.itemUsername}>{otherUserDisplayName}</div>
            <div className={css.itemOrderInfo}>
              <span>{tx.listing?.attributes?.title}</span>
              {/* {quantity && (
                <>
                  <br />
                  <FormattedMessage id="InboxPage.quantity" values={{ quantity }} />
                </>
              )} */}
            </div>
          </div>
          <div className={css.itemState}>
            <div className={classNames(css.stateName, stateData.stateClassName)}>
              {stateData.state}
            </div>
            <div
              className={classNames(css.lastTransitionedAt, stateData.lastTransitionedAtClassName)}
              title={lastTransitionedAt.dateAndTime}
            >
              {lastTransitionedAt.date}
            </div>
          </div>
        </div>
      </NamedLink>
    </>
  );
});

InboxItem.propTypes = {
  unitType: propTypes.lineItemUnitType.isRequired,
  type: oneOf(['order', 'sale']).isRequired,
  tx: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
};

export const InboxPageComponent = props => {
  const {
    unitType,
    currentUser,
    fetchInProgress,
    // fetchOrdersOrSalesError,
    intl,
    params,
    location,
    scrollingDisabled,
    transactions,
  } = props;
  const chatTransactions = [...transactions];
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [providerNotificationCount, setProviderNotificationCount] = useState(0);
  // const memoizedTransactions = useMemo(() => transactions, [transactions]);
  // const { spotlightListings, loading } = useListings();
  const { spotlightListings } = useListings();
  const { tab } = params;
  const [processedTransactions, setProcessedTransactions] = useState([]);
  const itemsPerPage = 12; // Number of items per page
  const [currentPage, setCurrentPage] = useState(1);
  // const listings = useMemo(() => spotlightListings || [], [spotlightListings]);
  const listings1 = useMemo(() => {
    return (spotlightListings || []).filter(item => {
      const publicDataSold = getCleanValue(item.attributes?.publicData, 'sold');
      const metadataOffline = getCleanValue(item.attributes?.metadata, 'offline');

      return (
        (publicDataSold === true || publicDataSold === 'true') &&
        (metadataOffline === true || metadataOffline === 'true')
      );
    });
  }, [spotlightListings]);

  const listings2 = useMemo(() => {
    return (spotlightListings || []).filter(item => {
      const pocketListing = getCleanValue(item.attributes?.metadata, 'pocketListing');
      const offline = getCleanValue(item.attributes?.metadata, 'offline');

      return (
        (pocketListing === true || pocketListing === 'true') &&
        (offline === true || offline === 'true')
      );
    });
  }, [spotlightListings]);
  //Merge both lisitngs
  const listings = [...listings1, ...listings2];
  // Merge transactions and listings

  const combinedTransactions = useMemo(() => {
    const listingAsTransactions = listings.map(listing => {
      return {
        id: listing.id,
        type: 'listing',
        attributes: {
          ...listing.attributes,
          listing,
          lastTransition: 'transition/review-2-by-customer',
        },
        listing: listing,
      };
    });

    // Just return the original transactions without injecting any copied ones
    // const modifiedTransactions = [...transactions];
    const filteredTransactionsPurchase = transactions.filter(tx => {
      const txTransitions = tx?.attributes?.transitions;

      if (!Array.isArray(txTransitions)) return false;

      const hasAutoCancel = txTransitions.some(
        t =>
          t.transition === 'transition/auto-cancel' ||
          t.transition === 'transition/cancel' ||
          t.transition === 'transition/cancel-from-disputed' ||
          t.transition === 'transition/offer-expired'
      );

      // If it has auto-cancel, skip this transaction
      if (hasAutoCancel) return false;

      // Otherwise, include it
      return true;
    });

    const filteredTransactions = transactions.filter(tx => {
      const txTransitions = tx?.attributes?.transitions;

      if (!Array.isArray(txTransitions)) return false;

      const hasAutoCancel = txTransitions.some(
        t =>
          t.transition === 'transition/auto-cancel' ||
          t.transition === 'transition/cancel' ||
          t.transition === 'transition/cancel-from-disputed' ||
          t.transition === 'transition/offer-expired' ||
          t.transition === 'transition/enquire'
      );

      // If it has auto-cancel, we skip this transaction
      if (hasAutoCancel) return false;

      // Otherwise, check for allowed transitions
      return txTransitions.some(t =>
        [
          'transition/auto-complete',
          'transition/mark-delivered-by-operator',
          'transition/mark-received-from-purchased',
          'transition/mark-shipped-by-operator',
          'transition/mark-received-by-operator',
          'transition/auto-mark-received',
          'transition/confirm-payment',
          'transition/mark-delivered',
          'transition/offer-accepted-by-provider',
        ].includes(t.transition)
      );
    });

    return tab === 'sales'
      ? Array.from(
        new Map(
          [...listingAsTransactions, ...filteredTransactions].map(tx => [tx.id.uuid, tx])
        ).values()
      )
      : tab === 'chats'
        ? chatTransactions
        : filteredTransactionsPurchase;
  }, [transactions, listings, tab]);

  // Calculate total number of pages
  const totalPages = Math.ceil(combinedTransactions.length / itemsPerPage);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);
  // Get transactions for the current page
  const currentPageTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return combinedTransactions.slice(startIndex, endIndex);
  }, [combinedTransactions, currentPage]);

  const changePage = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate pagination structure
  const paginationItems = useMemo(() => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Add "..." before the previous pages if the current page is far from 1
    if (currentPage > 3) pages.push('...');

    // Show pages around the current page
    for (
      let i = Math.max(currentPage - 1, 2);
      i <= Math.min(currentPage + 1, totalPages - 1);
      i++
    ) {
      pages.push(i);
    }

    // Add "..." after the next pages if the current page is far from the last page
    if (currentPage < totalPages - 2) pages.push('...');

    // Always show the last page
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // console.log('handlelistings', listings, handlelistings());
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    if (!transactions.length) {
      setProviderNotificationCount(0);
      setOrderNotificationCount(0);
      return; // Exit if no transactions
    }

    // Avoid re-processing the same transactions
    if (
      JSON.stringify(transactions) === JSON.stringify(processedTransactions) &&
      processedTransactions.length
    ) {
      return;
    }

    // Set processed transactions to the current state
    setProcessedTransactions(transactions);

    // const isOrders = tab === 'orders';

    const allTransitions = transactions.flatMap(
      transaction => transaction?.attributes?.lastTransition || []
    );

    const buyerTransitions = [
      'transition/offer-made-by-provider',
      'transition/offer-accepted-by-customer',
      'transition/offer-accepted-by-provider',
    ];

    const sellerTransitions = [
      'transition/confirm-payment',
      'transition/counter-offer-made-by-customer',
    ];

    let matchingBuyerTransitions = [];
    let matchingSellerTransitions = [];

    if (params.tab === 'orders') {
      matchingBuyerTransitions = allTransitions.filter(transition =>
        buyerTransitions.includes(transition)
      );
    }

    if (params.tab === 'sales') {
      matchingSellerTransitions = allTransitions.filter(transition =>
        sellerTransitions.includes(transition)
      );
    }

    const combinedLengthBuyer = matchingBuyerTransitions.length;
    const combinedLengthSeller = matchingSellerTransitions.length;

    setProviderNotificationCount(combinedLengthSeller);
    setOrderNotificationCount(combinedLengthBuyer);
  }, [transactions, params.tab, tab, processedTransactions]);

  // const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const validTab = tab === 'orders' || tab === 'sales' || tab === 'chats';
  if (!validTab) {
    return <NotFoundPage />;
  }

  const isOrders = tab === 'orders';
  const isSales = tab === 'sales';
  const isChats = tab === 'chats';

  // const ordersTitle = intl.formatMessage({ id: 'InboxPage.ordersTitle' });
  // const salesTitle = intl.formatMessage({ id: 'InboxPage.salesTitle' });
  // const title = isOrders ? ordersTitle : salesTitle;

  const toTxItem = tx => {
    const type = params.tab === 'orders' ? 'order' : 'sale';
    const stateData = txState(intl, tx, type);

    if (params.tab === 'orders' && (tx.type === 'listing' || tx.id?.uuid?.startsWith('copied-'))) {
      return null;
    }
    if ((tx.type === 'listing' || tx.id?.uuid?.startsWith('copied-')) && params.tab === 'sales') {
      const imagesOrder = tx?.listing?.attributes?.publicData?.imagesOrder;
      const firstChosenImageId =
        Array.isArray(imagesOrder) && imagesOrder.length > 0 && imagesOrder[0]?.id;

      const fallbackImage =
        tx?.listing?.images && tx.listing.images.length > 0 ? tx.listing.images[0] : null;

      const image = firstChosenImageId
        ? tx.listing.images.find(img => img?.id?.uuid === firstChosenImageId) || fallbackImage
        : fallbackImage;

      const primaryTitle = tx?.attributes?.title?.trim();
      const fallbackTitle = tx?.listing?.attributes?.title?.trim();
      const title = primaryTitle || fallbackTitle || 'Untitled';
      // const lastTransition = tx?.attributes?.lastTransition;
      // const profileName = tx?.attributes?.listing?.author?.attributes?.profile?.displayName;
      //listing rendering which has been sold offline

      const listingMetadata = tx.listing?.attributes?.metadata || {};
      const item = getCleanValue(listingMetadata, 'item');
      const pocketListing = getCleanValue(tx.attributes?.metadata, 'pocketListing');
      const ListPrice = getCleanValue(listingMetadata, 'listPrice');
      const DateOfSale =
        getCleanValue(listingMetadata, 'dateOfSale') ||
        getCleanValue(listingMetadata, 'DateOfSale') ||
        getCleanValue(listingMetadata, 'Dateofsale') ||
        getCleanValue(listingMetadata, 'dateofsale');
      const SoldPrice = getCleanValue(tx.listing?.attributes?.metadata, 'soldPrice');
      const ReGEMFee = getCleanValue(tx.listing?.attributes?.metadata, 'ReGEMFee');
      const payoutAmount = getCleanValue(tx.listing?.attributes?.metadata, 'payoutAmount');
      const PayVia = getCleanValue(tx.listing?.attributes?.metadata, 'payVia');
      const listingId = getCleanValue(tx.listing?.id, 'uuid');
      const listingName = getCleanValue(tx.attributes, 'title');
      const OriginalPrice = getCleanValue(tx.listing?.attributes?.price, 'amount');

      const slugify = str =>
        str
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .trim()
          .replace(/\s+/g, '-'); // Replace spaces with dashes
      const slug = slugify(listingName || title || 'offline-order');
      const { setOrderData } = useOrderPage(); // Use the context
      const handleRedirect = event => {
        event.preventDefault(); // Prevent default anchor tag behavior (no URL change)

        // Create the orderData object directly
        const orderData = {
          item: title,
          ListPrice: ListPrice,
          DateOfSale: DateOfSale,
          SoldPrice: SoldPrice,
          ReGEMFee: ReGEMFee,
          payoutAmount: payoutAmount,
          PayVia: PayVia,
          image: image,
          listingId: listingId,
          listingName: listingName,
          pocketListing: pocketListing,
          OriginalPrice: OriginalPrice / 100,
        };
        // Set the data to be passed to the OfflineOrderPage context
        setOrderData(orderData);

        // Save it to sessionStorage
        sessionStorage.setItem('orderData', JSON.stringify(orderData));

        // Manually redirect to the target page without changing URL
        window.location.href = `/offline-orders/${listingId}/${slug}`;
      };
      return (
        <li key={tx.id.uuid || tx.id} className={css.listItem}>
          <a className={css.item} href="#" onClick={handleRedirect}>
            <DetailCardImage
              className={css.itemListingImage}
              listingTitle={title}
              image={image}
              isCustomer={false}
              item={item}
              ListPrice={ListPrice}
              DateOfSale={DateOfSale}
              SoldPrice={SoldPrice}
              ReGEMFee={ReGEMFee}
              payoutAmount={payoutAmount}
              PayVia={PayVia}
              isDisabled={true}
              pocketListing={pocketListing}
            />
            <div className={css.itemLink}>
              <div className={css.rowNotificationDot}></div>
              <div className={css.itemInfo}>
                <div className={css.itemUsername}>
                  {pocketListing ? 'Pocket Sale' : 'Offline Sale'}
                </div>
                <div className={css.itemOrderInfo}>
                  <span>{title}</span>
                  {/* {quantity && (
                <>
                  <br />
                  <FormattedMessage id="InboxPage.quantity" values={{ quantity }} />
                </>
              )} */}
                </div>
              </div>
              <div className={css.itemState}>
                <div className={classNames(css.stateName, stateData.stateClassName)}>
                  {stateData.state}
                </div>
                <div
                  className={classNames(
                    css.lastTransitionedAt,
                    stateData.lastTransitionedAtClassName
                  )}
                // title={lastTransitionedAt.dateAndTime}
                >
                  {DateOfSale}
                </div>
              </div>
            </div>
          </a>
        </li>
      );
    }

    // The copied transactions rendering which has been sold offline!!!!
    // if (tx.id?.uuid?.startsWith('copied-')) {
    //   return (
    //     <li key="copied-transaction" className={css.listItem}>
    //       <div className={css.copiedTransaction}>
    //         <div className={css.specialMessage}>
    //           <strong>This is a preview of a sold transaction:</strong>
    //         </div>
    //         <InboxItem
    //           currentUser={currentUser}
    //           unitType={unitType}
    //           type={type}
    //           tx={tx}
    //           intl={intl}
    //           stateData={stateData}
    //         />
    //       </div>
    //     </li>
    //   );
    // }
    // Regular transaction rendering online
    return stateData ? (
      <li key={tx.id.uuid} className={css.listItem}>
        <InboxItem
          currentUser={currentUser}
          unitType={unitType}
          type={type}
          tx={tx}
          intl={intl}
          stateData={stateData}
        />
      </li>
    ) : null;
  };

  // const error = fetchOrdersOrSalesError ? (
  //   <p className={css.error}>
  //     <FormattedMessage id="InboxPage.fetchFailed" />
  //   </p>
  // ) : null;

  // const noResults =
  //   !fetchInProgress && transactions.length === 0 && !fetchOrdersOrSalesError ? (
  //     <li key="noResults" className={css.noResults}>
  //       <FormattedMessage id="InboxPage.noOrdersFound" />
  //     </li>
  //   ) : null;

  // const hasOrderOrSaleTransactions = (tx, isOrdersTab, user) => {
  //   return isOrdersTab
  //     ? user.id && tx && tx.length > 0 && tx[0].customer.id.uuid === user.id.uuid
  //     : user.id && tx && tx.length > 0 && tx[0].provider.id.uuid === user.id.uuid;
  // };

  // const hasTransactions = !fetchInProgress && hasOrderOrSaleTransactions(transactions, isOrders, ensuredCurrentUser);

  const providerNotificationBadge =
    providerNotificationCount > 0 ? <NotificationBadge count={providerNotificationCount} /> : null;
  const orderNotificationBadge =
    orderNotificationCount > 0 ? <NotificationBadge count={orderNotificationCount} /> : null;
  const tabs = [
    {
      text: (
        <span>
          <FormattedMessage id="InboxPage.ordersTabTitle2" />
          {isOrders ? orderNotificationBadge : null}
        </span>
      ),
      selected: isOrders,
      linkProps: {
        name: 'InboxPage',
        params: { tab: 'orders' },
      },
    },
    {
      text: (
        <span>
          <FormattedMessage id="InboxPage.salesTabTitle2" />
          {isSales ? providerNotificationBadge : null}
        </span>
      ),
      selected: isSales,
      linkProps: {
        name: 'InboxPage',
        params: { tab: 'sales' },
      },
    },
    {
      text: (
        <span>
          <FormattedMessage id="InboxPage.chatsTabTitle" />
        </span>
      ),
      selected: isChats,
      linkProps: {
        name: 'InboxPage',
        params: { tab: 'chats' },
      },
    },
  ];
  const nav = <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} />;

  // let inboxPageTitle = null;

  // if (isOrders) {
  //   inboxPageTitle = <FormattedMessage id="InboxPage.ordersTabTitle2" />;
  // } else if (isSales) {
  //   inboxPageTitle = <FormattedMessage id="InboxPage.salesTabTitle2" />;
  // } else {
  //   inboxPageTitle = <FormattedMessage id="InboxPage.chatsTabTitle" />;
  // }

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, [location.pathname]);

  return (
    <Page title="Inbox" scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation>
        <LayoutWrapperTopbar>
          <TopbarContainer
            className={css.topbar}
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            currentPage="InboxPage"
          />
          <UserNav
            selectedPageName="InboxPage"
            selectedTab={isOrders ? 'orders' : isSales ? 'sales' : 'chats'}
          />
        </LayoutWrapperTopbar>

        <LayoutWrapperSideNav className={css.navigation}>{nav}</LayoutWrapperSideNav>

        <LayoutWrapperMain>
          <h1 className={css.title}>
            {isOrders ? 'My Purchases' : isSales ? 'My Sales' : 'Inbox'}
          </h1>
          {combinedTransactions.length === 0 ? (
            <div className={css.emptyMessage}>No items to show.</div>
          ) : (
            <>
              <ul className={css.itemList}>
                {!fetchInProgress ? (
                  currentPageTransactions.map(toTxItem)
                ) : (
                  <li className={css.listItemsLoading}>
                    <IconSpinner />
                  </li>
                )}
              </ul>
              {totalPages > 1 && (
                <div className={css.pagination}>
                  {/* Left arrow */}
                  <div>
                    <button
                      className={css.paginationArrow}
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                  </div>

                  {/* Pagination items */}
                  <div className={css.pagenumbers}>
                    {paginationItems.map((item, index) =>
                      item === '...' ? (
                        <span key={index} className={css.paginationEllipsis}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={index}
                          onClick={() => changePage(item)}
                          className={`${css.paginationButton} ${currentPage === item ? css.paginationActive : ''
                            }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <div>
                    <button
                      className={css.paginationArrow}
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </button>
                  </div>
                  {/* Right arrow */}
                </div>
              )}
            </>
          )}
        </LayoutWrapperMain>

        <LayoutWrapperFooter>{/* Optional footer content */}</LayoutWrapperFooter>
      </LayoutSideNavigation>
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  unitType: config.lineItemUnitType,
  currentUser: null,
  listings: [],
  currentUserHasOrders: null,
  fetchOrdersOrSalesError: null,
  pagination: null,
  providerNotificationCount: 0,
  orderNotificationCount: 0,
  sendVerificationEmailError: null,
};

InboxPageComponent.propTypes = {
  params: shape({
    tab: string.isRequired,
  }).isRequired,

  unitType: propTypes.lineItemUnitType,
  currentUser: propTypes.currentUser,
  listings: arrayOf(propTypes.ownListing),
  fetchInProgress: bool.isRequired,
  fetchOrdersOrSalesError: propTypes.error,
  pagination: propTypes.pagination,
  providerNotificationCount: number,
  orderNotificationCount: number,
  scrollingDisabled: bool.isRequired,
  transactions: arrayOf(propTypes.transaction).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { fetchInProgress, fetchOrdersOrSalesError, pagination, transactionRefs } = state.InboxPage;
  const { currentPageResultIds } = state.ManageListingsPage;
  const listings = getOwnListingsById(state, currentPageResultIds);

  const {
    currentUser,
    currentUserNotificationCount: providerNotificationCount,
    currentUserOrderNotificationCount: orderNotificationCount,
  } = state.user;
  return {
    currentUser,
    listings,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    orderNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
  };
};

const InboxPage = compose(
  connect(mapStateToProps),
  injectIntl
)(InboxPageComponent);

export default InboxPage;
