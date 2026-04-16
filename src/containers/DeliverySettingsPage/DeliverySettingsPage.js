import React, { Component, useEffect } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { isScrollingDisabled } from '../../ducks/UI.duck';

import {
  Page,
  UserNav,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
  LayoutWrapperAccountSettingsSideNav,
  LayoutSideNavigation,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import DeliverySettingsForm from './DeliverySettingsForm/DeliverySettingsForm';

import { updateProfile, uploadImage } from './DeliverySettingsPage.duck';
import css from './DeliverySettingsPage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const onImageUploadHandler = (values, fn) => {
  const { id, imageId, file } = values;
  if (file) {
    fn({ id, imageId, file });
  }
};

export class DeliverySettingsPageComponent extends Component {
  componentDidMount() {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = window.location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }

  render() {
    const {
      currentUser,
      image,
      onImageUpload,
      onUpdateProfile,
      scrollingDisabled,
      updateInProgress,
      updateProfileError,
      uploadImageError,
      uploadInProgress,
      intl,
    } = this.props;


    const handleSubmit = async values => {
      const { firstName, lastName, bio: rawBio, profileImage, ...rest } = values;

      const {
        ups_addressLine1,
        ups_addressLine2,
        ups_city,
        ups_state,
        ups_zip,
        ups_country
      } = values;

      let upsAddressError = false;

      try {
        const resp = await post('/api/ups/verify-address', {
          address: {
            addressLine1: ups_addressLine1,
            addressLine2: ups_addressLine2,
            city: ups_city,
            state: ups_state,
            zipCode: ups_zip,
            country: ups_country,
          },
        });
        if (resp === 'Address is valid') {
          onUpdateProfile(updateValues);
          upsAddressError = false;
        } else {
          upsAddressError = true;
          //alert("UPS Address is not valid");
        }
      } catch (e) {
        //alert("UPS Address is not valid");
        upsAddressError = true;
        console.log(e);

        //alert("UPS Address is not valid");

      }

      // if upsAddressError is true, then do not update profile


      // Ensure that the optional bio is a string
      const bio = rawBio || '';

      const profile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio,
        publicData: {
          ...rest,
        },
      };
      const uploadedImage = this.props.image;

      // Update profileImage only if file system has been accessed
      const updatedValues =
        uploadedImage && uploadedImage.imageId && uploadedImage.file
          ? { ...profile, profileImageId: uploadedImage.imageId }
          : profile;

      onUpdateProfile(updatedValues);
    };

    const user = ensureCurrentUser(currentUser);
    const { firstName, lastName, bio } = user.attributes.profile;
    const profileImageId = user.profileImage ? user.profileImage.id : null;
    const profileImage = image || { imageId: profileImageId };
    const userPublicData = user?.attributes?.profile?.publicData;
    const deliverySettingsForm = user.id ? (
      <DeliverySettingsForm
        className={css.form}
        currentUser={currentUser}
        initialValues={{
          firstName,
          lastName,
          bio,
          profileImage: user.profileImage,
          ups_addressLine1: userPublicData?.ups_addressLine1,
          ups_addressLine2: userPublicData?.ups_addressLine2,
          ups_city: userPublicData?.ups_city,
          ups_state: userPublicData?.ups_state,
          ups_zip: userPublicData?.ups_zip,
          ups_country: 'US', //userPublicData?.ups_country,
        }}
        profileImage={profileImage}
        onImageUpload={e => onImageUploadHandler(e, onImageUpload)}
        uploadInProgress={uploadInProgress}
        updateInProgress={updateInProgress}
        uploadImageError={uploadImageError}
        updateProfileError={updateProfileError}
        onSubmit={handleSubmit}
      />
    ) : null;

    const title = intl.formatMessage({ id: 'DeliverySettingsPage.title' });

    return (
      <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation>
          <LayoutWrapperTopbar>
            <TopbarContainer currentPage="DeliverySettingsPage" />
            {/* <UserNav selectedPageName="DeliverySettingsPage" /> */}
            <UserNav selectedPageName="ContactDetailsPage" />
          </LayoutWrapperTopbar>
          <LayoutWrapperAccountSettingsSideNav currentTab="DeliverySettingsPage" />

          <LayoutWrapperMain>
            <div className={css.content}>
              <div className={css.headingContainer}>
                <h1 className={css.heading}>
                  <FormattedMessage id="DeliverySettingsPage.heading" />
                </h1>
              </div>
              {deliverySettingsForm}
            </div>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSideNavigation>
      </Page>
    );
  }
}

DeliverySettingsPageComponent.defaultProps = {
  currentUser: null,
  uploadImageError: null,
  updateProfileError: null,
  image: null,
};

const { bool, func, object, shape, string } = PropTypes;

DeliverySettingsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  image: shape({
    id: string,
    imageId: propTypes.uuid,
    file: object,
    uploadedImage: propTypes.image,
  }),
  onImageUpload: func.isRequired,
  onUpdateProfile: func.isRequired,
  scrollingDisabled: bool.isRequired,
  updateInProgress: bool.isRequired,
  updateProfileError: propTypes.error,
  uploadImageError: propTypes.error,
  uploadInProgress: bool.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    image,
    uploadImageError,
    uploadInProgress,
    updateInProgress,
    updateProfileError,
  } = state.DeliverySettingsPage;
  return {
    currentUser,
    image,
    scrollingDisabled: isScrollingDisabled(state),
    updateInProgress,
    updateProfileError,
    uploadImageError,
    uploadInProgress,

  };
};

const mapDispatchToProps = dispatch => ({
  onImageUpload: data => dispatch(uploadImage(data)),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

const DeliverySettingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(DeliverySettingsPageComponent);

export default DeliverySettingsPage;
