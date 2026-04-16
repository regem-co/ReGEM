import React from 'react';
import { bool, number, shape, string } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoneyWithDecimals } from '../../util/currency';
import { txIsCanceled, txIsReceived, txIsCompleted } from '../../util/transaction';
import { propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const getAmountInMinorUnits = money => {
  if (!money || money.amount == null) return 0;
  const amount = money.amount;
  return typeof amount === 'number' ? amount : parseInt(String(amount), 10);
};

const taxAmountPropType = shape({
  amount: number.isRequired,
  currency: string.isRequired,
});

const LineItemTotalPrice = props => {
  const { transaction, isProvider, intl, taxAmount } = props;

  let providerTotalMessageId = 'OrderBreakdown.providerTotalDefault';
  if (txIsReceived(transaction) || txIsCompleted(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalReceived';
  } else if (txIsCanceled(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalCanceled';
  }

  const totalLabel = isProvider ? (
    <FormattedMessage id={providerTotalMessageId} />
  ) : (
    <FormattedMessage id="OrderBreakdown.total2" />
  );

  let totalPrice = isProvider
    ? transaction.attributes.payoutTotal
    : transaction.attributes.payinTotal;

  // Sales breakdown: when customer has CA tax computed client-side, show total + tax
  if (!isProvider && taxAmount && totalPrice) {
    const payinMinor = getAmountInMinorUnits(totalPrice);
    const taxMinor = getAmountInMinorUnits(taxAmount);
    totalPrice = {
      amount: payinMinor + taxMinor,
      currency: totalPrice.currency,
    };
  }

  const formattedTotalPrice = formatMoneyWithDecimals(intl, totalPrice);

  return (
    <>
      <hr className={css.totalDivider} />
      <div className={css.lineItemTotal}>
        <div className={css.totalLabel}>{totalLabel}</div>
        <div className={css.itemValue}>{formattedTotalPrice}</div>
      </div>
    </>
  );
};

LineItemTotalPrice.propTypes = {
  transaction: propTypes.transaction.isRequired,
  isProvider: bool.isRequired,
  intl: intlShape.isRequired,
  taxAmount: taxAmountPropType,
};

export default LineItemTotalPrice;
