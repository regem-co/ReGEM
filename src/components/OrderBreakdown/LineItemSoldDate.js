import React from 'react';
import { bool } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { txIsCanceled, txIsReceived, txIsCompleted } from '../../util/transaction';
import { propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemSoldDate = props => {
  const { transaction, isProvider, intl } = props;
  console.log('transaction', transaction);
  const transitions = transaction.attributes.transitions;

  let confirmPaymentDate = null;

  for (const transition of transitions) {
    if (transition.transition === 'transition/confirm-payment') {
      confirmPaymentDate = transition.createdAt;
      break;
    }
  }
  const date = new Date(confirmPaymentDate);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  console.log("Formatted Confirm Payment Date:", formattedDate); // e.g. "26 Jan 2025"

  let providerTotalMessageId = 'OrderBreakdown.providerSaleDate';
  if (txIsReceived(transaction) || txIsCompleted(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalReceived';
  } else if (txIsCanceled(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalCanceled';
  }

  // const totalLabel = isProvider ? (
  //   <FormattedMessage id={providerTotalMessageId} />
  // ) : (
  //   <FormattedMessage id="OrderBreakdown.total2" />
  // );

  const totalLabel =
    <FormattedMessage id={providerTotalMessageId} />
    ;

  return (
    <>
      <hr className={css.totalDivider} />
      <div className={css.lineItemTotal}>
        <div className={css.totalLabel}>{totalLabel}</div>
        <div className={css.itemValue}>{formattedDate}</div>
      </div>
    </>
  );
};

LineItemSoldDate.propTypes = {
  transaction: propTypes.transaction.isRequired,
  isProvider: bool.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemSoldDate;
