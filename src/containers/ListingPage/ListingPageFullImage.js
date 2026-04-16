import React, { Component, useEffect } from 'react';
import { array, arrayOf, bool, func, shape, string, oneOf, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import config from '../../config';
import routeConfiguration from '../../routing/routeConfiguration';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { findOptionsForSelectFilter } from '../../util/search';
import { LISTING_STATE_PENDING_APPROVAL, LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../util/urlHelpers';
import { formatMoney, convertMoneyToNumber } from '../../util/currency';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

import {
  Page,
  NamedLink,
  NamedRedirect,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  OrderPanel,
  Modal,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import {
  sendEnquiry,
  fetchTransactionLineItems,
  setInitialValues,
  sendOffer,
} from './ListingPage.duck';
import {
  acceptOfferByCustomer,
} from '../TransactionPage/TransactionPage.duck.js';
import SectionAuthorMaybe from './SectionAuthorMaybe';
import SectionGallery from './SectionGallery';

import css from './ListingPage.module.css';
import MakeOfferForm from './MakeOfferForm/MakeOfferForm';
import ListingInfoSection from './ListingInfoSection/ListingInfoSection';
import AddToFavButton from './AddToFavButton/AddToFavButton';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

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

const categoryLabel = (categories, key) => {
  const cat = categories.find(c => c.key === key);
  return cat ? cat.label : key;
};

export class ListingPageComponent extends Component {
  constructor(props) {
    super(props);
    const { enquiryModalOpenForListingId, params } = props;
    this.state = {
      pageClassNames: [],
      imageCarouselOpen: false,
      enquiryModalOpen: enquiryModalOpenForListingId === params.id,
      makeOfferModalOpen: false,
      deliveryMoreInfoModalOpen: false,
      affirmMoreInfoModalOpen: false,
      pendingModalOpen: false,
      isProductAlreadyInCart: false,
      errorMessage: "",
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.onContactUser = this.onContactUser.bind(this);
    this.onSubmitEnquiry = this.onSubmitEnquiry.bind(this);
    this.onSubmitOffer = this.onSubmitOffer.bind(this);
    this.onCurrentUserUpdated = this.onCurrentUserUpdated.bind(this);
    this.onMakeOffer = this.onMakeOffer.bind(this);
  }

  componentDidMount() {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = window.location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
    if (typeof window !== 'undefined') {
      const idForPendingMessage = window.sessionStorage.getItem('listingUUIDPendingMessage');

      if (idForPendingMessage && idForPendingMessage === this.props.params.id) {
        this.setState({ pendingModalOpen: true });
      }
    }
  }

  componentDidUpdate(prevProps) {
    const oldValue = prevProps.currentUser;
    const newValue = this.props.currentUser;
    const valueChanged = oldValue !== newValue;
    if (valueChanged) {
      this.onCurrentUserUpdated();
    }
  }

  onCurrentUserUpdated() {
    if (this.props.currentUser) {
      const currentShopCart = this.props.currentUser
        ? this.props.currentUser.attributes.profile.publicData.shoppingCart
          ? this.props.currentUser.attributes.profile.publicData.shoppingCart
          : []
        : shoppingCartFromSession ?? [];

      const currentShopCartUnwrapped = currentShopCart.map(item => {
        return {
          listing: typeof item.listing === 'string' ? JSON.parse(item.listing) : item.listing,
          checkoutValues:
            typeof item.checkoutValues === 'string'
              ? JSON.parse(item.checkoutValues)
              : item.checkoutValues,
        };
      });

      const isCurrentProductAddedInBasket = currentShopCartUnwrapped.find(i => {
        return i.listing.id.uuid === this.props.params.id;
      });

      this.setState({ isProductAlreadyInCart: !!isCurrentProductAddedInBasket });
    }
  }

  handleSubmit(values) {
    const {
      history,
      getListing,
      params,
      callSetInitialValues,
      onInitializeCardPaymentData,
    } = this.props;
    const listingId = new UUID(params.id);
    const listing = getListing(listingId);

    const { bookingDates, quantity: quantityRaw, deliveryMethod, ...otherOrderData } = values;
    const bookingDatesMaybe = bookingDates
      ? {
        bookingDates: {
          bookingStart: bookingDates.startDate,
          bookingEnd: bookingDates.endDate,
        },
      }
      : {};

    const initialValues = {
      listing,
      orderData: {
        ...bookingDatesMaybe,
        quantity: Number.parseInt(quantityRaw, 10),
        deliveryMethod,
        ...otherOrderData,
      },
      confirmPaymentError: null,
    };

    const saveToSessionStorage = !this.props.currentUser;

    const routes = routeConfiguration();
    // Customize checkout page state with current listing and selected orderData
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);

    callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

    // Clear previous Stripe errors from store if there is any
    onInitializeCardPaymentData();

    // Redirect to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routes,
        { id: listing.id.uuid, slug: createSlug(listing.attributes.title) },
        {}
      )
    );
  }

  onContactUser() {
    const { currentUser, history, callSetInitialValues, params, location } = this.props;

    if (!currentUser) {
      const state = { from: `${location.pathname}${location.search}${location.hash}` };

      // We need to log in before showing the modal, but first we need to ensure
      // that modal does open when user is redirected back to this listingpage
      callSetInitialValues(setInitialValues, { enquiryModalOpenForListingId: params.id });

      // signup and return back to listingPage.
      history.push(createResourceLocatorString('SignupPage', routeConfiguration(), {}, {}), state);
    } else {
      this.setState({ enquiryModalOpen: true });
    }
  }

  onMakeOffer() {
    const {
      currentUser,
      history,
      callSetInitialValues,
      params,
      location,
      params: rawParams,
      getOwnListing,
      getListing,
    } = this.props;

    const listingId = new UUID(rawParams.id);
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
      this.setState({ makeOfferModalOpen: true });
    }
  }

  onSubmitEnquiry(values) {
    const { history, params, onSendEnquiry } = this.props;
    const routes = routeConfiguration();
    const listingId = new UUID(params.id);
    const { message } = values;

    onSendEnquiry(listingId, message.trim())
      .then(txId => {
        this.setState({ enquiryModalOpen: false });

        // Redirect to OrderDetailsPage
        history.push(
          createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {})
        );
      })
      .catch(() => {
        // Ignore, error handling in duck file
      });
  }

  onSubmitOffer(values) {
    if (!values || !values.proposedPrice) {
      this.setState({ errorMessage: "You must input price" });
      return;
    } else if (isNaN(values.proposedPrice)) {
      this.setState({ errorMessage: "Please type a number" });
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
    } = this.props;

    const listingId = new UUID(params.id);
    const isPendingApprovalVariant = params.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
    const isDraftVariant = params.variant === LISTING_PAGE_DRAFT_VARIANT;
    const currentListing =
      isPendingApprovalVariant || isDraftVariant
        ? ensureOwnListing(getOwnListing(listingId))
        : ensureListing(getListing(listingId));
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
      this.setState({ errorMessage: "Your offer was declined, because it was too low. Please submit a new offer, thanks!" });
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
        this.setState({ makeOfferModalOpen: false });
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

  render() {
    const {
      unitType,
      isAuthenticated,
      currentUser,
      getListing,
      getOwnListing,
      intl,
      onManageDisableScrolling,
      params: rawParams,
      location,
      scrollingDisabled,
      showListingError,
      reviews,
      fetchReviewsError,
      sendEnquiryInProgress,
      sendEnquiryError,
      timeSlots,
      fetchTimeSlotsError,
      customConfig,
      onFetchTransactionLineItems,
      lineItems,
      fetchLineItemsInProgress,
      fetchLineItemsError,
      onUpdateCurrentUser,
    } = this.props;

    const listingId = new UUID(rawParams.id);
    const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
    const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
    const currentListing =
      isPendingApprovalVariant || isDraftVariant
        ? ensureOwnListing(getOwnListing(listingId))
        : ensureListing(getListing(listingId));

    const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
    const params = { slug: listingSlug, ...rawParams };

    const listingType = isDraftVariant
      ? LISTING_PAGE_PARAM_TYPE_DRAFT
      : LISTING_PAGE_PARAM_TYPE_EDIT;
    const listingTab = isDraftVariant ? 'photos' : 'details';

    const isApproved =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

    const pendingIsApproved = isPendingApprovalVariant && isApproved;

    // If a /pending-approval URL is shared, the UI requires
    // authentication and attempts to fetch the listing from own
    // listings. This will fail with 403 Forbidden if the author is
    // another user. We use this information to try to fetch the
    // public listing.
    const pendingOtherUsersListing =
      (isPendingApprovalVariant || isDraftVariant) &&
      showListingError &&
      showListingError.status === 403;
    const shouldShowPublicListingPage = pendingIsApproved || pendingOtherUsersListing;

    if (shouldShowPublicListingPage) {
      return <NamedRedirect name="ListingPage" params={params} search={location.search} />;
    }

    const {
      description = '',
      geolocation = null,
      price = null,
      title = '',
      publicData,
    } = currentListing.attributes;

    const richTitle = (
      <span className={css.richTitle}>
        {richText(title, {
          longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
          longWordClass: css.longWord,
        })}
      </span>
    );

    const bookingTitle = (
      <FormattedMessage id="ListingPage.bookingTitle" values={{ title: richTitle }} />
    );

    const topbar = <TopbarContainer />;

    if (showListingError && showListingError.status === 404) {
      // 404 listing not found

      return <NotFoundPage />;
    } else if (showListingError) {
      // Other error in fetching listing

      const errorTitle = intl.formatMessage({
        id: 'ListingPage.errorLoadingListingTitle',
      });

      return (
        <Page title={errorTitle} scrollingDisabled={scrollingDisabled}>
          <LayoutSingleColumn className={css.pageRoot}>
            <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
            <LayoutWrapperMain>
              <p className={css.errorText}>
                <FormattedMessage id="ListingPage.errorLoadingListingMessage" />
              </p>
            </LayoutWrapperMain>
            <LayoutWrapperFooter>
              <Footer />
            </LayoutWrapperFooter>
          </LayoutSingleColumn>
        </Page>
      );
    } else if (!currentListing.id) {
      // Still loading the listing

      const loadingTitle = intl.formatMessage({
        id: 'ListingPage.loadingListingTitle',
      });

      return (
        <Page title={loadingTitle} scrollingDisabled={scrollingDisabled}>
          <LayoutSingleColumn className={css.pageRoot}>
            <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
            <LayoutWrapperMain>
              <p className={css.loadingText}>
                <FormattedMessage id="ListingPage.loadingListingMessage" />
              </p>
            </LayoutWrapperMain>
            <LayoutWrapperFooter>
              <Footer />
            </LayoutWrapperFooter>
          </LayoutSingleColumn>
        </Page>
      );
    }

    const handleViewPhotosClick = e => {
      // Stop event from bubbling up to prevent image click handler
      // trying to open the carousel as well.
      e.stopPropagation();
      this.setState({
        imageCarouselOpen: true,
      });
    };
    const authorAvailable = currentListing && currentListing.author;
    const userAndListingAuthorAvailable = !!(currentUser && authorAvailable);
    const isOwnListing =
      userAndListingAuthorAvailable && currentListing.author.id.uuid === currentUser.id.uuid;
    const showContactUser = authorAvailable && (!currentUser || (currentUser && !isOwnListing));

    const currentAuthor = authorAvailable ? currentListing.author : null;
    const ensuredAuthor = ensureUser(currentAuthor);

    // When user is banned or deleted the listing is also deleted.
    // Because listing can be never showed with banned or deleted user we don't have to provide
    // banned or deleted display names for the function
    const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

    const { formattedPrice, priceTitle } = priceData(price, intl);

    const handleOrderSubmit = values => {
      const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
      if (isOwnListing || isCurrentlyClosed) {
        window.scrollTo(0, 0);
      } else {
        this.handleSubmit(values);
      }
    };

    const listingImages = (listing, variantName) =>
      (listing.images || [])
        .map(image => {
          const variants = image.attributes.variants;
          const variant = variants ? variants[variantName] : null;

          // deprecated
          // for backwards combatility only
          const sizes = image.attributes.sizes;
          const size = sizes ? sizes.find(i => i.name === variantName) : null;

          return variant || size;
        })
        .filter(variant => variant != null);

    const facebookImages = listingImages(currentListing, 'facebook');
    const twitterImages = listingImages(currentListing, 'twitter');
    const schemaImages = listingImages(currentListing, `${config.listing.variantPrefix}-2x`).map(
      img => img.url
    );
    const siteTitle = config.siteTitle;
    const schemaTitle = intl.formatMessage(
      { id: 'ListingPage.schemaTitle' },
      { title, price: formattedPrice, siteTitle }
    );
    // You could add reviews, sku, etc. into page schema
    // Read more about product schema
    // https://developers.google.com/search/docs/advanced/structured-data/product
    const productURL = `${config.canonicalRootURL}${location.pathname}${location.search}${location.hash}`;
    const brand = currentListing?.attributes?.publicData?.brand;
    const brandMaybe = brand ? { brand: { '@type': 'Brand', name: brand } } : {};
    const schemaPriceNumber = intl.formatNumber(convertMoneyToNumber(price), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const currentStock = currentListing.currentStock?.attributes?.quantity || 0;
    const schemaAvailability =
      currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    const authorLink = (
      <NamedLink
        className={css.authorNameLink}
        name="ListingPage"
        params={params}
        to={{ hash: '#author' }}
      >
        {authorDisplayName}
      </NamedLink>
    );

    const amenityOptions = findOptionsForSelectFilter('amenities', customConfig.filters);
    const categoryOptions = findOptionsForSelectFilter('category', customConfig.filters);
    const category =
      publicData && publicData.category ? (
        <span>
          {categoryLabel(categoryOptions, publicData.category)}
          <span className={css.separator}>•</span>
        </span>
      ) : null;

    return (
      <Page
        title={schemaTitle}
        scrollingDisabled={scrollingDisabled}
        author={authorDisplayName}
        contentType="website"
        description={description}
        facebookImages={facebookImages}
        twitterImages={twitterImages}
        schema={{
          '@context': 'http://schema.org',
          '@type': 'Product',
          description: description,
          name: schemaTitle,
          image: schemaImages,
          ...brandMaybe,
          offers: {
            '@type': 'Offer',
            url: productURL,
            priceCurrency: price.currency,
            price: schemaPriceNumber,
            availability: schemaAvailability,
          },
        }}
      >
        <LayoutSingleColumn className={css.pageRoot}>
          <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
          <LayoutWrapperMain>
            <div className={css.wrapper}>
              <div className={css.wrapperTop}>
                <div className={css.imagesWrapper}>
                  <SectionGallery listing={currentListing} />
                  {!isOwnListing && (
                    <AddToFavButton listingIdObj={currentListing?.id} currentUser={currentUser} />
                  )}
                </div>
                <div className={css.bookingWrapper}>
                  <SectionAuthorMaybe
                    title={title}
                    listing={currentListing}
                    authorDisplayName={authorDisplayName}
                    onContactUser={this.onContactUser}
                    isEnquiryModalOpen={isAuthenticated && this.state.enquiryModalOpen}
                    onCloseEnquiryModal={() => this.setState({ enquiryModalOpen: false })}
                    sendEnquiryError={sendEnquiryError}
                    sendEnquiryInProgress={sendEnquiryInProgress}
                    onSubmitEnquiry={this.onSubmitEnquiry}
                    currentUser={currentUser}
                    onManageDisableScrolling={onManageDisableScrolling}
                    editParams={{
                      id: listingId.uuid,
                      slug: listingSlug,
                      type: listingType,
                      tab: listingTab,
                    }}
                    reviews={reviews}
                    description={description}
                    category={intl.formatMessage({
                      id: 'Filters.category.' + publicData?.category ?? '',
                    })}
                  />
                  <OrderPanel
                    className={css.productOrderPanel}
                    listing={currentListing}
                    isOwnListing={isOwnListing}
                    unitType={unitType}
                    onSubmit={handleOrderSubmit}
                    title={bookingTitle}
                    author={ensuredAuthor}
                    onManageDisableScrolling={onManageDisableScrolling}
                    onContactUser={this.onContactUser}
                    timeSlots={timeSlots}
                    fetchTimeSlotsError={fetchTimeSlotsError}
                    onFetchTransactionLineItems={onFetchTransactionLineItems}
                    lineItems={lineItems}
                    fetchLineItemsInProgress={fetchLineItemsInProgress}
                    fetchLineItemsError={fetchLineItemsError}
                    currentUser={currentUser}
                    openMakeOfferModal={this.onMakeOffer}
                    deliveryMoreInfoModalOpen={this.state.deliveryMoreInfoModalOpen}
                    setDeliveryMoreInfoModalOpen={value =>
                      this.setState({ deliveryMoreInfoModalOpen: value })
                    }
                    affirmMoreInfoModalOpen={this.state.affirmMoreInfoModalOpen}
                    setAffirmMoreInfoModalOpen={value =>
                      this.setState({ affirmMoreInfoModalOpen: value })
                    }
                    isProductAlreadyInCart={this.state.isProductAlreadyInCart}
                    onUpdateCurrentUser={onUpdateCurrentUser}
                    isListingPage={true}
                  />
                </div>
              </div>
              <div className={css.wrapperBottom}>
                <ListingInfoSection publicData={publicData} listing={currentListing} />
              </div>
            </div>
            <Modal
              id="ListingPage.makeOffer"
              contentClassName={css.enquiryModalContent}
              isOpen={this.state.makeOfferModalOpen}
              onClose={() => {
                this.setState({ makeOfferModalOpen: false, errorMessage: "" })
              }}
              usePortal
              onManageDisableScrolling={onManageDisableScrolling}
            >
              <MakeOfferForm
                className={css.enquiryForm}
                submitButtonWrapperClassName={css.enquirySubmitButtonWrapper}
                listingTitle={title}
                formId="MakeOfferForm"
                listingPrice={currentListing.attributes?.price}
                authorDisplayName={authorDisplayName}
                sendEnquiryError={sendEnquiryError}
                onSubmit={this.onSubmitOffer}
                customErrorText={this.state.errorMessage}
                inProgress={sendEnquiryInProgress}
                onChange={() => { console.log("changing") }}
              />
            </Modal>

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

            {/* pending listing info modal */}

            <Modal
              id="pendingModal"
              isOpen={this.state.pendingModalOpen}
              onClose={() => {
                this.setState({ pendingModalOpen: false });
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem('listingUUIDPendingMessage');
                }
              }}
              onManageDisableScrolling={() => { }}
            >
              <div>
                <center>
                  <h1>
                    {' '}
                    <FormattedMessage id="ListingPage.pendingModalTitle" />
                  </h1>
                  <h2>
                    <FormattedMessage id="ListingPage.pendingModalText" />
                  </h2>
                </center>
              </div>
            </Modal>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSingleColumn>
      </Page>
    );
  }
}

