import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

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

const gtmHandler = new GoogleTagManagerHandler();

export class ManageListingsPageComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { listingMenuOpen: null };
    this.onToggleMenu = this.onToggleMenu.bind(this);
  }

  componentDidMount() {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = window.location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }

  onToggleMenu(listing) {
    this.setState({ listingMenuOpen: listing });
  }

  render() {
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
    } = this.props;

    const listingsArray = Array.isArray(listings) ? listings : [];
    console.log("listingsArray", listingsArray);
    listingsArray.forEach(l => {
      console.log('deleted:', l?.attributes?.publicData?.deleted);
      console.log('pocketListing:', l?.attributes?.metadata?.pocketListing);
    });

    const filteredListingsArray = listingsArray.filter(l => {
      const deleted = l.attributes?.publicData?.deleted === true;
      const isPocketListing = l.attributes?.metadata?.pocketListing === true;
      return !deleted && !isPocketListing;
    });
    console.log("filteredListingsArray", filteredListingsArray);

    const hasPaginationInfo = !!pagination && pagination.totalItems != null;
    const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

    const numberOfListings = filteredListingsArray.length;

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

    const listingMenuOpen = this.state.listingMenuOpen;
    const closingErrorListingId = !!closingListingError && closingListingError.listingId;
    const openingErrorListingId = !!openingListingError && openingListingError.listingId;
    const title = intl.formatMessage({ id: 'ManageListingsPage.title' });
    const panelWidth = 62.5;
    const renderSizes = [
      `(max-width: 767px) 100vw`,
      `(max-width: 1920px) ${panelWidth / 2}vw`,
      `${panelWidth / 3}vw`,
    ].join(', ');

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn>
          <LayoutWrapperTopbar>
            <TopbarContainer currentPage="ManageListingsPage" />
            <UserNav selectedPageName="ManageListingsPage" />
          </LayoutWrapperTopbar>
          <LayoutWrapperMain>
            {queryInProgress ? loadingResults : null}
            {queryListingsError ? queryError : null}
            <div className={css.listingPanel}>
              {heading}
              <div className={css.listingCards}>
                {filteredListingsArray.map(l => {
                  console.log("Rendering listing:", l.id?.uuid, l.attributes?.title);
                  return (
                    <ManageListingCard
                      className={css.listingCard}
                      key={l.id.uuid}
                      listing={l}
                      isMenuOpen={!!listingMenuOpen && listingMenuOpen.id.uuid === l.id.uuid}
                      actionsInProgressListingId={openingListing || closingListing}
                      onToggleMenu={this.onToggleMenu}
                      onCloseListing={onCloseListing}
                      onOpenListing={onOpenListing}
                      hasOpeningError={openingErrorListingId?.uuid === l.id.uuid}
                      hasClosingError={closingErrorListingId?.uuid === l.id.uuid}
                      renderSizes={renderSizes}
                      onRelistListing={onRelistListing}
                    />
                  );
                })}

              </div>
              {paginationLinks}
            </div>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSingleColumn>
      </Page>
    );
  }
}

ManageListingsPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  queryListingsError: null,
  queryParams: null,
  closingListing: null,
  closingListingError: null,
  openingListing: null,
  openingListingError: null,
};

const { arrayOf, bool, func, object, shape, string } = PropTypes;

ManageListingsPageComponent.propTypes = {
  closingListing: shape({ uuid: string.isRequired }),
  closingListingError: shape({
    listingId: propTypes.uuid.isRequired,
    error: propTypes.error.isRequired,
  }),
  listings: arrayOf(propTypes.ownListing),
  onCloseListing: func.isRequired,
  onOpenListing: func.isRequired,
  openingListing: shape({ uuid: string.isRequired }),
  openingListingError: shape({
    listingId: propTypes.uuid.isRequired,
    error: propTypes.error.isRequired,
  }),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryListingsError: propTypes.error,
  queryParams: object,
  scrollingDisabled: bool.isRequired,

  // from injectIntl
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

const ManageListingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(ManageListingsPageComponent);

export default ManageListingsPage;