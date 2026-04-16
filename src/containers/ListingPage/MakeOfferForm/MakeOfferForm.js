import React, { useState } from 'react';
import { string, bool } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy, Field } from 'react-final-form';
import classNames from 'classnames';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { propTypes } from '../../../util/types';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  IconEnquiry,
  FieldCurrencyInput,
  Button,
} from '../../../components';

import css from './MakeOfferForm.module.css';
import config from '../../../config';
import { formatMoney } from '../../../util/currency';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { prop } from 'ramda';
import { listing } from '../../../config/marketplace-custom-config';

const { Money } = sdkTypes;

const CustomChip = ({ label, dynamicText, dynamicTextSize, handleOnClick }) => {
  return (

    <Chip
      variant="outlined"
      onClick={handleOnClick}
      sx={{
        height: 'auto',
        '& .MuiChip-label': {
          display: 'block',
          whiteSpace: 'normal',
        },
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)', // Change background color on hover
        },
        '& .MuiChip-label': {
          display: 'block',
          whiteSpace: 'normal',
        },
      }}
      label={
        <Stack direction="column" spacing={1} alignItems="center" justifyContent="center">
          <Typography variant={dynamicTextSize}><b>${dynamicText}</b></Typography>
          <Typography>{label}</Typography>
        </Stack>
      }

    // label={
    //   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    //     <Typography variant={dynamicTextSize} style={{ marginBottom: '4px' }}>{dynamicText}</Typography>
    //     <Typography>{label}</Typography>
    //   </div>
    // }
    //}
    />
    //     <Chip
    //   sx={{
    //     height: 'auto',
    //     '& .MuiChip-label': {
    //       display: 'block',
    //       whiteSpace: 'normal',
    //     },
    //   }}
    //   label="This is a chip that has multiple lines."
    // />
  );
};

