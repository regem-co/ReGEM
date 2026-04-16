import React, { Component } from 'react';
import { bool, string } from 'prop-types';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { ensureCurrentUser } from '../../../util/data';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { isUploadImageOverLimitError } from '../../../util/errors';

import {
  Form,
  Avatar,
  Button,
  ImageFromFile,
  IconSpinner,
  FieldTextInput,
} from '../../../components';

import css from './DeliverySettingsForm.module.css';

const ACCEPT_IMAGES = 'image/*';
const UPLOAD_CHANGE_DELAY = 2000; // Show spinner so that browser has time to load img srcset

class DeliverySettingsFormComponent extends Component {
  constructor(props) {
    super(props);

    this.uploadDelayTimeoutId = null;
    this.state = { uploadDelay: false };
    this.submittedValues = {};
  }

  componentDidUpdate(prevProps) {
    // Upload delay is additional time window where Avatar is added to the DOM,
    // but not yet visible (time to load image URL from srcset)
    if (prevProps.uploadInProgress && !this.props.uploadInProgress) {
      this.setState({ uploadDelay: true });
      this.uploadDelayTimeoutId = window.setTimeout(() => {
        this.setState({ uploadDelay: false });
      }, UPLOAD_CHANGE_DELAY);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.uploadDelayTimeoutId);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={fieldRenderProps => {
          const {
            className,
            currentUser,
            handleSubmit,
            intl,
            invalid,
            onImageUpload,
            pristine,
            profileImage,
            rootClassName,
            updateInProgress,
            updateProfileError,
            uploadImageError,
            uploadInProgress,
            form,
            values,
          } = fieldRenderProps;

          const user = ensureCurrentUser(currentUser);

          // First name
          const firstNameLabel = intl.formatMessage({
            id: 'DeliverySettingsForm.firstNameLabel',
          });
          const firstNamePlaceholder = intl.formatMessage({
            id: 'DeliverySettingsForm.firstNamePlaceholder',
          });
          const firstNameRequiredMessage = intl.formatMessage({
            id: 'DeliverySettingsForm.firstNameRequired',
          });
          const firstNameRequired = validators.required(firstNameRequiredMessage);

          // Last name
          const lastNameLabel = intl.formatMessage({
            id: 'DeliverySettingsForm.lastNameLabel',
          });
          const lastNamePlaceholder = intl.formatMessage({
            id: 'DeliverySettingsForm.lastNamePlaceholder',
          });
          const lastNameRequiredMessage = intl.formatMessage({
            id: 'DeliverySettingsForm.lastNameRequired',
          });
          const lastNameRequired = validators.required(lastNameRequiredMessage);

          // Bio
          const bioLabel = intl.formatMessage({
            id: 'DeliverySettingsForm.bioLabel',
          });
          const bioPlaceholder = intl.formatMessage({
            id: 'DeliverySettingsForm.bioPlaceholder',
          });

          const uploadingOverlay =
            uploadInProgress || this.state.uploadDelay ? (
              <div className={css.uploadingImageOverlay}>
                <IconSpinner />
              </div>
            ) : null;

          const hasUploadError = !!uploadImageError && !uploadInProgress;
          const errorClasses = classNames({ [css.avatarUploadError]: hasUploadError });
          const transientUserProfileImage = profileImage.uploadedImage || user.profileImage;
          const transientUser = { ...user, profileImage: transientUserProfileImage };

          // Ensure that file exists if imageFromFile is used
          const fileExists = !!profileImage.file;
          const fileUploadInProgress = uploadInProgress && fileExists;
          const delayAfterUpload = profileImage.imageId && this.state.uploadDelay;
          const imageFromFile =
            fileExists && (fileUploadInProgress || delayAfterUpload) ? (
              <ImageFromFile
                id={profileImage.id}
                className={errorClasses}
                rootClassName={css.uploadingImage}
                aspectRatioClassName={css.squareAspectRatio}
                file={profileImage.file}
              >
                {uploadingOverlay}
              </ImageFromFile>
            ) : null;

          // Avatar is rendered in hidden during the upload delay
          // Upload delay smoothes image change process:
          // responsive img has time to load srcset stuff before it is shown to user.
          const avatarClasses = classNames(errorClasses, css.avatar, {
            [css.avatarInvisible]: this.state.uploadDelay,
          });
          const avatarComponent =
            !fileUploadInProgress && profileImage.imageId ? (
              <Avatar
                className={avatarClasses}
                renderSizes="(max-width: 767px) 96px, 240px"
                user={transientUser}
                disableProfileLink
              />
            ) : null;

          const chooseAvatarLabel =
            profileImage.imageId || fileUploadInProgress ? (
              <div className={css.avatarContainer}>
                {imageFromFile}
                {avatarComponent}
                <div className={css.changeAvatar}>
                  <FormattedMessage id="DeliverySettingsForm.changeAvatar" />
                </div>
              </div>
            ) : (
              <div className={css.avatarPlaceholder}>
                <div className={css.avatarPlaceholderText}>
                  <FormattedMessage id="DeliverySettingsForm.addYourProfilePicture" />
                </div>
                <div className={css.avatarPlaceholderTextMobile}>
                  <FormattedMessage id="DeliverySettingsForm.addYourProfilePictureMobile" />
                </div>
              </div>
            );

          const submitError = updateProfileError ? (
            <div className={css.error}>
              <FormattedMessage id="DeliverySettingsForm.updateProfileFailed" />
            </div>
          ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitInProgress = updateInProgress;
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            invalid || pristine || pristineSinceLastSubmit || uploadInProgress || submitInProgress;

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e);
              }}
            >
             
              <div className={css.addressWrapper}>
                <FieldTextInput
                  id="ups_addressLine1"
                  name="ups_addressLine1"
                  className={css.textField}
                  type="text"
                  label={'Address line 1'}
                  placeholder={'Address line 1'}
                />
                <FieldTextInput
                  id="ups_addressLine2"
                  name="ups_addressLine2"
                  className={css.textField}
                  type="text"
                  label={'Address line 2 • optional'}
                  placeholder={'Address line 2'}
                />
                <FieldTextInput
                  id="ups_city"
                  name="ups_city"
                  className={css.textField}
                  type="text"
                  label={'City'}
                  placeholder={'New York'}
                />
                <FieldTextInput
                  id="ups_state"
                  name="ups_state"
                  className={css.textField}
                  type="text"
                  label={'State'}
                  placeholder={'OR'}
                />

                <FieldTextInput
                  id="ups_zip"
                  name="ups_zip"
                  className={css.textField}
                  type="text"
                  label={'ZIP'}
                  placeholder={'00000'}
                />
                {/* 
                <FieldTextInput
                  id="ups_country"
                  name="ups_country"
                  className={css.textField}
                  type="text"
                  label={'Country'}
                  placeholder={'US'}
                /> */}
              </div>
              {submitError}
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                ready={pristineSinceLastSubmit}
              >
                <FormattedMessage id="DeliverySettingsForm.saveChanges" />
              </Button>
            </Form>
          );
        }}
      />
    );
  }
}

DeliverySettingsFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  uploadImageError: null,
  updateProfileError: null,
  updateProfileReady: false,
};

DeliverySettingsFormComponent.propTypes = {
  rootClassName: string,
  className: string,

  uploadImageError: propTypes.error,
  uploadInProgress: bool.isRequired,
  updateInProgress: bool.isRequired,
  updateProfileError: propTypes.error,
  updateProfileReady: bool,

  // from injectIntl
  intl: intlShape.isRequired,
};

const DeliverySettingsForm = compose(injectIntl)(DeliverySettingsFormComponent);

DeliverySettingsForm.displayName = 'DeliverySettingsForm';

export default DeliverySettingsForm;