ListingPageComponent.defaultProps = {
  unitType: config.lineItemUnitType,
  currentUser: null,
  enquiryModalOpenForListingId: null,
  showListingError: null,
  reviews: [],
  fetchReviewsError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  sendEnquiryError: null,
  customConfig: config.custom,
  lineItems: null,
  fetchLineItemsError: null,
};

ListingPageComponent.propTypes = {
  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string,
  }).isRequired,

  unitType: propTypes.lineItemUnitType,
  // from injectIntl
  intl: intlShape.isRequired,

  params: shape({
    id: string.isRequired,
    slug: string,
    variant: oneOf([LISTING_PAGE_DRAFT_VARIANT, LISTING_PAGE_PENDING_APPROVAL_VARIANT]),
  }).isRequired,

  isAuthenticated: bool.isRequired,
  currentUser: propTypes.currentUser,
  getListing: func.isRequired,
  getOwnListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  scrollingDisabled: bool.isRequired,
  enquiryModalOpenForListingId: string,
  showListingError: propTypes.error,
  callSetInitialValues: func.isRequired,
  reviews: arrayOf(propTypes.review),
  fetchReviewsError: propTypes.error,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  sendEnquiryInProgress: bool.isRequired,
  sendEnquiryError: propTypes.error,
  onSendEnquiry: func.isRequired,
  onInitializeCardPaymentData: func.isRequired,
  customConfig: object,
  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.Auth;
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    timeSlots,
    fetchTimeSlotsError,
    sendEnquiryInProgress,
    sendEnquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    enquiryModalOpenForListingId,
  } = state.ListingPage;
  const { currentUser } = state.user;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  return {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
    enquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    timeSlots,
    fetchTimeSlotsError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    sendEnquiryInProgress,
    sendEnquiryError,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onFetchTransactionLineItems: (orderData, listingId, isOwnListing) =>
    dispatch(fetchTransactionLineItems(orderData, listingId, isOwnListing)),
  onSendEnquiry: (listingId, message) => dispatch(sendEnquiry(listingId, message)),
  onSendOffer: (listingId, protectedDataInfo) =>
    dispatch(sendOffer(listingId, protectedDataInfo)),
  onAcceptOfferByCustomer: tx => dispatch(acceptOfferByCustomer(tx)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  onUpdateCurrentUser: () => dispatch(fetchCurrentUser()),

});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ListingPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(ListingPageComponent);

export default ListingPage;
