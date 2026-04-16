import React from 'react';
import { FormattedMessage } from 'react-intl';
import config from '../../../config';
import { formatMoney } from '../../../util/currency';
import { types as sdkTypes } from '../../../util/sdkLoader';
import css from './TransactionPanel.module.css';

const { Money } = sdkTypes;

const PendingOfferMessage = props => {
  const { transaction, intl } = props;
  const protectedData = transaction?.attributes?.protectedData;
  let proposedPriceAmount = protectedData?.proposedPriceAmount;

  const parsedProposedPriceAmount = parseFloat(proposedPriceAmount);
  if (isNaN(parsedProposedPriceAmount)) {
    if (protectedData?.offersHistory?.offersHistory?.length > 0) {
      let proposedFromHistory = protectedData?.offersHistory?.offersHistory[protectedData?.offersHistory?.offersHistory?.length - 1]?.offer;
      proposedPriceAmount = proposedFromHistory;
    }
  }
  //TODO temporary fix, better not allow to send non numbers


  const proposedPrice = new Money(proposedPriceAmount, config.currency);
  const formattedPrice = formatMoney(intl, proposedPrice);

  return (
    <div className={css.pendingOfferMessageWrapper}>
      <h1 css={css.richTitle} style={{
        fontFamily: 'hernandezbros',
        textTransform: 'uppercase',
      }}><FormattedMessage id="PendingOfferMessage.label"
        values={{ proposedPrice: formattedPrice }} /></h1>
    </div>
    // <div className={css.pendingOfferMessageWrapper}>
    //   <h1>
    //     <span className={css.mainTitle}>
    //       <FormattedMessage id="PendingOfferMessage.label" values={{ proposedPrice: formattedPrice }} />
    //     </span>
    //   </h1>
    // </div>
  );
};

export default PendingOfferMessage;
