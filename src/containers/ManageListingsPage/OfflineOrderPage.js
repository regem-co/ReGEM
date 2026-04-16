import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import './offlinePage.css';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/UI.duck';

import {
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import ManageListingCard from './ManageListingCard/ManageListingCard';

import {
  closeListing,
  openListing,
  getOwnListingsById,
  relistListing,
} from './ManageListingsPage.duck';
import css from './ManageListingsPage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';
import { useOrderPage } from '../../Context/OrderPageProvider';

const gtmHandler = new GoogleTagManagerHandler();

const ManageListingsPageComponent = props => {
  const { orderData } = useOrderPage(); // Get the data from context
  const [listingMenuOpen, setListingMenuOpen] = useState(null);
  const [orderDataFromSession, setOrderDataFromSession] = useState(null);
  const [listingId1, setListingId1] = useState('');
  const [item1, setItem1] = useState('');
  const [idMismatchError, setIdMismatchError] = useState(false);
const pathSegments = window.location.pathname.split('/');

  useEffect(() => {
    
    // Example URL: /offline-orders/67e4a1ba-5820-4585-ae5e-d411f8ca604c/offlinetest
    // Indexes:         0        1                2                         3
    if (pathSegments[1] === 'offline-orders') {
      setListingId1(pathSegments[2]);
      setItem1(pathSegments[3]);
    }
  }, []);
  useEffect(() => {
    const storedOrderData = sessionStorage.getItem('orderData');
    if (storedOrderData) {
      const parsedData = JSON.parse(storedOrderData);
      setOrderDataFromSession(parsedData);

      // Compare the URL id with session storage listing id
      if (pathSegments[1] === 'offline-orders') {
        const urlListingId = pathSegments[2];
        if (urlListingId !== parsedData.listingId) {
          setIdMismatchError(true);
        }
      }
    }

    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = window.location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  useEffect(() => {
    if (orderDataFromSession) {
      console.log('✅ Updated orderData from session:', orderDataFromSession);
    }
  }, [orderDataFromSession]);

  const onToggleMenu = listing => {
    setListingMenuOpen(listing);
  };

  const {
    closingListing,
    closingListingError,
    listings,
    onCloseListing,
    onOpenListing,
    openingListing,
    openingListingError,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled,
    intl,
    onRelistListing,
  } = props;

  const listingsArray = Array.isArray(listings) ? listings : [];
  const filteredListingsArray = listingsArray.filter(l => {
    return !l.attributes.publicData.deleted;
  });

  const numberOfListings = filteredListingsArray?.length;

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

  const loadingResults = (
    <div className={css.messagePanel}>
      <h2 className={css.loadingData}>
        <FormattedMessage id="ManageListingsPage.loadingOwnListings" />
      </h2>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <h2 className={css.error}>
        <FormattedMessage id="ManageListingsPage.queryError" />
      </h2>
    </div>
  );

  const noResults =
    listingsAreLoaded && pagination.totalItems === 0 ? (
      <h1 className={css.title}>
        <FormattedMessage id="ManageListingsPage.noResults" />
      </h1>
    ) : null;

  const heading =
    listingsAreLoaded && pagination.totalItems > 0 ? (
      <h1 className={css.title}>
        <FormattedMessage
          id="ManageListingsPage.youHaveListings"
          values={{ count: numberOfListings }}
        />
      </h1>
    ) : (
      noResults
    );

  const page = queryParams ? queryParams.page : 1;
  const paginationLinks =
    listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="ManageListingsPage"
        pageSearchParams={{ page }}
        pagination={pagination}
      />
    ) : null;
  // const formatPrice = value => {
  //   const num = Number(value);
  //   return !isNaN(num) && value !== '' ? `$${num.toLocaleString()}` : '$';
  // };
  // const formatPrice = value => {
  //   const num = Number(value);
  //   if (isNaN(num) || value === '') return '$';
  //   return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  // };
// Show price without decimals (for OriginalPrice and sold price)
const formatPriceNoDecimals = value => {
  const num = Number(value);
  if (isNaN(num) || value === '') return '$';
  return `$${Math.round(num).toLocaleString()}`;
};

// Show price with decimals (for all others)
const formatPriceWithDecimals = value => {
  const num = Number(value);
  if (isNaN(num) || value === '') return '$';
  return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

  return (
    <Page
      title={intl.formatMessage({ id: 'ManageListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="ManageListingsPage" />
          {/* <UserNav selectedPageName="ManageListingsPage" /> */}
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          {!idMismatchError && orderDataFromSession ? (
            <div className="invoice-container">
              {orderDataFromSession ? (
                <div className="invoice-content">
                  {/* Left - Image and Description */}
                  <div className="invoice-left">
                    <a href={`/l/${orderDataFromSession.item}/${orderDataFromSession.listingId}`}>
                      <img
                        src={orderDataFromSession.image.attributes.variants['listing-card'].url}
                        alt="Product"
                        className="product-image"
                      />
                    </a>
                    {orderDataFromSession.pocketListing ? null :(<p className="original-price">
                      Original Price : {formatPriceWithDecimals(orderDataFromSession?.OriginalPrice)}
                    </p>) }

                    
                  </div>

                  {/* Right - Details */}
                  <div className="invoice-right">
                    <div className="heading">
                      <h3>Sale Breakdown</h3>
                    </div>
                    <div className="invoice-breakdown">
                      <p className="payment-info">
                        <a
                          href={`/l/${orderDataFromSession.item}/${orderDataFromSession.listingId}`}
                        >
                          {orderDataFromSession.item}
                        </a>{' '}
                        <span>{formatPriceWithDecimals(orderDataFromSession?.SoldPrice)}</span>
                      </p>
                      <p className="payment-info">
                        ReGEM fee * <span>{formatPriceWithDecimals(orderDataFromSession?.ReGEMFee)}</span>
                      </p>
                    </div>
                    <div className="invoice-breakdown">
                      <p className="payment-info">
                        You Earn
                        <span>{formatPriceWithDecimals(orderDataFromSession?.payoutAmount)}</span>
                      </p>{' '}
                    </div>
                    <p className="payment-info">
                      Sold Date <span>{orderDataFromSession.DateOfSale}</span>
                    </p>
                    <p className="payment-info ii">
                      Payout Via <span>{orderDataFromSession.PayVia}</span>
                    </p>
                    <p className="span">
                      * The fee helps us run the platform and provide the <br /> best possible
                      service to you!
                    </p>
                  </div>
                </div>
              ) : (
                <p>No order data available.</p>
              )}
            </div>
          ) : idMismatchError ? null : (
            <p>No order data available.</p>
          )}
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

ManageListingsPageComponent.propTypes = {
  closingListing: PropTypes.shape({ uuid: PropTypes.string.isRequired }),
  closingListingError: PropTypes.shape({
    listingId: propTypes.uuid.isRequired,
    error: propTypes.error.isRequired,
  }),
  listings: PropTypes.arrayOf(propTypes.ownListing),
  onCloseListing: PropTypes.func.isRequired,
  onOpenListing: PropTypes.func.isRequired,
  openingListing: PropTypes.shape({ uuid: PropTypes.string.isRequired }),
  openingListingError: PropTypes.shape({
    listingId: propTypes.uuid.isRequired,
    error: propTypes.error.isRequired,
  }),
  pagination: propTypes.pagination,
  queryInProgress: PropTypes.bool.isRequired,
  queryListingsError: propTypes.error,
  queryParams: PropTypes.object,
  scrollingDisabled: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  } = state.ManageListingsPage;

  const listings = getOwnListingsById(state, currentPageResultIds);
  return {
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  };
};

const mapDispatchToProps = dispatch => ({
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
  onRelistListing: listingId => dispatch(relistListing(listingId)),
});

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(ManageListingsPageComponent);
