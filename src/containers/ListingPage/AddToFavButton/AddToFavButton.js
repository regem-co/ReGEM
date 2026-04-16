import React, { useState, useEffect } from 'react';
import css from './AddToFavButton.module.css';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import FavoriteIcon from '@material-ui/icons/Favorite';
import { withRouter } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchCurrentUser } from '../../../ducks/user.duck';

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

const AddToFavButtonComponent = props => {
  const { listingIdObj, position, currentUser, isOwnListing, history, onUpdateCurrentUser } = props;

  if (isOwnListing) {
    return null;
  }
  const listingId = listingIdObj.uuid;
  const [isFavourite, setIsFavourite] = useState(false);
  const [favListingsArray, setFavListingsArray] = useState([]);

  useEffect(() => {
    if (currentUser?.id?.uuid) {
      if (
        currentUser.attributes.profile.privateData &&
        currentUser.attributes.profile.privateData.favListingsArray
      ) {
        setFavListingsArray(currentUser.attributes.profile.privateData.favListingsArray);
        const listingsIdsArray = currentUser.attributes.profile.privateData.favListingsArray;
        const isFavourite = listingsIdsArray.find(id => {
          return id === listingId;
        });
        if (isFavourite) {
          setIsFavourite(true);
        }
      }
    }
  }, [currentUser?.id?.uuid]);

  const addToFavourites = action => {
    if (!currentUser?.id?.uuid) {
      return history.push('/login');
    }
    if (!listingIdObj || !currentUser?.id?.uuid) {
      return null;
    }
    return sdk.currentUser
      .show()
      .then(res => {
        const currentFavListings =
          res?.data?.data?.attributes?.profile?.privateData?.favListingsArray || [];

        if (action === 'add') {
          return sdk.currentUser
            .updateProfile({
              privateData: {
                favListingsArray: [...currentFavListings, listingId],
              },
            })
            .then(resp => {
              onUpdateCurrentUser();
              return setIsFavourite(true);
            })
            .catch(e => console.log(e));
        } else {
          const newFavListings = [...currentFavListings].filter(id => id !== listingId);

          return sdk.currentUser
            .updateProfile({
              privateData: {
                favListingsArray: newFavListings,
              },
            })
            .then(resp => {
              onUpdateCurrentUser();
              return setIsFavourite(false);
            })
            .catch(e => console.log(e));
        }
      })
      .catch(e => console.log(e));
  };

  const isLeftPositioned = position === 'left';
  return (
    <div className={isLeftPositioned ? css.favButtonWrapperLeft : css.favButtonWrapper}>
      {!isFavourite ? (
        <FavoriteBorderIcon
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            addToFavourites('add');
          }}
          className={css.favButtonNotSelected}
        />
      ) : (
        <FavoriteIcon
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            addToFavourites('remove');
          }}
          className={css.favButtonSelected}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => ({
  onUpdateCurrentUser: () => dispatch(fetchCurrentUser())
});

const AddToFavButton = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(AddToFavButtonComponent);

export default AddToFavButton;
