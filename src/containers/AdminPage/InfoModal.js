import React from 'react';
import { Modal, NamedLink } from '../../components';
import InfoBox from '../TransactionPage/TransactionPanel/InfoBox/InfoBox';
import css from './AdminPage.module.css';

function InfoModal(props) {
  const { isOpen, setIsOpen, focusedTransaction, setFocusedTransaction, createSlug } = props;

  if (!focusedTransaction) {
    return null;
  }

  const listingTitle = focusedTransaction?.listing?.attributes?.title;
  const slug = createSlug(focusedTransaction.listing.attributes.title || '');
  const listingId = focusedTransaction.listing.id.uuid;
  const protectedData = focusedTransaction.attributes.protectedData;
  const metadata = focusedTransaction.attributes.metadata;
  const txId = focusedTransaction.id.uuid;
  return (
    <div className={css.modalWrapper}>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setFocusedTransaction(null);
        }}
        onManageDisableScrolling={() => {}}
      >
        {focusedTransaction && (
          <div className={css.modalContent}>
            <h2>
              <NamedLink name="ListingPage" params={{ slug, id: listingId }}>
                {listingTitle}
              </NamedLink>
            </h2>

            <InfoBox
              protectedData={protectedData}
              metadata={metadata}
              txId={txId}
              hideWaitingText={true}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InfoModal;
