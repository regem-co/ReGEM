import React from 'react';
import config from '../../../config';
import { formatMoney } from '../../../util/currency';
import { types as sdkTypes } from '../../../util/sdkLoader';

import css from './ShoppingCartItemsSection.module.css';
import { findLabel, getImageUrl } from './utils';

const { Money } = sdkTypes;

const ShoppingCartItemsSection = props => {
  const { orderData, currentListing, firstImage, intl } = props;

  const restOfShoppingCartItems = orderData?.restOfShoppingCartItems || [];
  //   title, image, quantity, pricePerItem, category, condition
  const mainListingObject = {
    title: currentListing?.attributes?.title,
    image: getImageUrl(firstImage),
    quantity: orderData.quantity,
    pricePerItem: formatMoney(
      intl,
      new Money(currentListing?.attributes?.price?.amount || 0, config.currency)
    ),
    category: currentListing?.attributes?.publicData?.category,
    condition: currentListing?.attributes?.publicData?.condition,
  };

  const convertedRestOfShoppingCartItems = restOfShoppingCartItems.map(item => {
    const listing = item.listing;
    const quantity = item.checkoutValues?.quantity;

    const image = listing.images[0];
    return {
      title: listing?.attributes?.title,
      image: getImageUrl(image),
      quantity: quantity,
      pricePerItem: formatMoney(
        intl,
        new Money(listing?.attributes?.price?.amount || 0, config.currency)
      ),
      category: listing?.attributes?.publicData?.category,
      condition: listing?.attributes?.publicData?.condition,
    };
  });
  const finalShoppingCartItems = [mainListingObject, ...convertedRestOfShoppingCartItems];
  return (
    <div className={css.wrapper}>
      <h2 className={css.title}>My Order</h2>
      {finalShoppingCartItems.map((item, index) => {
        return (
          <div className={css.cardContainer} key={index}>
            <img className={css.cardImage} src={item.image} alt={item.title} />
            <div className={css.cardContent}>
              <h3 className={css.cardTitle}>{item.title}</h3>
              <div className={css.cardDetails}>
                {/* <p className={css.cardQuantity}>Quantity: {item.quantity}</p> */}
                <p className={css.cardPrice}>Price: {item.pricePerItem}</p>
                <p className={css.cardCategory}>Category: {findLabel('category', item.category)}</p>
                <p className={css.cardCondition}>
                  Condition: {findLabel('condition', item.condition)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShoppingCartItemsSection;
