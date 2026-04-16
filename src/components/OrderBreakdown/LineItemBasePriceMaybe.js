import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoneyWithDecimals } from '../../util/currency';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';
import { createSlug } from '../../util/urlHelpers';
import NamedLink from '../NamedLink/NamedLink';

const LineItemBasePriceMaybe = props => {
  const { lineItems, unitType, intl, transaction, listing } = props;
  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isDaily = unitType === LINE_ITEM_DAY;
  const translationKey = isNightly
    ? 'OrderBreakdown.baseUnitNight'
    : isDaily
      ? 'OrderBreakdown.baseUnitDay'
      : 'OrderBreakdown.baseUnitQuantity';

  // Find correct line-item for given unitType prop.
  // It should be one of the following: 'line-item/night, 'line-item/day', 'line-item/units', or 'line-item/time'
  // These are defined in '../../util/types';
  const unitPurchase = lineItems.find(item => item.code === unitType && !item.reversal);

  const quantity = unitPurchase ? unitPurchase.quantity.toString() : null;
  const unitPrice = unitPurchase ? formatMoneyWithDecimals(intl, unitPurchase.unitPrice) : null;
  const total = unitPurchase ? formatMoneyWithDecimals(intl, unitPurchase.lineTotal) : null;
  const baseListing = transaction?.listing ? transaction?.listing : listing;

  const listingSlug = createSlug(listing?.attributes?.title || 'test');

  return quantity && total ? (
    <>
      {/* <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <a href={`/l/${baseListing?.attributes.title.replace(' ', '-')}/${baseListing?.id.uuid}`}>
            {baseListing?.attributes.title}
          </a>
        </span>
      </div> */}

      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          {/* {baseListing ? (
            <FormattedMessage id={translationKey} values={{ unitPrice, quantity }} />
          ) : (
            <span>Price</span>
          )} */}
          <span>
            {' '}
            {/* {baseListing ? (
              <a
                href={`/l/${baseListing?.attributes.title.replace(' ', '-')}/${baseListing?.id.uuid
                  }`}
              >
                {baseListing?.attributes.title}
              </a>
            ) : ( */}
            {/* <span>{listing?.attributes?.title}</span> */}
            <NamedLink name="ListingPage" params={{ id: listing?.id?.uuid, slug: listingSlug }}>
              {listing?.attributes?.title}
            </NamedLink>
            {/* )} */}
          </span>
        </span>
        <span className={css.itemValue}>{total}</span>
      </div>
    </>
  ) : null;
};

LineItemBasePriceMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  unitType: propTypes.lineItemUnitType.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemBasePriceMaybe;
