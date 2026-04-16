import React from 'react';
import classNames from 'classnames';
import config from '../../../config';
import { AvatarMedium, AspectRatioWrapper, ResponsiveImage } from '../../../components';
import css from './TransactionPanel.module.css';
import { createSlug } from '../../../util/urlHelpers';
import { useOrderPage } from '../../../Context/OrderPageProvider';
const DetailCardImage = props => {
  const {
    className,
    rootClassName,
    avatarWrapperClassName,
    listingTitle,
    image,
    provider,
    isCustomer,
    listingId,
    isDisabled,
    item,
    ListPrice,
    DateOfSale,
    SoldPrice,
    ReGEMFee,
    payoutAmount,
    PayVia,
    pocketListing,
  } = props;

  const classes = classNames(rootClassName || css.detailCardImageWrapper, className);
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
  const variants = image
    ? Object.keys(image?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];
  const listingSlug = createSlug(listingTitle || 'test');
  const { setOrderData } = useOrderPage(); // Use the context
  const slugify = str =>
    str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with dashes
  const slug = slugify(listingTitle || 'offline-order');
  const handleRedirect = event => {
    event.preventDefault(); // Prevent default anchor tag behavior (no URL change)

    // Create the orderData object directly
    const orderData = {
      item: props.item,
      ListPrice: props.ListPrice,
      DateOfSale: props.DateOfSale,
      SoldPrice: props.SoldPrice,
      ReGEMFee: props.ReGEMFee,
      payoutAmount: props.payoutAmount,
      PayVia: props.PayVia,
      image: props.image,
      pocketListing: props.pocketListing,
    };

    // Set the data to be passed to the OfflineOrderPage context
    setOrderData(orderData);

    // Save it to sessionStorage
    sessionStorage.setItem('orderData', JSON.stringify(orderData));

    // Manually redirect to the target page without changing URL
    window.location.href = `/offline-orders/${listingId}/${slug}`;
  };

  return (
    <React.Fragment>
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight} className={classes}>
        {isDisabled ? (
          <a href="#" onClick={handleRedirect}>
            <ResponsiveImage
              rootClassName={css.rootForImage}
              alt={listingTitle}
              image={image}
              variants={variants}
            />
          </a>
        ) : (
          <a href={`/l/${listingSlug}/${listingId}`}>
            <ResponsiveImage
              rootClassName={css.rootForImage}
              alt={listingTitle}
              image={image}
              variants={variants}
            />
          </a>
        )}
      </AspectRatioWrapper>
      {isCustomer ? (
        <div className={avatarWrapperClassName || css.avatarWrapper}>
          <AvatarMedium user={provider} />
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default DetailCardImage;
