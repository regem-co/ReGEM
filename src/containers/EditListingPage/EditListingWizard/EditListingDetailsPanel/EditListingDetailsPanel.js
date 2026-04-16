import React, { useState, useEffect } from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureOwnListing } from '../../../../util/data';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingDetailsForm from './EditListingDetailsForm';
import css from './EditListingDetailsPanel.module.css';
import { post } from '../../../../util/api';
import { filterJson, getAllValuesFromPublicData, independentValuesToMetalType } from './utils';
import config from '../../../../config';
import { findConfigForSelectFilter } from '../../../../util/search';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import DeleteOrSaveDraftListingButton from '../../../../components/DeleteOrSaveDraftListingButton/DeleteOrSaveDraftListingButton';
import UnsavedChangesPrompt from '../../../../components/UnsavedChangesPrompt/UnsavedChangesPrompt';
import { GoogleTagManagerHandler } from '../../../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const { UUID, Money } = sdkTypes;
const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

const EditListingDetailsPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    onSaveDraft,
    history,
  } = props;

  const [host, setHost] = useState(false);
  const [upsAddressError, setUpsAddressError] = useState(false);
  const [valuesCopy, setValuesCopy] = useState({});

  useEffect(() => {
    sdk.currentUser
      .show()
      .then(res => {
        if (res.data.data) {
          setHost(res.data.data);
        }
      })
      .catch(e => {
        console.log(e);
      });

    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  const currentListing = ensureOwnListing(listing);
  const classes = classNames(rootClassName || css.root, className);
  const { description, title, publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  // const isDraft = currentListing.id && currentListing.attributes.state === LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingDetailsPanel.title"
      values={{ listingTitle: <ListingLink listing={listing} /> }}
    />
  ) : (
    <FormattedMessage id="EditListingDetailsPanel.createListingTitle" />
  );

  const gemstonesWeightInitialValues = filterJson(publicData || {}, 'gemstone_');
  const metalTypeWeightInitialValues = filterJson(publicData || {}, 'metalType_');

  const { price } = currentListing.attributes;
  const currentStockRaw = currentListing.currentStock?.attributes?.quantity;
  const currentStock = typeof currentStockRaw != null ? currentStockRaw : 1;

  const userPublicData = host?.attributes?.profile?.publicData;

  const gemstoneConfig = findConfigForSelectFilter('gemstone', config.custom.filters);
  const gemstoneOptions = gemstoneConfig.options || [];
  const metalTypeConfig = findConfigForSelectFilter('metalType', config.custom.filters);
  const metalTypes = metalTypeConfig.options ? metalTypeConfig.options : [];

  let unknownInitialValues = {};
  gemstoneOptions.forEach(g => {
    unknownInitialValues[`gemstone_${g?.key}_weight`] = 'unknown';
  });

  metalTypes.forEach(m => {
    unknownInitialValues[`metalType_${m?.key}_weight`] = 'unknown';
  });

  const allPublicDataValues = getAllValuesFromPublicData(publicData || {});

  const shippingPriceInSubunitsAdditionalItemsValue = 2000;
  const shippingPriceInSubunitsOneItemValue = 2000;

  const handleSaveDraft = (values, redirectToModifiedUrl = () => { }) => {
    const {
      title,
      description,
      category,
      metalType,
      materials,
      subcategory,
      ringSize,
      condition,
      gemstone,
      earingsSoldAs,
      necklaceLength,
      claspType,
      braceletLength,
      branded,
      brandName,
      //ups
      ups_addressLine1,
      ups_addressLine2,
      ups_city,
      ups_state,
      ups_zip,
      ups_country,
      price,
      stock,
      estimatedRetailPrice,
      lowestPrice,
      isAllowOffer,
      priceRange,
      ...rest
    } = values;

    const hostIdObj = host
      ? {
        hostId: host.id.uuid,
      }
      : {};

    // Update stock only if the value has changed.
    // NOTE: this is going to be used on a separate call to API
    // in EditListingPage.duck.js: sdk.stock.compareAndSet();
    const hasStockQuantityChanged = stock && currentStockRaw !== stock;
    // currentStockRaw is null or undefined, return null - otherwise use the value
    const oldTotal = currentStockRaw != null ? currentStockRaw : null;
    const stockUpdateMaybe = hasStockQuantityChanged
      ? {
        stockUpdate: {
          oldTotal,
          newTotal: stock,
        },
      }
      : {};

    let subcategoryValue = subcategory;

    if (Array.isArray(subcategoryValue)) {
      const subcategoryConfig = findConfigForSelectFilter(
        'subcategory',
        config.custom.filters
      );
      const subcategories = subcategoryConfig.options ? subcategoryConfig.options : [];
      const convertedSubcategories = subcategoryValue.map(sub =>
        subcategories.find(s => s.key === sub)
      );

      subcategoryValue = convertedSubcategories
        .filter(s => s.category === category)
        .map(i => i.key);
    }

    const priceRangesConfig = findConfigForSelectFilter('priceRanges', config.custom.filters);
    const priceRanges = priceRangesConfig.options ? priceRangesConfig.options : [];

    let priceRangeValue = priceRange;

    const userRemovedPrice = price === null;
    if (userRemovedPrice) {
      priceRangeValue = null;
    } else {
      var newPrice = price?.amount / 100;

      // check if newPrice is not a number
      if (isNaN(newPrice)) {
        newPrice = 1;
      }

      priceRangeValue = [priceRanges.find(p => newPrice >= p.min && newPrice <= p.max).key];
    }

    const updateValues = {
      title: title.trim(),
      description,
      price: price?.amount ? new Money((Math.round(price.amount / 100)) * 100, config.currency) : new Money(0, config.currency),
      ...stockUpdateMaybe,
      publicData: {
        category,
        metalType,
        materials,
        subcategory: subcategoryValue,
        ringSize,
        condition,
        ...hostIdObj,
        shippingEnabled: true,
        gemstone,
        earingsSoldAs,
        necklaceLength,
        claspType,
        braceletLength,
        branded,
        brandName,
        priceRange: priceRangeValue,
        //ups
        ups_addressLine1,
        ups_addressLine2,
        ups_city,
        ups_state,
        ups_zip,
        ups_country,
        lowestPrice: Math.round(lowestPrice),
        isAllowOffer,
        ...rest,
        shippingPriceInSubunitsAdditionalItems: shippingPriceInSubunitsAdditionalItemsValue,
        shippingPriceInSubunitsOneItem: shippingPriceInSubunitsOneItemValue,
        estimatedRetailPrice: Math.round(estimatedRetailPrice)
      },
    };

    return onSaveDraft(updateValues, redirectToModifiedUrl);
  };

  const handleSaveFromModal = () => {
    if (isPublished) {
      const {
        title,
        description,
        category,
        metalType,
        materials,
        subcategory,
        ringSize,
        condition,
        gemstone,
        earingsSoldAs,
        necklaceLength,
        claspType,
        braceletLength,
        branded,
        brandName,
        //ups
        ups_addressLine1,
        ups_addressLine2,
        ups_city,
        ups_state,
        ups_zip,
        ups_country,
        price,
        stock,
        estimatedRetailPrice,
        lowestPrice,
        isAllowOffer,
        ...rest
      } = valuesCopy;

      const hostIdObj = host
        ? {
          hostId: host.id.uuid,
        }
        : {};

      // Update stock only if the value has changed.
      // NOTE: this is going to be used on a separate call to API
      // in EditListingPage.duck.js: sdk.stock.compareAndSet();
      const hasStockQuantityChanged = stock && currentStockRaw !== stock;
      // currentStockRaw is null or undefined, return null - otherwise use the value
      const oldTotal = currentStockRaw != null ? currentStockRaw : null;
      const stockUpdateMaybe = hasStockQuantityChanged
        ? {
          stockUpdate: {
            oldTotal,
            newTotal: stock,
          },
        }
        : {};

      let subcategoryValue = subcategory;

      if (Array.isArray(subcategoryValue)) {
        const subcategoryConfig = findConfigForSelectFilter('subcategory', config.custom.filters);
        const subcategories = subcategoryConfig.options ? subcategoryConfig.options : [];
        const convertedSubcategories = subcategoryValue.map(sub =>
          subcategories.find(s => s.key === sub)
        );

        subcategoryValue = convertedSubcategories
          .filter(s => s.category === category)
          .map(i => i.key);
      }
      const updateValues = {
        title: title.trim(),
        description,
        price: price?.amount ? new Money((Math.round(price.amount / 100)) * 100, config.currency) : new Money(0, config.currency),
        ...stockUpdateMaybe,
        publicData: {
          category,
          metalType,
          materials,
          subcategory: subcategoryValue,
          ringSize,
          condition,
          ...hostIdObj,
          shippingEnabled: true,
          gemstone,
          earingsSoldAs,
          necklaceLength,
          claspType,
          braceletLength,
          branded,
          brandName,
          //ups
          ups_addressLine1,
          ups_addressLine2,
          ups_city,
          ups_state,
          ups_zip,
          ups_country,
          estimatedRetailPrice: Math.round(estimatedRetailPrice),
          lowestPrice: Math.round(lowestPrice),
          isAllowOffer,
          ...rest,
          shippingPriceInSubunitsAdditionalItems: shippingPriceInSubunitsAdditionalItemsValue,
          shippingPriceInSubunitsOneItem: shippingPriceInSubunitsOneItemValue,
        },
      };
      onSubmit(updateValues);
    } else {
      handleSaveDraft(valuesCopy);
    }
  };

  return (
    <div className={classes}>
      <UnsavedChangesPrompt />
      <h1 className={css.title}>
        {panelTitle}{' '}
        <DeleteOrSaveDraftListingButton
          listing={currentListing}
          history={history}
          handleSaveFromModal={handleSaveFromModal}
          listingTitle={valuesCopy?.title}
          skipRedirect={false}
        />
        {/* we need to skip redirect here otherwise duplicates drafts */}
      </h1>
      <EditListingDetailsForm
        className={css.form}
        upsAddressError={upsAddressError}
        initialValues={{
          ...allPublicDataValues,
          ...unknownInitialValues,
          title,
          description,
          price: price,
          stock: currentStock ?? 1,
          category: publicData.category,
          metalType: publicData.metalType,
          materials: publicData.materials,
          subcategory: publicData.subcategory,
          ringSize: publicData.ringSize,
          condition: publicData.condition,
          gemstone: publicData.gemstone,
          earingsSoldAs: publicData.earingsSoldAs,
          necklaceLength: publicData.necklaceLength,
          claspType: publicData.claspType,
          braceletLength: publicData.braceletLength,
          branded: publicData.branded,
          brandName: publicData.brandName,
          estimatedRetailPrice: publicData.estimatedRetailPrice ? publicData.estimatedRetailPrice : null,// ? new Money(publicData.estimatedRetailPrice, 'USD') : null,
          //publicData.estimatedRetailPrice,// ? new Money(publicData.estimatedRetailPrice, 'USD') : null,
          // ups
          lowestPrice: publicData.lowestPrice ? publicData.lowestPrice : 0,
          ups_addressLine1: publicData.ups_addressLine1 || userPublicData?.ups_addressLine1,
          ups_addressLine2: publicData.ups_addressLine2 || userPublicData?.ups_addressLine2,
          ups_city: publicData.ups_city || userPublicData?.ups_city,
          ups_state: publicData.ups_state || userPublicData?.ups_state,
          ups_zip: publicData.ups_zip || userPublicData?.ups_zip,
          ups_country: publicData.ups_country || userPublicData?.ups_country,
          ...gemstonesWeightInitialValues,
          ...metalTypeWeightInitialValues,
        }}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const {
            title,
            description,
            category,
            metalType,
            materials,
            subcategory,
            ringSize,
            condition,
            gemstone,
            earingsSoldAs,
            necklaceLength,
            claspType,
            braceletLength,
            branded,
            brandName,
            //ups
            ups_addressLine1,
            ups_addressLine2,
            ups_city,
            ups_state,
            ups_zip,
            ups_country,
            price,
            lowestPrice,
            isAllowOffer,
            priceRange,
            stock,
            estimatedRetailPrice,
            ...rest
          } = values;

          const hostIdObj = host
            ? {
              hostId: host.id.uuid,
            }
            : {};

          // Update stock only if the value has changed.
          // NOTE: this is going to be used on a separate call to API
          // in EditListingPage.duck.js: sdk.stock.compareAndSet();
          const hasStockQuantityChanged = stock && currentStockRaw !== stock;
          // currentStockRaw is null or undefined, return null - otherwise use the value
          const oldTotal = currentStockRaw != null ? currentStockRaw : null;
          const stockUpdateMaybe = hasStockQuantityChanged
            ? {
              stockUpdate: {
                oldTotal,
                newTotal: stock,
              },
            }
            : {};

          let subcategoryValue = subcategory;

          if (Array.isArray(subcategoryValue)) {
            const subcategoryConfig = findConfigForSelectFilter(
              'subcategory',
              config.custom.filters
            );
            const subcategories = subcategoryConfig.options ? subcategoryConfig.options : [];
            const convertedSubcategories = subcategoryValue.map(sub =>
              subcategories.find(s => s.key === sub)
            );

            subcategoryValue = convertedSubcategories
              .filter(s => s.category === category)
              .map(i => i.key);
          }

          const priceRangesConfig = findConfigForSelectFilter('priceRanges', config.custom.filters);
          const priceRanges = priceRangesConfig.options ? priceRangesConfig.options : [];

          let priceRangeValue = priceRange;

          const userRemovedPrice = price === null;
          if (userRemovedPrice) {
            priceRangeValue = null;
          } else {
            var newPrice = price?.amount / 100;

            // check if newPrice is not a number
            if (isNaN(newPrice)) {
              newPrice = 1;
            }

            priceRangeValue = [priceRanges.find(p => newPrice >= p.min && newPrice <= p.max).key];
          }

          const updateValues = {
            title: title.trim(),
            description,
            price: price?.amount ? new Money((Math.round(price.amount / 100)) * 100, config.currency) : new Money(0, config.currency),
            ...stockUpdateMaybe,
            publicData: {
              category,
              metalType,
              materials,
              subcategory: subcategoryValue,
              ringSize,
              condition,
              ...hostIdObj,
              shippingEnabled: true,
              gemstone,
              earingsSoldAs,
              necklaceLength,
              claspType,
              braceletLength,
              branded,
              brandName,
              priceRange: priceRangeValue,
              //ups
              ups_addressLine1,
              ups_addressLine2,
              ups_city,
              ups_state,
              ups_zip,
              ups_country,
              lowestPrice: Math.round(lowestPrice),
              isAllowOffer,
              ...rest,
              shippingPriceInSubunitsOneItem: shippingPriceInSubunitsOneItemValue,
              shippingPriceInSubunitsAdditionalItems: shippingPriceInSubunitsAdditionalItemsValue,
              estimatedRetailPrice: Math.round(estimatedRetailPrice)
            },
          };
          onSubmit(updateValues);
        }}
        onChange={onChange}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        autoFocus
        isDraft={!isPublished}
        history={history}
        handleSaveDraft={handleSaveDraft}
        setValuesCopy={setValuesCopy}
      />
    </div>
  );
};

EditListingDetailsPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  listing: null,
};

EditListingDetailsPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDetailsPanel;
