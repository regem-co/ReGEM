/**
 * Renders non-reversal line items that are not listed in the
 * `LINE_ITEMS` array in util/types.js
 *
 * The line items are rendered so that the line item code is formatted to human
 * readable form and the line total is printed as price.
 *
 * If you require another kind of presentation for your line items, add them to
 * the `LINE_ITEMS` array in util/types.js and create a specific line item
 * component for them that can be used in the `OrderBreakdown` component.
 */
import React from 'react';
import { intlShape, FormattedMessage } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { humanizeLineItemCode } from '../../util/data';
import { LINE_ITEMS, propTypes } from '../../util/types';
import css from './OrderBreakdown.module.css';

const LineItemUnknownItemsMaybe = props => {
  const { lineItems, isProvider, intl, transaction, restOfShoppingCartItems, listing } = props;

  // resolve unknown non-reversal line items
  const allItems = lineItems.filter(item => LINE_ITEMS.indexOf(item.code) === -1 && !item.reversal);
  // const baseListing = transaction?.listing ? transaction?.listing : listing;
  const items = isProvider
    ? allItems.filter(item => item.includeFor.includes('provider'))
    : allItems.filter(item => item.includeFor.includes('customer'));

  return items.length > 0 ? (
    <React.Fragment>
      {items.map((item, i) => {
        const quantity = item.quantity;

        const label =
          quantity && quantity > 1
            ? `${humanizeLineItemCode(item.code)} x ${quantity}`
            : humanizeLineItemCode(item.code);

        const formattedTotal = formatMoney(intl, item.lineTotal);
        const formattedUnit = formatMoney(intl, item.unitPrice);

        // const isBaseItem = baseListing?.attributes.price.amount === item.unitPrice.amount;
        const shoppingCartItem = restOfShoppingCartItems?.find(x => {
          return x.listing.id.uuid === item.code?.replace('line-item/', '');
        });

        return (
          <>
            <div className={css.lineItem}>
              <span className={css.itemLabel}>
                {/* {isBaseItem ?
                    <a href={`/l/${baseListing?.attributes.title.replace(' ','-')}/${baseListing?.id.uuid}`}>{baseListing?.attributes.title}</a>
                    : */}
                <a
                  href={`/l/${shoppingCartItem?.listing?.attributes?.title.replace(' ', '-')}/${
                    shoppingCartItem?.listing.id?.uuid
                  }`}
                >
                  {shoppingCartItem?.listing.attributes?.title}
                </a>
                {/* } */}
              </span>
            </div>
            <div className={css.lineItem}>
              <span className={css.itemLabel}>
                Item{' '}
                {/* <FormattedMessage id="BookingBreakdown.productUnit" values={{ quantity, formattedUnit }}/> */}
              </span>
              <span className={css.itemValue}>
                <FormattedMessage id="BookingBreakdown.productTotal" values={{ formattedTotal }} />
              </span>
            </div>
          </>
        );
      })}
    </React.Fragment>
  ) : null;
};

LineItemUnknownItemsMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemUnknownItemsMaybe;
