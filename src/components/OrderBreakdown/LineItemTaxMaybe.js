import React from 'react';
import { bool, string } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoneyWithDecimals } from '../../util/currency';
import {
  LINE_ITEM_TAX,
  LINE_ITEM_SHIPPING_FEE,
  LINE_ITEM_PICKUP_FEE,
  LINE_ITEM_CUSTOMER_COMMISSION,
  LINE_ITEM_PROVIDER_COMMISSION,
  propTypes,
} from '../../util/types';

import css from './OrderBreakdown.module.css';

const CALIFORNIA_TAX_RATE = 0.0975;
const CALIFORNIA_STATE_CODE = 'CA';

const getAmountInMinorUnits = money => {
  if (!money || money.amount == null) return 0;
  const amount = money.amount;
  return typeof amount === 'number' ? amount : parseInt(String(amount), 10);
};

/** Sum line total for items only (exclude shipping, tax, commissions). Used for CA tax base. */
const getItemSubtotalFromLineItems = (lineItems, excludeCodes = []) => {
  if (!lineItems?.length) return { amount: 0, currency: null };
  const defaultExclude = [
    LINE_ITEM_TAX,
    LINE_ITEM_SHIPPING_FEE,
    LINE_ITEM_PICKUP_FEE,
    LINE_ITEM_CUSTOMER_COMMISSION,
    LINE_ITEM_PROVIDER_COMMISSION,
  ];
  const exclude = [...defaultExclude, ...(excludeCodes || [])];
  let amount = 0;
  let currency = null;
  lineItems.forEach(item => {
    if (item.reversal || exclude.includes(item.code)) return;
    amount += getAmountInMinorUnits(item.lineTotal);
    if (!currency && item.lineTotal) currency = item.lineTotal.currency;
  });
  return { amount, currency };
};

/** Returns tax amount { amount, currency } when shipping to CA (tax on item price only, not shipping), or null */
export const getCaliforniaTaxAmount = transaction => {
  const lineItems = transaction?.attributes?.lineItems;
  if (!lineItems?.length) return null;
  const itemSubtotal = getItemSubtotalFromLineItems(lineItems);
  if (!itemSubtotal.currency || itemSubtotal.amount <= 0) return null;
  const taxMinor = Math.round(itemSubtotal.amount * CALIFORNIA_TAX_RATE);
  if (taxMinor <= 0) return null;
  return { amount: taxMinor, currency: itemSubtotal.currency };
};

/** Returns total with tax for CA: item_subtotal + shipping + tax (for display / button). */
export const getCaliforniaTotalWithTax = transaction => {
  const lineItems = transaction?.attributes?.lineItems;
  if (!lineItems?.length) return null;
  const itemSubtotal = getItemSubtotalFromLineItems(lineItems);
  const shippingItem = lineItems.find(
    i => (i.code === 'line-item/shipping-fee' || i.code === 'line-item/pickup-fee') && !i.reversal
  );
  const shippingMinor = shippingItem ? getAmountInMinorUnits(shippingItem.lineTotal) : 0;
  const taxMoney = getCaliforniaTaxAmount(transaction);
  const taxMinor = taxMoney ? taxMoney.amount : 0;
  const totalMinor = itemSubtotal.amount + shippingMinor + taxMinor;
  if (!itemSubtotal.currency || totalMinor <= 0) return null;
  return { amount: totalMinor, currency: itemSubtotal.currency };
};

const LineItemTaxMaybe = props => {
  const { lineItems, isCustomer, intl, transaction, shippingState } = props;

  if (!isCustomer) {
    return null;
  }

  // Prefer tax from backend line items (order breakdown after checkout)
  const taxLineItem = lineItems.find(
    item => item.code === LINE_ITEM_TAX && !item.reversal
  );

  if (taxLineItem) {
    return (
      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <FormattedMessage id="OrderBreakdown.tax" />
        </span>
        <span className={css.itemValue}>{formatMoneyWithDecimals(intl, taxLineItem.lineTotal)}</span>
      </div>
    );
  }

  // Sales breakdown during checkout: show computed tax when state is CA
  if (shippingState === CALIFORNIA_STATE_CODE && transaction) {
    const taxMoney = getCaliforniaTaxAmount(transaction);
    if (taxMoney) {
      return (
        <div className={css.lineItem}>
          <span className={css.itemLabel}>
            <FormattedMessage id="OrderBreakdown.tax" />
          </span>
          <span className={css.itemValue}>{formatMoneyWithDecimals(intl, taxMoney)}</span>
        </div>
      );
    }
  }

  return null;
};

LineItemTaxMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  isCustomer: bool.isRequired,
  intl: intlShape.isRequired,
  transaction: propTypes.transaction,
  shippingState: string,
};

export default LineItemTaxMaybe;
