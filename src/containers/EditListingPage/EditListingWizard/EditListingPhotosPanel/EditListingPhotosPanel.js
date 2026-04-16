import React, { Component } from 'react';
import { array, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { ensureOwnListing } from '../../../../util/data';

// Import shared components
import { ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import css from './EditListingPhotosPanel.module.css';
import PhotosReorderTool from './components/PhotosReorderTool/PhotosReorderTool';
import DeleteOrSaveDraftListingButton from '../../../../components/DeleteOrSaveDraftListingButton/DeleteOrSaveDraftListingButton';
import { GoogleTagManagerHandler } from '../../../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

class EditListingPhotosPanel extends Component {
  constructor(props, state) {
    super(props, state);
    this.state = {
      list: this.props.listing?.attributes.publicData.imagesOrder
        ? this.props.listing?.attributes.publicData.imagesOrder
        : [],
      valuesCopy: {},
    };
    this.setList = this.setList.bind(this);
  }

  setList = list => {
    this.setState({
      list: list,
    });
  };

  componentDidMount() {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = window.location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }

  render() {
    const {
      className,
      rootClassName,
      errors,
      disabled,
      ready,
      images,
      listing,
      onImageUpload,
      submitButtonText,
      panelUpdated,
      updateInProgress,
      onChange,
      onSubmit,
      onRemoveImage,
      history,
    } = this.props;
    const { valuesCopy } = this.state;
    const setValuesCopy = values => this.setState({ valuesCopy: values });
    const rootClass = rootClassName || css.root;
    const classes = classNames(rootClass, className);
    const currentListing = ensureOwnListing(listing);

    const isPublished =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
    const panelTitle = isPublished ? (
      <FormattedMessage
        id="EditListingPhotosPanel.title"
        values={{ listingTitle: <ListingLink listing={listing} /> }}
      />
    ) : (
      <FormattedMessage id="EditListingPhotosPanel.createListingTitle" />
    );

    const imagesOrder = listing.attributes.publicData.imagesOrder;
    const reorderPicsLabel = 'Tap and drag to rearrange your photos';

    const rearangePhotosTool =
      images.length > 0 ? (
        <>
          {this.state.list.filter(i => {
            return i.id;
          }).length > 0 ? (
            <h2>{reorderPicsLabel}</h2>
          ) : null}
          <PhotosReorderTool
            images={images}
            list={this.state.list}
            setList={this.setList}
            imagesOrder={imagesOrder}
          />
        </>
      ) : null;

    const handleSaveFromModal = () => {
      const { addImage, infoFile, ...updateValues } = valuesCopy;

      updateValues.publicData = {
        imagesOrder: this.state.list.filter(i => {
          return i?.id;
        }),
        infoFile,
      };
      updateValues.keepAsDraft = true;
      onSubmit(updateValues);
    };
    return (
      <div className={classes}>
        <h1 className={css.title}>
          {panelTitle}{' '}
          <DeleteOrSaveDraftListingButton
            listing={currentListing}
            history={history}
            handleSaveFromModal={handleSaveFromModal}
            listingTitle={true}
          />
        </h1>
        <EditListingPhotosForm
          className={css.form}
          disabled={disabled}
          ready={ready}
          fetchErrors={errors}
          initialValues={{ images, infoFile: currentListing?.attributes?.publicData?.infoFile }}
          infoFile={currentListing?.attributes?.publicData?.infoFile}
          images={images}
          onImageUpload={onImageUpload}
          history={history}
          onSubmit={values => {
            const { addImage, infoFile, ...updateValues } = values;

            updateValues.publicData = {
              imagesOrder: this.state.list.filter(i => {
                return i?.id;
              }),
              infoFile,
            };
            onSubmit(updateValues);
          }}
          onChange={onChange}
          onRemoveImage={onRemoveImage}
          saveActionMsg={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          rearangePhotosTool={rearangePhotosTool}
          setValuesCopy={setValuesCopy}
        />
      </div>
    );
  }
}

EditListingPhotosPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  images: [],
  listing: null,
};

EditListingPhotosPanel.propTypes = {
  className: string,
  rootClassName: string,
  errors: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  images: array,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  onImageUpload: func.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  onRemoveImage: func.isRequired,
};

export default EditListingPhotosPanel;
