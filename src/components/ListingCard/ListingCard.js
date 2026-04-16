import React, { Component } from 'react';
import { string, func, bool } from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import classNames from 'classnames';
import { lazyLoadWithDimensions } from '../../util/contextHelpers';
import { LINE_ITEM_DAY, LINE_ITEM_NIGHT, propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import config from '../../config';
import { AspectRatioWrapper, NamedLink, ResponsiveImage } from '../../components';
import Rating from '@mui/material/Rating';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import css from './ListingCard.module.css';
import './rating.css';
import noProfileImage from './images/noProfile.webp';
import VerifiedIcon from '@mui/icons-material/Verified';
import AddToFavButton from '../../containers/ListingPage/AddToFavButton/AddToFavButton';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import getCleanValue from '../../util/getCleanValue';
const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, intl) => {
  if (price && price.currency === config.currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

class ListingImage extends Component {
  render() {
    return <ResponsiveImage {...this.props} />;
  }
}
const LazyImage = lazyLoadWithDimensions(ListingImage, { loadAfterInitialRendering: 3000 });

export const ListingCardComponent = props => {
  const {
    className,
    rootClassName,
    intl,
    listing,
    renderSizes,
    showAuthorInfo,
    hideStamp,
    index,
    filtersConfig,
    setActiveListing,
    favListings,
    listingExpanded,
    justFetchedCurrentUser,
  } = props;
  const currentUser = justFetchedCurrentUser || props.currentUser;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price } = currentListing.attributes;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const itemattributes = ensureUser(listing.attributes);
  const authorName = author.attributes.profile.displayName;
  const itemBadge = itemattributes.publicData.badge;
  const imagesOrder = listing?.attributes?.publicData?.imagesOrder;
  const firstChosenImageId =
    Array.isArray(imagesOrder) && imagesOrder?.length > 0 && imagesOrder[0]?.id;

  const firstImageBasic =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const firstImage = firstChosenImageId
    ? currentListing.images && currentListing.images.length > 0
      ? currentListing.images.find(img => img?.id?.uuid === firstChosenImageId) || firstImageBasic
      : firstImageBasic
    : firstImageBasic;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(
        k => k.startsWith(variantPrefix) || k.startsWith('landscape-crop')
      )
    : [];

  const { formattedPrice, priceTitle } = priceData(price, intl);
  const unitType = config.lineItemUnitType;
  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isDaily = unitType === LINE_ITEM_DAY;

  const unitTranslationKey = isNightly
    ? 'ListingCard.perNight'
    : isDaily
    ? 'ListingCard.perDay'
    : 'ListingCard.perUnit';

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  const category =
    currentListing?.attributes?.publicData?.category === 'extras'
      ? 'more'
      : currentListing?.attributes?.publicData?.category;

  function generateSingleDigit() {
    return Math.floor(Math.random() * 24) + 2;
  }

  const authorProfileImageUrl =
    (author?.profileImage?.attributes?.variants &&
      author?.profileImage?.attributes?.variants['listing-card-2x']?.url) ||
    author?.profileImage?.attributes?.variants['square-small2x']?.url;

  const authorPublicData = author?.attributes?.profile?.publicData;

  let badge = authorPublicData?.badge;
  // const isTrustedSeller = badge === 'trusted_seller';
  // const isExpertSeller = badge === 'expert_seller';

  // ##########TODO Delete this
  // if (index === 0) {
  //   badge = 'trusted_seller';
  // }

  // if (index === 1) {
  //   badge = 'expert_seller';
  // }

  // if (index === 2) {
  //   badge = 'charity';
  // }
  // #####################

  const sellerBadge = badge => {
    if (!badge) {
      return null;
    }

    if (badge === 'trusted_seller') {
      return (
        <div className={itemBadge ? css.badgeWrapper1: css.badgeWrapper}>
          <VerifiedIcon /> Trusted seller
        </div>
      );
    }

    if (badge === 'brand_partner') {
      return (
        <div className={css.badgeWrapper}>
          <VerifiedIcon /> Brand partner
        </div>
      );
    }

    if (badge === 'expert_seller') {
      return (
        <div className={itemBadge ? css.badgeWrapper1: css.badgeWrapper}>
          {' '}
          <VerifiedIcon /> Expert seller
        </div>
      );
    }

    if (badge === 'charity') {
      return (
        <div className={itemBadge ? css.badgeWrapper1: css.badgeWrapper}>
          {' '}
          <VerifiedIcon /> Charity
        </div>
      );
    }

    return null;
  };

  const isOwnListing = currentListing?.author?.id?.uuid === currentUser?.id?.uuid;
  const isSold =
  currentListing?.currentStock?.attributes?.quantity === 0 ||
  getCleanValue(currentListing?.attributes?.publicData, 'sold') ||
  getCleanValue(currentListing?.attributes?.metadata, 'pocketListing');


  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      {isSold && (
        <div className={css.soldOverlay}>
          <p className={css.soldLabel}>SOLD</p>
        </div>
      )}
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        {itemBadge ? null : sellerBadge(badge)}

        <AddToFavButton
          listingIdObj={currentListing?.id}
          position={'right'}
          currentUser={currentUser}
          isOwnListing={isOwnListing}
        />

        <LazyImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
          sizes={renderSizes}
        />
        {!hideStamp && (
          <div className={css.lastSeenDesktop}>
            <AccessTimeIcon fontSize="small" />
            Seen {generateSingleDigit()} times in the last hour
          </div>
        )}
      </AspectRatioWrapper>
      <div className={css.info}>
        <p className={css.category}>{category}</p>

        <div className={css.mainInfo}>
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
          {/* {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          ) : null} */}
        </div>
        {itemBadge && (
          <div className={css.badgeWrapper}>
            <StarIcon />
            {itemBadge}
          </div>
        )}

        <div className={css.listingCardBottom}>
          <div className={css.authorWrapper}>
            <img src={authorProfileImageUrl || noProfileImage} className={css.authorIcon} />
            <div className={css.authorInfo}>
              <span className={css.authorName}>{authorName}</span>
              <Rating name="read-only" size="small" value={0} readOnly />
            </div>
          </div>
          <div className={css.price}>
            <div className={css.priceValue} title={priceTitle}>
              {formattedPrice}
            </div>
            {config.listing.showUnitTypeTranslations ? (
              <div className={css.perUnit}>
                <FormattedMessage id={unitTranslationKey} />
              </div>
            ) : null}
          </div>
        </div>

        {!hideStamp && (
          <div className={css.lastSeenMobile}>
            <AccessTimeIcon fontSize="small" />
            Seen {generateSingleDigit()} times in the last hour
          </div>
        )}
      </div>
    </NamedLink>
  );
};

ListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  setActiveListing: null,
  showAuthorInfo: true,
};

ListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,
  showAuthorInfo: bool,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return {
    currentUser,
  };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ListingCard = compose(
  connect(mapStateToProps),
  injectIntl
)(ListingCardComponent);

export default injectIntl(ListingCard);
