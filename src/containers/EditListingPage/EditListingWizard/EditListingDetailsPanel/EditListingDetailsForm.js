import React, { useEffect, useState, useRef } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import * as validators from '../../../../util/validators';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';

// Import configs and util modules
import config from '../../../../config';
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { maxLength, required, composeValidators } from '../../../../util/validators';
import { findConfigForSelectFilter } from '../../../../util/search';

// Import shared components
import {
  Form,
  Button,
  FieldTextInput,
  FieldCheckboxGroup,
  FieldSelect,
  FieldCurrencyInput,
  FieldCheckbox,
} from '../../../../components';
// Import modules from this directory
import CustomFieldEnum from '../CustomFieldEnum';
import css from './EditListingDetailsForm.module.css';
import {
  braceletLengthOptions,
  claspTypesOptions,
  filterSubcategoriesOptions,
  getSubcategoryLabel,
  necklaceLengthOptions,
  soldAsOptions,
  styleOptions,
} from '../../../../util/listing';
import CustomMetalTypeCheckboxesGroup from './components/CustomMetalTypeCheckboxesGroup/CustomMetalTypeCheckboxesGroup';
import { independentValuesToMetalType } from './utils';

import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';

const { Money } = sdkTypes;

const TITLE_MAX_LENGTH = 560;

const EditListingDetailsFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        filterConfig,
        form,
        values,
        upsAddressError,
        isDraft,
        history,
        handleSaveDraft,
        setValuesCopy,
      } = formRenderProps;

      // Prepare updated values before submitting
      let finalLowestPrice = values.lowestPrice;

      if (!finalLowestPrice || finalLowestPrice === 0) {
        finalLowestPrice =
          typeof values.price === 'object'
            ? values?.price?.amount
              ? values?.price?.amount / 100
              : 0
            : Number(values.price) / 100;
      }

      const updatedValues = {
        ...values,
        lowestPrice: finalLowestPrice,
      };

      const valuesRef = useRef(updatedValues);

      useEffect(() => {
        setValuesCopy(updatedValues);
        valuesRef.current = updatedValues;
      }, [values]);

      useEffect(() => {
        return () => {
          const targetPath = sessionStorage.getItem('targetPath');
          if (targetPath?.includes('edit/photos') || targetPath?.includes('draft/photos')) {
            handleSaveDraft(valuesRef.current, redirectToPhotosTab);
          }
        };
      }, []);


      const [saveDraftReady, setSaveDraftReady] = useState(false);
      const [saveDraftLoading, setSaveDraftLoading] = useState(false);

      const [submitFormReady, setSubmitFormReady] = useState(false);
      const [submitFormLoading, setSubmitFormLoading] = useState(false);

      const [submitFormAndCloseReady, setSubmitFormAndCloseReady] = useState(false);
      const [submitFormAndCloseLoading, setSubmitFormAndCloseLoading] = useState(false);

      const titleMessage = intl.formatMessage({ id: 'EditListingDetailsForm.title' });
      const titlePlaceholderMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titlePlaceholder',
      });
      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingDetailsForm.maxLength' },
        {
          maxLength: TITLE_MAX_LENGTH,
        }
      );

      const descriptionMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.description',
      });
      const descriptionPlaceholderMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.descriptionPlaceholder',
      });
      const maxLength60Message = maxLength(maxLengthMessage, TITLE_MAX_LENGTH);
      const descriptionRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.descriptionRequired',
      });

      const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDetailsForm.updateFailed" />
        </p>
      ) : null;

      // This error happens only on first tab (of EditListingWizard)
      const errorMessageCreateListingDraft = createListingDraftError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDetailsForm.createListingDraftError" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDetailsForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const categoryConfig = findConfigForSelectFilter('category', filterConfig);
      const categorySchemaType = categoryConfig.schemaType;
      const categories = categoryConfig.options ? categoryConfig.options : [];
      const categoryLabel = intl.formatMessage({
        id: 'EditListingDetailsForm.categoryLabel',
      });
      const categoryPlaceholder = intl.formatMessage({
        id: 'EditListingDetailsForm.categoryPlaceholder',
      });

      const categoryRequired = required(
        intl.formatMessage({
          id: 'EditListingDetailsForm.categoryRequired',
        })
      );

      const metalTypeConfig = findConfigForSelectFilter('metalType', filterConfig);
      const metalTypeSchemaType = metalTypeConfig.schemaType;
      const metalTypes = metalTypeConfig.options ? metalTypeConfig.options : [];
      const metalTypeLabel = intl.formatMessage({
        id: 'EditListingDetailsForm.metalTypeLabel',
      });

      const fieldRequired = required(
        intl.formatMessage({
          id: 'EditListingDetailsForm.fieldRequired',
        })
      );

      const materialsConfig = findConfigForSelectFilter('materials', filterConfig);
      const materials = materialsConfig.options ? materialsConfig.options : [];
      const materialsLabel = intl.formatMessage({
        id: 'EditListingDetailsForm.materialsLabel',
      });

      const gemstoneConfig = findConfigForSelectFilter('gemstone', filterConfig);
      const gemstoneOptions = materialsConfig.options ? gemstoneConfig.options : [];
      const gemstoneLabel = intl.formatMessage({
        id: 'EditListingDetailsForm.gemstoneLabel',
      });

      const subcategoryConfig = findConfigForSelectFilter('subcategory', filterConfig);
      const subcategories = subcategoryConfig.options ? subcategoryConfig.options : [];
      const subcategoryLabel = getSubcategoryLabel(values?.category);

      const ringSizeConfig = findConfigForSelectFilter('ringSize', filterConfig);
      const ringSizeSchemaType = ringSizeConfig.schemaType;
      const ringSizes = ringSizeConfig.options ? ringSizeConfig.options : [];

      const conditionConfig = findConfigForSelectFilter('condition', filterConfig);
      const conditionSchemaType = conditionConfig.schemaType;
      const conditions = conditionConfig.options ? conditionConfig.options : [];

      const showRingSizeField =
        values.category && (values.category === 'mens' || values.category === 'rings');
      const showEaringsSoldAs = values.category && values.category === 'earrings';

      const gemstonesWeightFields =
        values.gemstone?.length > 0
          ? values.gemstone.map(g => {
            const fieldId = `gemstone_${g}_weight`;
            const gemstoneLabel = gemstoneOptions.find(i => i.key === g)?.label;

            const fieldLabel = gemstoneLabel + ' Carat Weight (ctw)';
            return (
              <FieldTextInput
                id={fieldId}
                name={fieldId}
                className={css.textField}
                type="text"
                label={fieldLabel}
                placeholder={'carat weight or unknown'}
              // validate={composeValidators(required('You need to complete this field'))}
              />
            );
          })
          : [];

      const metalTypeValue = independentValuesToMetalType(values);

      const metalTypeWeightFields =
        metalTypeValue.length > 0
          ? metalTypeValue.map(g => {
            const fieldId = `metalType_${g}_weight`;
            const metalTypeLabel = metalTypes.find(i => i.key === g)?.label;

            const fieldLabel = metalTypeLabel + ' Weight in Grams (gm)';
            return (
              <FieldTextInput
                id={fieldId}
                name={fieldId}
                className={css.textField}
                type="text"
                label={fieldLabel}
                placeholder={'weight in grams'}
              />
            );
          })
          : [];

      const checkboxesFields =
        metalTypes.map(m => {
          return (
            <>
              <FieldCheckbox id={m.key} name={m.key} label={m.label} value={m.key} />
              {m.caratInfo && values[(m?.key)]?.length > 0 && (
                <FieldCheckboxGroup
                  className={css.checkboxGroupWIndent}
                  id={`${m?.key}_carat`}
                  name={`${m?.key}_carat`}
                  options={[
                    {
                      key: '10K',
                      label: '10K',
                    },
                    {
                      key: '14K',
                      label: '14K',
                    },
                    {
                      key: '18K',
                      label: '18K',
                    },
                  ]}
                  radio={true}
                />
              )}
            </>
          );
        }) || [];

      const calculateEstimatedEarnings = price => {
        if (price < 500000) {
          return price * 0.7;
        } else if (price >= 500000 && price < 1000000) {
          return price * 0.75;
        } else {
          return price * 0.8;
        }
      };

      const estimatedEarnings = values.price?.amount
        ? '$' + (calculateEstimatedEarnings(values.price?.amount) / 100)?.toFixed(0)
        : '$ 0';

      const handleOnChange = formValues => {
        var allChangedFields = {};
        for (const key in values) {
          if (values[key] && values[key] !== formValues.values[key]) {
            allChangedFields[key] = formValues.values[key];
          }
        }

        for (const changedField in allChangedFields) {
          const userRemovedSomething =
            Array.isArray(allChangedFields[changedField]) &&
            allChangedFields[changedField].length === 0;

          if (userRemovedSomething) {
            form.change(changedField, null);
          }
        }

        const oldCategory = values.category;
        const newCategory = formValues?.values?.category;

        if (
          oldCategory !== newCategory &&
          (values.subcategory || formValues?.values?.subcategory) &&
          (values.claspType || formValues?.values?.claspType) &&
          (values.earings_SoldAs || formValues?.values?.earings_SoldAs) &&
          (values.necklaceLength || formValues?.values?.necklaceLength)
        ) {
          console.log('change');
          form.change('subcategory', null);
          form.change('claspType', null);
          form.change('earings_SoldAs', null);
          form.change('necklaceLength', null);
        }
      };

      const redirectToModifiedUrl = (title, draftId) => {
        history.push(`/l/${title}/${draftId}/draft/details`);
      };

      const redirectToPhotosTab = (title, draftId) => {
        history.push(`/l/${title}/${draftId}/draft/photos`);
      };

      const priceRequired = validators.required(
        intl.formatMessage({
          id: 'EditListingPricingForm.priceRequired',
        })
      );
      const minPrice = new Money(config.listingMinimumPriceSubUnits, config.currency);
      const minPriceRequired = validators.moneySubUnitAmountAtLeast(
        intl.formatMessage(
          {
            id: 'EditListingPricingForm.priceTooLow',
          },
          {
            minPrice: formatMoney(intl, minPrice),
          }
        ),
        config.listingMinimumPriceSubUnits
      );
      const priceValidators = config.listingMinimumPriceSubUnits
        ? validators.composeValidators(priceRequired, minPriceRequired)
        : priceRequired;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageCreateListingDraft}
          {errorMessageUpdateListing}
          {errorMessageShowListing}
          <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
          <div className={css.infoBox}>
            <p className={css.infoBoxLabel}>Item information</p>
            <FieldTextInput
              id="title"
              name="title"
              className={css.title}
              type="text"
              label={titleMessage}
              placeholder={titlePlaceholderMessage}
              maxLength={TITLE_MAX_LENGTH}
              validate={composeValidators(required(titleRequiredMessage), maxLength60Message)}
              autoFocus={autoFocus}
            />
            <FieldTextInput
              id="description"
              name="description"
              className={css.description}
              type="textarea"
              label={descriptionMessage}
              placeholder={descriptionPlaceholderMessage}
            //validate={composeValidators(required(descriptionRequiredMessage))}
            />

            <FieldCheckboxGroup
              className={css.checkboxGroupField}
              id="branded"
              name="branded"
              options={[
                { key: 'branded', label: 'Branded' },
                { key: 'unbranded', label: 'Unbranded' },
              ]}
              label={'Is this a branded piece?'}
              radio={true}
              twoColumns={true}
            />

            {values.branded === 'branded' && (
              <FieldTextInput
                id="brandName"
                name="brandName"
                className={css.title}
                type="text"
                label={'Brand name'}
                placeholder={'Type here'}
              />
            )}

            <CustomFieldEnum
              id="category"
              name="category"
              options={categories}
              label={categoryLabel}
              placeholder={categoryPlaceholder}
              intl={intl}
              // validate={categoryRequired}
              schemaType={categorySchemaType}
            />
          </div>

          <div className={css.infoBox}>
            <p className={css.infoBoxLabel}>Est. Retail</p>

            {/* <FieldCurrencyInput
                id="estimatedRetailPrice"
                name="estimatedRetailPrice"
                style={{ width: '100%' }}
                className={css.inputLong}
                label={''}
                placeholder={'Type here'}
                currencyConfig={config.currencyConfig}
                //validate={priceValidators}
              /> */}

            <FieldTextInput
              id="estimatedRetailPrice"
              name="estimatedRetailPrice"
              className={css.title}
              type="text"
              label="Est. Retail"
              placeholder="Type here"
            />

          </div>

          <div className={css.infoBox}>
            <p className={css.infoBoxLabel}>Item details</p>
            <p className={css.infoBoxSublabel}>SPECIFICS</p>
            {values?.category && (
              <FieldCheckboxGroup
                className={css.checkboxGroupField}
                id="subcategory"
                name="subcategory"
                options={filterSubcategoriesOptions(values?.category, subcategories)}
                label={subcategoryLabel}
                radio={values?.category === 'mens'}
              />
            )}
            {values?.subcategory && values?.subcategory?.includes('other') && (
              <FieldTextInput
                id="otherSubcategoryDetails"
                name="otherSubcategoryDetails"
                className={css.description}
                type="text"
                label={'Provide Detail'}
                placeholder={'Type here...'}
              //validate={composeValidators(required('You need to complete this field'))}
              />
            )}
            {values?.subcategory === 'mensBracelets' && (
              <FieldTextInput
                id="menBraceletSize"
                name="menBraceletSize"
                className={css.title}
                type="text"
                label={'Bracelet size/length'}
                placeholder={'Type here'}
              />
            )}
            {values?.subcategory === 'mensNecklaces' && (
              <FieldTextInput
                id="mensNecklacesSize"
                name="mensNecklacesSize"
                className={css.title}
                type="text"
                label={'Necklace length'}
                placeholder={'Type here'}
              />
            )}
            {values?.subcategory === 'mensRings' && (
              <FieldTextInput
                id="mensRingsSize"
                name="mensRingsSize"
                className={css.title}
                type="text"
                label={'Ring size'}
                placeholder={'Type here'}
              />
            )}
            {values?.subcategory === 'mensEarrings' && (
              <FieldCheckboxGroup
                className={css.checkboxGroupField}
                id="mensEarringsInfo"
                name="mensEarringsInfo"
                options={[
                  {
                    key: 'single',
                    label: 'single',
                  },
                  {
                    key: 'pair',
                    label: 'pair',
                  },
                ]}
                label={'Earrings info'}
                twoColumns={true}
                radio={true}
              />
            )}
            <FieldCheckboxGroup
              className={css.checkboxGroupField}
              id="style"
              name="style"
              options={styleOptions}
              label={'Style'}
            />
            {showEaringsSoldAs && (
              <FieldCheckboxGroup
                className={css.checkboxGroupField}
                id="earings_SoldAs"
                name="earings_SoldAs"
                options={soldAsOptions}
                label={'Sold as'}
                radio={true}
              />
            )}
            {showRingSizeField && (
              <CustomFieldEnum
                id="ringSize"
                name="ringSize"
                options={ringSizes}
                label={
                  <span className={css.stretchedLabel}>
                    <span>{'Ring size'}</span>
                    <a href="/p/size-guide" target="_blank">
                      {'Need help with mesurements?'}
                    </a>
                  </span>
                }
                intl={intl}
                placeholder={'Select an option'}
                // validate={composeValidators(required('You need to select an option'))}
                schemaType={ringSizeSchemaType}
              />
            )}
            {values.category === 'necklaces' && (
              <>
                <FieldSelect
                  className={css.detailsSelect}
                  name={'necklaceLength'}
                  id={'necklaceLength'}
                  label={
                    <span className={css.stretchedLabel}>
                      <span>{'Length'}</span>
                      <a href="/p/size-guide" target="_blank">
                        {'Need help with mesurements?'}
                      </a>
                    </span>
                  }
                >
                  <option disabled value="">
                    {'Select an option'}
                  </option>
                  {necklaceLengthOptions.map(o => {
                    return (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    );
                  })}
                </FieldSelect>
                <FieldSelect
                  className={css.detailsSelect}
                  name={'claspType'}
                  id={'claspType'}
                  label={
                    <span className={css.stretchedLabel}>
                      <span>{'Clasp type'}</span>
                      <a href="/p/size-guide" target="_blank">
                        {'Need help with clasp types?'}
                      </a>
                    </span>
                  }
                >
                  <option disabled value="">
                    {'Select an option'}
                  </option>
                  {claspTypesOptions.map(o => {
                    return (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    );
                  })}
                </FieldSelect>
              </>
            )}
            {values.category === 'bracelets' && (
              <>
                <FieldSelect
                  className={css.detailsSelect}
                  name={'braceletLength'}
                  id={'braceletLength'}
                  label={
                    <span className={css.stretchedLabel}>
                      <span>{'Length'}</span>
                      <a href="/p/size-guide" target="_blank">
                        {'Need help with mesurements?'}
                      </a>
                    </span>
                  }
                >
                  <option disabled value="">
                    {'Select an option'}
                  </option>
                  {braceletLengthOptions.map(o => {
                    return (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    );
                  })}
                </FieldSelect>
                <FieldSelect
                  className={css.detailsSelect}
                  name={'claspType'}
                  id={'claspType'}
                  label={
                    <span className={css.stretchedLabel}>
                      <span>{'Clasp type'}</span>
                      <a href="/p/size-guide" target="_blank">
                        {'Need help with clasp types?'}
                      </a>
                    </span>
                  }
                >
                  <option disabled value="">
                    {'Select an option'}
                  </option>
                  {claspTypesOptions.map(o => {
                    return (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    );
                  })}
                </FieldSelect>
              </>
            )}
            <p className={css.infoBoxSublabel}>Metal</p>
            {/* <CustomMetalTypeCheckboxesGroup
              id="metalType"
              name="metalType"
              label={metalTypeLabel}
              options={metalTypes}
              values={values}
            /> */}
            {/* <FieldCheckboxGroup
              className={css.checkboxGroupField}
              id="metalType"
              name="metalType"
              options={metalTypes}
              label={metalTypeLabel}
              twoColumns={true}
            /> */}
            <div className={css.checboxesWrapper}>
              <div className={css.checkboxesColumn}>
                {checkboxesFields[0]}
                {checkboxesFields[1]}
                {checkboxesFields[2]}
              </div>
              <div className={css.checkboxesColumn}>
                {checkboxesFields[3]}
                {checkboxesFields[4]}
                {checkboxesFields[5]}
              </div>
              <div className={css.checkboxesColumn}>{checkboxesFields[6]}</div>
            </div>
            {metalTypeWeightFields} {/*TODO not showing  */}
            {/* here we show the more details text field if "other" checkbox is selected */}
            {values?.other && values?.other[0] === 'other' && (
              <FieldTextInput
                id="otherMetalDetails"
                name="otherMetalDetails"
                className={css.description}
                type="text"
                label={'Provide Metal Detail'}
                placeholder={'Type here...'}
              //validate={composeValidators(required('You need to complete this field'))}
              />
            )}
            <p className={css.infoBoxSublabel}>GEMSTONE</p>
            <FieldCheckboxGroup
              className={css.checkboxGroupField}
              id="gemstone"
              name="gemstone"
              options={gemstoneOptions}
              // label={gemstoneLabel}
              fiveColumns={true}
            />
            {gemstonesWeightFields}
            {values?.gemstone && values?.gemstone?.includes('other') && (
              <FieldTextInput
                id="otherGemstoneDetails"
                name="otherGemstoneDetails"
                className={css.description}
                type="text"
                label={'Provide Gemstone Detail'}
                placeholder={'Type here...'}
              //validate={composeValidators(required('You need to complete this field'))}
              />
            )}
            <p className={css.infoBoxSublabel}>MATERIALS</p>
            <FieldCheckboxGroup
              className={css.checkboxGroupField}
              id="materials"
              name="materials"
              options={materials}
              // label={materialsLabel}
              fiveColumns={true}
            />
            {values?.materials && values?.materials?.includes('other') && (
              <FieldTextInput
                id="otherMaterialDetails"
                name="otherMaterialDetails"
                className={css.description}
                type="text"
                label={'Provide Material Detail'}
                placeholder={'Type here...'}
              //validate={composeValidators(required('You need to complete this field'))}
              />
            )}
          </div>

          <div className={css.infoBox}>
            <p className={css.infoBoxLabel}>Pricing</p>
            <CustomFieldEnum
              id="condition"
              name="condition"
              options={conditions}
              label={'Condition'}
              placeholder={'Select an option'}
              intl={intl}
              // validate={composeValidators(required('You need to select an option'))}
              schemaType={conditionSchemaType}
            />
            <div className={css.fieldsWrapper}>
              <div className={css.field}>
                <p className={css.label}>
                  {intl.formatMessage({ id: 'EditListingPricingForm.pricePerProduct' })}
                </p>
                <FieldCurrencyInput
                  id="price"
                  name="price"
                  className={css.input}
                  placeholder={intl.formatMessage({
                    id: 'EditListingPricingForm.priceInputPlaceholder',
                  })}
                  currencyConfig={config.currencyConfig}
                  validate={priceValidators}
                  autoComplete="off"
                />
              </div>

              <div className={css.estimatedEarnings}>
                <p className={css.label}>
                  {'Est. Earning'} <span className={css.infoIcon}>*</span>
                  <div className={css.extraInfoWrapper}>
                    Estimate how much you will earn based on marketplace commission %
                  </div>
                </p>
                <div className={css.estimatedField}>{estimatedEarnings}</div>
              </div>
            </div>

            <div className={css.fieldsWrapper}>
              <label className={css.label}>
                Offer Settings <span className={css.infoIcon}>*</span>
                <div className={css.extraInfoWrapper}>
                  Letting buyers make offers can increase your chance of selling
                </div>
              </label>
            </div>
            {/* {values.isAllowOffer === 'false' && ( */}
            <div className={css.fieldsWrapper}>
              {!values?.isAllowOffer && (
                <div className={css.field}>
                  <p className={css.label}>Accept offers at or above:</p>
                  <FieldTextInput
                    id="lowestPrice"
                    name="lowestPrice"
                    className={css.title}
                    type="text"
                    placeholder={'Enter your number'}
                    validate={validators.numberAtLeast('You need to add a valid price.', 0)}
                    onChange={e => {
                      const inputValue = e.target.value;
                      // Ensure only numbers are stored
                      form.change('lowestPrice', inputValue ? Number(inputValue) : '');
                      setIsLowestPriceModified(true);
                    }}
                  />
                </div>
              )}
            </div>
            {/* )} */}
            <div className={css.checboxesWrapper}>
              <div className={css.checkboxesColumn}>
                <FieldCheckboxGroup
                  className={css.checkboxGroupField}
                  id="isAllowOffer"
                  name="isAllowOffer"
                  options={[
                    {
                      key: 'off',
                      label: 'Do not allow offers',
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className={css.buttonsWrapper}>
            <Button
              className={css.submitButton}
              type="button"
              onClick={async () => {
                // Prepare updated values before submitting
                let finalLowestPrice = values.lowestPrice;

                if (!finalLowestPrice || finalLowestPrice === 0) {
                  finalLowestPrice =
                    typeof values.price === 'object'
                      ? values?.price?.amount
                        ? values?.price?.amount / 100
                        : 0
                      : Number(values?.price) / 100;
                }

                const updatedValues = {
                  ...values,
                  lowestPrice: finalLowestPrice,
                };

                setSubmitFormLoading(true);

                // Call the original handleSaveDraft with updated values
                await handleSaveDraft(updatedValues, redirectToPhotosTab);

                setTimeout(() => {
                  setSubmitFormLoading(false);
                  setSubmitFormReady(true);
                }, 1000);
              }}
              inProgress={submitFormLoading}
              disabled={!values.title}
              ready={submitFormReady}
            >
              {saveActionMsg}
            </Button>

            {!isDraft && (
              <Button
                className={css.submitButton}
                type="button"
                onClick={async () => {
                  // form.submit();
                  // Prepare updated values before submitting
                  let finalLowestPrice = values?.lowestPrice;

                  if (!finalLowestPrice || finalLowestPrice === 0) {
                    finalLowestPrice =
                      typeof values?.price === 'object'
                        ? values?.price?.amount
                          ? values?.price?.amount / 100
                          : 0
                        : Number(values?.price) / 100;
                  }

                  const cleanedRetailPrice = values.estimatedRetailPrice
                    ? Number(values.estimatedRetailPrice.toString().replace(/,/g, ''))
                    : 0;

                  const updatedValues = {
                    ...values,
                    lowestPrice: finalLowestPrice,
                    estimatedRetailPrice: cleanedRetailPrice,
                  };


                  setSubmitFormAndCloseLoading(true);

                  // Call the original handleSaveDraft with updated values
                  await handleSaveDraft(updatedValues, redirectToModifiedUrl);

                  setTimeout(() => {
                    setSubmitFormAndCloseLoading(false);
                    setSubmitFormAndCloseReady(true);
                    history.push('/listings');
                  }, 1000);
                }}
                inProgress={submitFormAndCloseLoading}
                disabled={!values.title}
                ready={submitFormAndCloseReady}
              >
                {intl.formatMessage({ id: 'EditListingWizard.saveAndColose' })}
              </Button>
            )}

            {isDraft && (
              <Button
                type="button"
                className={css.saveDraftButton}
                onClick={async () => {
                  try {
                    // Prepare updated values before submitting
                    let finalLowestPrice = values?.lowestPrice;

                    if (!finalLowestPrice || finalLowestPrice === 0) {
                      finalLowestPrice =
                        typeof values?.price === 'object'
                          ? values?.price?.amount
                            ? values?.price?.amount / 100
                            : 0
                          : Number(values?.price) / 100;
                    }

                    const cleanedRetailPrice = values.estimatedRetailPrice
                      ? Number(values.estimatedRetailPrice.toString().replace(/,/g, ''))
                      : 0;

                    const updatedValues = {
                      ...values,
                      lowestPrice: finalLowestPrice,
                      estimatedRetailPrice: cleanedRetailPrice,
                    };


                    setSaveDraftLoading(true);
                    await handleSaveDraft(updatedValues, redirectToModifiedUrl);
                    setSaveDraftLoading(false);
                    setSaveDraftReady(true);
                  } catch (e) {
                    console.log(e);
                  }
                }}
                inProgress={saveDraftLoading}
                disabled={!values.title}
                ready={saveDraftReady}
              >
                Save draft
              </Button>
            )}
          </div>
        </Form>
      );
    }}
  />
);

EditListingDetailsFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingDetailsFormComponent.propTypes = {
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    createListingDraftError: propTypes.error,
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  filterConfig: propTypes.filterConfig,
};

export default compose(injectIntl)(EditListingDetailsFormComponent);

// ################################# UPS  #################################
{
  /* <div className={css.infoBox}>
            <p className={css.infoBoxLabel}>UPS Shipping</p>
            <FieldTextInput
              id="ups_addressLine1"
              name="ups_addressLine1"
              className={css.textField}
              type="text"
              label={'Address line 1'}
              placeholder={'Address line 1'}
              validate={composeValidators(required('You need to complete this field'))}
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
              placeholder={'COBURG'}
              validate={composeValidators(required('You need to complete this field'))}
            />
            <FieldTextInput
              id="ups_state"
              name="ups_state"
              className={css.textField}
              type="text"
              label={'State'}
              placeholder={'OR'}
              validate={composeValidators(required('You need to complete this field'))}
            />
 
            <FieldTextInput
              id="ups_zip"
              name="ups_zip"
              className={css.textField}
              type="text"
              label={'ZIP'}
              placeholder={'00000'}
              validate={composeValidators(required('You need to complete this field'))}
            />
 
            <FieldTextInput
              id="ups_country"
              name="ups_country"
              className={css.textField}
              type="text"
              label={'Country'}
              placeholder={'US'}
              validate={composeValidators(required('You need to complete this field'))}
            />
            {upsAddressError && <p className={css.errorText}>Please enter a valid address</p>}
          </div> */
}

// #################################################################
