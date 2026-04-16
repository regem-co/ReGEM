import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PrimaryButton, SecondaryButton, Button } from '../../../components';
import css from './TransactionPanel.module.css';

const PendingOfferActionButtons = props => {
  const { onAcceptOfferByProvider, onDeclineOfferByProvider,
    onAcceptOfferByCustomer, onDeclineOfferByCustomer,
    onMakeOfferByCustomer,
    onMakeOfferByProvider,
    showCustomerButtons, showProviderButtons } = props;

  if (showProviderButtons) {
    return (
      <div className={css.pendingOfferActionButtonsWrapper}>
        <Button onClick={onAcceptOfferByProvider} className={css.pendingOfferActionButton}>
          <FormattedMessage id="PendingOfferActionButtons.acceptButtomMessage" />
        </Button>
        <SecondaryButton onClick={onMakeOfferByProvider} className={css.pendingOfferActionButton}>
          {/* <FormattedMessage id="PendingOfferActionButtons.declineButtomMessage" /> */}
          Counter offer
        </SecondaryButton>
      </div>
    );
  } else if (showCustomerButtons) {
    return (
      <div className={css.pendingOfferActionButtonsWrapper}>
        <Button onClick={onAcceptOfferByCustomer} className={css.pendingOfferActionButton}>
          <FormattedMessage id="PendingOfferActionButtons.acceptButtomMessage" />
        </Button>
        <SecondaryButton onClick={onMakeOfferByCustomer} className={css.pendingOfferActionButton}>
          {/* <FormattedMessage id="PendingOfferActionButtons.declineButtomMessage" /> */}
          Counter offer
        </SecondaryButton>
      </div>
    );
  } else {
    return null;
  }
};

export default PendingOfferActionButtons;
