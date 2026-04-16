import React, { Component, useEffect, useState, useRef } from 'react';
import { array, bool, func, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { ARRAY_ERROR } from 'final-form';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

// Import configs and util modules
import config from '../../../../config';
import { FormattedMessage, intlShape, injectIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { nonEmptyArray, composeValidators } from '../../../../util/validators';
import { isUploadImageOverLimitError } from '../../../../util/errors';
import FileUploadField from '../../../../components/FilesUploadField/FileUploadField';
// Import shared components
import { Button, Form, AspectRatioWrapper } from '../../../../components';

// Import modules from this directory
import ListingImage from './ListingImage';
import css from './EditListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';

// Field component that uses file-input to allow user to select images.
const FieldAddImage = props => {
  const { formApi, onImageUploadHandler, ...rest } = props;
  const { aspectWidth = 1, aspectHeight = 1 } = config.listing;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          // const file = e.target.files[0];
          const files = e.target.files;
          for (let i = 0; i <= files.length - 1; i++) {
            formApi.change(`addImage`, files[i]);
            formApi.blur(`addImage`);
            onImageUploadHandler(files[i]);
          }
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : (
                <input {...inputProps} className={css.addImageInput} multiple />
              )}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

// Component that shows listing images from "images" field array
const FieldListingImage = props => {
  const { name, intl, onRemoveImage } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const image = input.value;
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
          />
        ) : null;
      }}
    </Field>
  );
};

