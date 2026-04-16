import React, { useState } from 'react';
import { closeListing } from '../../containers/ManageListingsPage/ManageListingsPage.duck';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import css from './DeleteOrSaveDraftListingButton.module.css';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { createResourceLocatorString } from '../../util/routes';
import routeConfiguration from '../../routing/routeConfiguration';
import { createSlug } from '../../util/urlHelpers';

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

const DeleteOrSaveDraftListingButton = props => {
  const { listing, history, handleSaveFromModal, listingTitle, skipRedirect } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const isDraft = listing?.id && listing?.attributes?.state === LISTING_STATE_DRAFT;
  const freshListing = !listing?.id?.uuid;

  const closeListingMaybe = () => {
    if (isDraft || freshListing) {
      return Promise.resolve('cannot close a draft listing');
    } else {
      return sdk.ownListings.close({ id: listing.id }, { expand: true });
    }
  };
  const handleDeleteListing = () => {
    if (freshListing) {
      history.push(`/listings`);
    }

    return closeListingMaybe().then(resp => {
      return sdk.ownListings
        .update({
          id: listing.id,
          publicData: {
            deleted: true,
          },
        })
        .then(resp => {
          history.push(`/listings`);
        })
        .catch(e => {
          console.log(e);
        });
    });
  };

  const sendToListing = () => {
    history.push(
      createResourceLocatorString('ListingPage', routeConfiguration(), {
        id: listing.id.uuid,
        slug: createSlug(listing?.attributes?.title),
        state: listing?.attributes?.state,
      }),
      {
        noStripe: true,
      }
    );
  };

  const handleSaveFromModalFn = () => {
    setSaveLoading(true);
    if (listingTitle) {
      handleSaveFromModal();
    }
    if (skipRedirect) {
      setTimeout(() => {
        setSaveLoading(false);
        setModalOpen(false);
      }, 1000);
    } else {
      setTimeout(() => {
        history.push('/listings');
      }, 2000);
    }
  };
  return (
    <>
      <div
        className={css.buttonWrapper}
        onClick={() => {
          setModalOpen(true);
          if (typeof window !== 'undefined') {
            window.scrollBy(0, 200);
          }
        }}
      >
        x
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        onManageDisableScrolling={() => { }}
      >
        <div className={css.modalContent}>
          <Button type="button" onClick={handleSaveFromModalFn} inProgress={saveLoading}>
            Save & Close
          </Button>

          <p>Or</p>
          <Button type="button" onClick={handleDeleteListing}>
            Delete Listing
          </Button>

          <p>Or</p>
          <Button type="button" onClick={sendToListing} disabled={isDraft || freshListing}>
            View Listing
          </Button>
          {(isDraft || freshListing) && (
            <p className={css.infoText}>*Can only view published listings</p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default DeleteOrSaveDraftListingButton;