const MakeOfferFormComponent = props => {
  const { intl, listingPrice, ...formProps } = props;

  return (
    <FinalForm
      {...props}
      initialValues={{ proposedPrice: listingPrice.amount / 100 }}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          submitButtonWrapperClassName,
          formId,
          handleSubmit,
          inProgress,
          intl,
          listingTitle,
          authorDisplayName,
          sendEnquiryError,
          customErrorText,
          //listingPrice,
          form,
        } = fieldRenderProps;

        const [proposedPrice, setProposedPrice] = //useState(new Money(listingPrice.amount, 'USD')); // initial value
          useState(listingPrice.amount / 100); // initial value

        // format money with 2 decimals
        //const initialValue15 = ((listingPrice.amount - listingPrice.amount * 0.15)/100).toFixed(2);
        const initialValue10 = ((listingPrice.amount - listingPrice.amount * 0.10) / 100).toFixed(2);
        const initialValue15 = ((listingPrice.amount - listingPrice.amount * 0.15) / 100).toFixed(2);
        const initialValue20 = ((listingPrice.amount - listingPrice.amount * 0.20) / 100).toFixed(2);

        const [dynamicTextValue10, setDynamicTextValue1] = useState(initialValue10);
        const [dynamicTextValue15, setDynamicTextValue2] = useState(initialValue15);
        const [dynamicTextValue20, setDynamicTextValue3] = useState(initialValue20);

        const messageLabel = intl.formatMessage(
          {
            id: 'MakeOfferForm.messageLabel',
          },
          { authorDisplayName }
        );
        const messagePlaceholder = intl.formatMessage(
          {
            id: 'MakeOfferForm.messagePlaceholder',
          },
          { authorDisplayName }
        );
        const messageRequiredMessage = intl.formatMessage({
          id: 'MakeOfferForm.messageRequired',
        });
        const messageRequired = validators.requiredAndNonEmptyString(messageRequiredMessage);

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = submitInProgress;

        const priceRequired = validators.required(
          intl.formatMessage({
            id: 'MakeOfferForm.priceRequired',
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
        // const handleDiscountChange = (event) => {
        //   const { value } = event.target;
        //   if (value !== 'custom') {
        //     const discountValue = parseFloat(value.replace('%', '')) / 100; // Ensure '%' is removed and value is correctly parsed
        //     const discountedPrice = listingPrice.amount - (listingPrice.amount * discountValue);
        //     form.change('proposedPrice', new Money(discountedPrice, 'USD')); // Update form state
        //   } else {
        //     form.change('proposedPrice', ''); // Clear if 'custom' is selected
        //   }
        // };

        const handleProposedPriceChange = (value) => {
          // Directly update the form value for proposedPrice
          //form.change('proposedPrice', value);
        };


        const handleOnChange = formValues => {
          // const { discount, proposedPrice } = formValues.values;

          // if (discount) {
          //   const discountValue = parseFloat(discount.replace('%', '')) / 100; // Ensure '%' is removed and value is correctly parsed
          //   const discountedPrice = listingPrice.amount - (listingPrice.amount * discountValue);
          //   const proposedPriceValue = proposedPrice && proposedPrice.amount ? proposedPrice.amount : null;

          //   // Check if the new discounted price is different from the current proposed price


          //   if (!proposedPriceValue || (proposedPriceValue !== discountedPrice)) {
          //     form.change('proposedPrice', new Money(discountedPrice, 'USD')); // Assuming Money takes smallest currency unit, e.g., cents
          //     console.log('proposedPrice changed!', proposedPrice);

          //     form.blur('proposedPrice');
          //     form.focus('proposedPrice');
          //   }
          // } else {
          //   // Here, revert to the full listing price if 'custom' is selected,
          //   // but first check if it's already set to avoid the loop.
          //   const fullPrice = listingPrice.amount;
          //   const proposedPriceValue = proposedPrice && proposedPrice.amount ? proposedPrice.amount : null;

          //   if (!proposedPriceValue || (proposedPriceValue.toFixed(2) !== fullPrice.toFixed(2))) {
          //     form.change('proposedPrice', new Money(listingPrice.amount, 'USD')); // Assuming Money expects cents
          //     form.blur('proposedPrice');
          //     form.focus('proposedPrice');
          //   }
          // }
        };

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
            <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
            <IconEnquiry className={css.icon} />

            <div className={css.discountOptions} >
              <Field name="discount" type="radio" value="10%" component="input">
                {({ input }) => (
                  <CustomChip label="10% OFF" dynamicText={dynamicTextValue10} dynamicTextSize="h6"
                    handleOnClick={
                      () => {
                        console.log('10% clicked');
                        setProposedPrice(initialValue10); // update the proposed price
                        form.change('proposedPrice', initialValue10);
                      }
                    }
                  />
                )}
              </Field>

              <Field name="discount" type="radio" value="10%" component="input">
                {({ input }) => (
                  <CustomChip label="15% OFF" dynamicText={dynamicTextValue15} dynamicTextSize="h6"
                    handleOnClick={
                      () => {
                        console.log('15% clicked');
                        setProposedPrice(initialValue15); // update the proposed price
                        form.change('proposedPrice', initialValue15);
                      }
                    }
                  />
                )}
              </Field>

              <Field name="discount" type="radio" value="5%" component="input">
                {({ input }) => (
                  <CustomChip label="20% OFF" dynamicText={dynamicTextValue20} dynamicTextSize="h6"
                    handleOnClick={
                      () => {
                        console.log('20% clicked');
                        //setProposedPrice(new Money(initialValue5, 'USD')); // update the proposed price
                        setProposedPrice(initialValue20); // update the proposed price
                        form.change('proposedPrice', initialValue20);
                        //form.change('proposedPrice', new Money(initialValue5, 'USD'));
                      }
                    }
                  />
                )}
              </Field>
            </div>

            <h2 className={css.heading}>
              <FormattedMessage id="MakeOfferForm.heading" values={{ listingTitle }} />
            </h2>
            {/* <FieldTextInput
            className={css.field}
            type="textarea"
            name="message"
            id={formId ? `${formId}.message` : 'message'}
            label={messageLabel}
            placeholder={messagePlaceholder}
            validate={messageRequired}
          /> */}

            <FieldTextInput
              id={`${formId}.proposedPrice`}
              name="proposedPrice"
              type="text"
              label={messageLabel}
              customErrorText={customErrorText}
            //placeholder={messagePlaceholder}
            // validate={}
            />

            {/* <FieldCurrencyInput
            id={`${formId}.proposedPrice`}
            name="proposedPrice"
            value={proposedPrice}
            
            className={css.input}
            // label={intl.formatMessage({ id: 'MakeOfferForm.proposedPriceLabel' })}
            placeholder={intl.formatMessage({ id: 'MakeOfferForm.proposedPricePlaceholder' })}
            currencyConfig={config.currencyConfig}
            validate={priceValidators}
          /> */}
            <div className={submitButtonWrapperClassName}>
              {sendEnquiryError ? (
                <p className={css.error}>
                  <FormattedMessage id="MakeOfferForm.sendEnquiryError" />
                </p>
              ) : null}
              <Button type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="MakeOfferForm.submitButtonText" />
              </Button>
            </div>
          </Form>
        );
      }}
    />
  )
};

MakeOfferFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  inProgress: false,
  sendEnquiryError: null,
};

MakeOfferFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  inProgress: bool,
  formId: string.isRequired,

  listingTitle: string.isRequired,
  authorDisplayName: string.isRequired,
  sendEnquiryError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,
};

const MakeOfferForm = compose(injectIntl)(MakeOfferFormComponent);

MakeOfferForm.displayName = 'MakeOfferForm';

export default MakeOfferForm;
