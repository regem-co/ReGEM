import React from 'react';
import { bool } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { txIsCanceled, txIsReceived, txIsCompleted } from '../../util/transaction';
import { propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemPaidVia = props => {
  const { transaction, isProvider, intl } = props;

  let providerTotalMessageId = 'OrderBreakdown.providerPaidVia';
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

  // const PayVia = transaction?.attributes?.metadata?.payVia;


  return (
    <>
      <hr className={css.totalDivider} />
      <div className={css.lineItemTotal}>
        <div className={css.totalLabel}>{totalLabel}</div>
        <div className={css.itemValue}>Stripe</div>
      </div>
    </>
  );
};

LineItemPaidVia.propTypes = {
  transaction: propTypes.transaction.isRequired,
  isProvider: bool.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemPaidVia;