export class EditListingPhotosFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { imageUploadRequested: false };
    this.onImageUploadHandler = this.onImageUploadHandler.bind(this);
    this.submittedImages = [];
  }

  onImageUploadHandler(file) {
    if (file) {
      this.setState({ imageUploadRequested: true });

      this.compressImage(file, 1280, 0.6)
        .then(compressedFile => {
          return this.props.onImageUpload({
            id: `${compressedFile.name}_${Date.now()}`,
            file: compressedFile,
          });
        })
        .then(() => {
          this.setState({ imageUploadRequested: false });
        })
        .catch(() => {
          this.setState({ imageUploadRequested: false });
        });
    }
  }

  compressImage(file, maxWidth = 1280, quality = 0.6) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = e => {
        image.src = e.target.result;
      };

      reader.onerror = reject;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / image.width, 1);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Compression failed."));
            }
          },
          "image/jpeg",
          quality
        );
      };

      reader.readAsDataURL(file);
    });
  
  };

  render() {
    return (
      <FinalForm
        {...this.props}
        mutators={{ ...arrayMutators }}
        onImageUploadHandler={this.onImageUploadHandler}
        imageUploadRequested={this.state.imageUploadRequested}
        initialValues={{ images: this.props.images, infoFile: this.props.infoFile }}
        render={formRenderProps => {
          const {
            form,
            className,
            fetchErrors,
            handleSubmit,
            images,
            imageUploadRequested,
            intl,
            invalid,
            onImageUploadHandler,
            onRemoveImage,
            disabled,
            ready,
            saveActionMsg,
            updated,
            updateInProgress,
            touched,
            errors,
            rearangePhotosTool,
            setValuesCopy,
            values,
            history,
          } = formRenderProps;

          const [submitFormAndCloseReady, setSubmitFormAndCloseReady] = useState(false);
          const [submitFormAndCloseLoading, setSubmitFormAndCloseLoading] = useState(false);

          const valuesRef = useRef(values);

          useEffect(() => {
            setValuesCopy(values);
            valuesRef.current = values;
          }, [values]);

          useEffect(() => {
            return () => {
              const targetPath = sessionStorage.getItem('targetPath');
              if (targetPath?.includes('edit/details') || targetPath?.includes('draft/details')) {
                this.props.onSubmit({ ...valuesRef.current, keepAsDraft: true });
              }
            };
          }, []);

          const chooseImageText = (
            <span className={css.chooseImageText}>
              <span className={css.chooseImage}>
                <FormattedMessage id="EditListingPhotosForm.chooseImage" />
              </span>
              <span className={css.imageTypes}>
                <FormattedMessage id="EditListingPhotosForm.imageTypes" />
              </span>
            </span>
          );

          const imageRequiredMessage = intl.formatMessage({
            id: 'EditListingPhotosForm.imageRequired',
          });

          const { publishListingError, showListingsError, updateListingError, uploadImageError } =
            fetchErrors || {};
          const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

          let uploadImageFailed = null;

          if (uploadOverLimit) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
              </p>
            );
          } else if (uploadImageError) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
              </p>
            );
          }

          // NOTE: These error messages are here since Photos panel is the last visible panel
          // before creating a new listing. If that order is changed, these should be changed too.
          // Create and show listing errors are shown above submit button
          const publishListingFailed = publishListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
            </p>
          ) : null;
          const showListingFailed = showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
            </p>
          ) : null;

          const submittedOnce = this.submittedImages.length > 0;
          // imgs can contain added images (with temp ids) and submitted images with uniq ids.
          const arrayOfImgIds = imgs =>
            imgs.map(i => (typeof i.id === 'string' ? i.imageId : i.id));
          const imageIdsFromProps = arrayOfImgIds(images);
          const imageIdsFromPreviousSubmit = arrayOfImgIds(this.submittedImages);
          const imageArrayHasSameImages = isEqual(imageIdsFromProps, imageIdsFromPreviousSubmit);
          const pristineSinceLastSubmit = submittedOnce && imageArrayHasSameImages;

          const submitReady = (updated && pristineSinceLastSubmit) || ready;
          const submitInProgress = updateInProgress && !submitFormAndCloseLoading;
          const submitDisabled =
            invalid ||
            disabled ||
            submitInProgress ||
            imageUploadRequested ||
            ready ||
            submitFormAndCloseLoading;
          const imagesError = touched.images && errors?.images && errors.images[ARRAY_ERROR];

          const classes = classNames(css.root, className);

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedImages = images;
                handleSubmit(e);
              }}
            >
              {updateListingError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingPhotosForm.updateFailed" />
                </p>
              ) : null}

              <div className={css.imagesField}>
                <FieldArray
                  name="images"
                  validate={composeValidators(nonEmptyArray(imageRequiredMessage))}
                >
                  {({ fields }) =>
                    fields.map((name, index) => (
                      <FieldListingImage
                        key={name}
                        name={name}
                        onRemoveImage={imageId => {
                          fields.remove(index);
                          onRemoveImage(imageId);
                        }}
                        intl={intl}
                      />
                    ))
                  }
                </FieldArray>

                {images?.length < 10 && (
                  <FieldAddImage
                    id="addImage"
                    name="addImage"
                    accept={ACCEPT_IMAGES}
                    label={chooseImageText}
                    type="file"
                    disabled={imageUploadRequested}
                    formApi={form}
                    onImageUploadHandler={onImageUploadHandler}
                  />
                )}
              </div>
              {imagesError ? <div className={css.arrayError}>{imagesError}</div> : null}
              {uploadImageFailed}

              <p className={css.tip}>
                Great photos will mean your item sells faster! We recommend the following:
                <br />
                1. Great main photo that is crisp, to help buyers quickly and clearly see the item
                <br />
                2. Photo of the item being worn, to give buyers an idea of how it looks on
                <br />
                3. Add up to 10 photos: focus on special features, more details means fewer
                questions from buyers and faster sales
                <br />
                4. Photo of supporting documents (if applicable): provide documents of authenticity
                - such as a receipt, a jewelry certificate that provides verification of the metal
                materials and/or carat weight and clarity for any diamonds or gems used in the piece
              </p>
              {publishListingFailed}
              {showListingFailed}

              {rearangePhotosTool}

              {values.infoFile && (
                <FileUploadField
                  id={`infoFile`}
                  name={`infoFile`}
                  fieldLabel={'Authentication certificate'}
                  className={css.dynamicField}
                />
              )}

              <div className={css.buttonsWrapper}>
                <Button
                  className={css.submitButton}
                  type="submit"
                  inProgress={submitInProgress}
                  disabled={submitDisabled}
                  ready={submitReady}
                >
                  {saveActionMsg}
                </Button>

                <Button
                  type="button"
                  className={css.submitButton}
                  onClick={() => {
                    // form.submit();
                    this.props.onSubmit({ ...values, keepAsDraft: true });
                    setSubmitFormAndCloseLoading(true);

                    setTimeout(() => {
                      setSubmitFormAndCloseLoading(false);
                      setSubmitFormAndCloseReady(true);
                      history.push('/listings');
                    }, 1000);
                  }}
                  inProgress={submitFormAndCloseLoading}
                  disabled={submitDisabled}
                  ready={submitFormAndCloseReady}
                >
                  {intl.formatMessage({ id: 'EditListingWizard.saveAndColose' })}
                </Button>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

EditListingPhotosFormComponent.defaultProps = { fetchErrors: null, images: [] };

EditListingPhotosFormComponent.propTypes = {
  fetchErrors: shape({
    publishListingError: propTypes.error,
    showListingsError: propTypes.error,
    uploadImageError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  images: array,
  intl: intlShape.isRequired,
  onImageUpload: func.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  onRemoveImage: func.isRequired,
};

export default compose(injectIntl)(EditListingPhotosFormComponent);
