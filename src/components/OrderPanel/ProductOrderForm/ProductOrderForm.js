import React, { useEffect, useState } from 'react';
import { bool, func, number, string } from 'prop-types';
import { useDispatch } from 'react-redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { ToastContainer, toast } from 'react-toastify';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import config from '../../../config';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { numberAtLeast, required } from '../../../util/validators';

import { pushToPath } from '../../../util/urlHelpers';
import { setOpenModal } from '../../Topbar/ShoppingCart/ShoppingCart.duck';

import {
  Form,
  FieldSelect,
  FieldTextInput,
  InlineTextButton,
  PrimaryButton,
  Modal,
  Button,
} from '../../../components';
import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import './Toast.css';
import shippingIcon from './icons/shippingIcon.png';
import affirmLogo from './icons/affirm.png';
import css from './ProductOrderForm.module.css';
import { GoogleTagManagerHandler } from '../../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});
const renderForm = formRenderProps => {
  const {
    // FormRenderProps from final-form
    handleSubmit,
    form: formApi,

    // Custom props passed to the form component
    intl,
    formId,
    currentStock,
    hasMultipleDeliveryMethods,
    listingId,
    isOwnListing,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    values,
    listing,
    currentUser,
    history,
    pickupEnabled,
    shippingEnabled,
    isRestaurantOnHold,
    openMakeOfferModal,
    isOfferAccepted,
    proposedPriceAmount,
    setDeliveryMoreInfoModalOpen,
    setAffirmMoreInfoModalOpen,
    isProductAlreadyInCart,
    onUpdateCurrentUser,
    isAddToCart,
    currentTransaction,
    Info,
    isListingPage,
  } = formRenderProps;
  const isSold = listing?.attributes?.publicData?.sold;
  const { toggleMakeOffer } = listing?.attributes?.metadata || {};
  const { isAllowOffer } = listing?.attributes?.publicData;

  const dispatch = useDispatch();
  const openShoppingCartModal = () => dispatch(setOpenModal());

  useEffect(() => {
    require('react-toastify/dist/ReactToastify.css');
  }, []);

  useEffect(() => {
    if (isAddToCart) {
      handleFormSubmit({ preventDefault: () => null });
    }
  }, [isAddToCart]);

  const [sameVendorWarningModalOpen, setSameVendorWarningModalOpen] = useState(false);
  const [emptyCartModalOpen, setEmptyCartModalOpen] = useState(false);

  const handleOnChange = formValues => {
    const { quantity: quantityRaw, deliveryMethod } = formValues.values;
    const quantity = Number.parseInt(quantityRaw, 10);

    if (quantity && deliveryMethod && !fetchLineItemsInProgress && typeof window !== 'undefined') {
      onFetchTransactionLineItems({
        orderData: {
          quantity,
          deliveryMethod,
          proposedPriceAmount: isOfferAccepted ? proposedPriceAmount : null,
        },
        listingId,
        isOwnListing,
      });
    }
  };

  // In case quantity and deliveryMethod are missing focus on that select-input.
  // Otherwise continue with the default handleSubmit function.
  const handleFormSubmit = e => {
    if (currentUser) {
      const { quantity, deliveryMethod } = values || {};
      if (!quantity || quantity < 1) {
        e.preventDefault();
        // Blur event will show validator message
        formApi.blur('quantity');
        formApi.focus('quantity');
      } else if (!deliveryMethod) {
        e.preventDefault();
        // Blur event will show validator message
        formApi.blur('deliveryMethod');
        formApi.focus('deliveryMethod');
      } else {
        e.preventDefault();
        const currentListing = listing;
        return sdk.currentUser
          .show()
          .then(res => {
            const currentShoppingCart = res.data.data.attributes.profile.publicData.shoppingCart
              ? res.data.data.attributes.profile.publicData.shoppingCart
              : [];

            const currentShoppingCartUnwrapped = currentShoppingCart.map(item => {
              return {
                listing: typeof item.listing === 'string' ? JSON.parse(item.listing) : item.listing,
                checkoutValues:
                  typeof item.checkoutValues === 'string'
                    ? JSON.parse(item.checkoutValues)
                    : item.checkoutValues,
              };
            });
            const isFromSameVendor =
              currentShoppingCartUnwrapped.length === 0 ||
              currentShoppingCartUnwrapped.find(item => {
                return item.listing.author.id.uuid === currentListing.author.id.uuid;
              });

            if (isFromSameVendor) {
              const isAlreadyInTheBasket = currentShoppingCartUnwrapped.find(i => {
                return i.listing.id.uuid === currentListing.id.uuid;
              });

              if (isAlreadyInTheBasket) {
                // UPDATE EXISTING ITEM QUANTITY
                const updatedShoppingCard = currentShoppingCartUnwrapped.map(i => {
                  if (i.listing.id.uuid === currentListing.id.uuid) {
                    i.checkoutValues.quantity = (
                      Number(i.checkoutValues.quantity) + Number(quantity)
                    ).toString();
                    return i;
                  } else {
                    return i;
                  }
                });

                const stringifyUpdatedShoppingCart = updatedShoppingCard.map(item => {
                  return {
                    listing: JSON.stringify(item.listing),
                    checkoutValues: JSON.stringify(item.checkoutValues),
                  };
                });

                return sdk.currentUser
                  .updateProfile({
                    publicData: {
                      shoppingCart: [...stringifyUpdatedShoppingCart],
                    },
                  })
                  .then(res => {
                    // gtmHandler.trackCustomEvent("add_to_cart", {
                    //   ecommerce: [...stringifyUpdatedShoppingCart]
                    // });
                    toast.success('Added to basket!', {
                      position: 'top-right',
                      autoClose: 1500,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    });
                    onUpdateCurrentUser();
                    setTimeout(function () {
                      //Update user with redux ########
                      history.push('/s');
                      return openShoppingCartModal();
                    }, 2500);
                  })
                  .catch(e => console.log(e));
              } else {
                //ADD NEW ITEM TO CART

                const shoppingCartItem = {
                  listing: JSON.stringify({ ...currentListing }),
                  checkoutValues: JSON.stringify({ ...values }),
                };

                return sdk.currentUser
                  .updateProfile({
                    publicData: {
                      shoppingCart: [...currentShoppingCart, shoppingCartItem],
                    },
                  })
                  .then(res => {
                    gtmHandler.trackCustomEvent("add_to_cart", {
                      ecommerce: {
                        currency: currentListing.attributes.price.currency,
                        value: currentListing.attributes.price.amount * currentListing.currentStock.attributes.quantity,
                        items: [
                          {
                            item_id: currentListing.id,
                            item_name: currentListing.attributes.title,
                            item_brand: currentListing.attributes.publicData.branded === 'branded' ? currentListing.attributes.publicData.brandName : 'unbranded',
                            item_category: currentListing.attributes.publicData.category,
                            item_category2: currentListing.attributes.publicData.subcategory,
                            price: currentListing.attributes.price.amount,
                            quantity: currentListing.currentStock.attributes.quantity
                          }
                        ]
                      }
                    });
                    toast.success('Added to basket!', {
                      position: 'top-right',
                      autoClose: 1500,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    });
                    onUpdateCurrentUser();
                    setTimeout(function () {
                      history.push('/s');
                      return openShoppingCartModal();
                    }, 2500);
                  })
                  .catch(e => console.log(e));
              }
            } else {
              setSameVendorWarningModalOpen(true);
            }
          })
          .catch(e => console.log(e));

        // handleSubmit(e);
      }
    } else {
      const { quantity, deliveryMethod } = values || {};
      if (!quantity || quantity < 1) {
        e.preventDefault();
        // Blur event will show validator message
        formApi.blur('quantity');
        formApi.focus('quantity');
      } else if (!deliveryMethod) {
        e.preventDefault();
        // Blur event will show validator message
        formApi.blur('deliveryMethod');
        formApi.focus('deliveryMethod');
      } else {
        e.preventDefault();
        const currentListing = listing;

        const currentShoppingCart = JSON.parse(window.sessionStorage.getItem('shoppingCart')) ?? [];

        const currentShoppingCartUnwrapped = currentShoppingCart.map(item => {
          return {
            listing: typeof item.listing === 'string' ? JSON.parse(item.listing) : item.listing,
            checkoutValues:
              typeof item.checkoutValues === 'string'
                ? JSON.parse(item.checkoutValues)
                : item.checkoutValues,
          };
        });
        const isFromSameVendor =
          currentShoppingCartUnwrapped.length === 0 ||
          currentShoppingCartUnwrapped.find(item => {
            return item.listing.author.id.uuid === currentListing.author.id.uuid;
          });

        if (isFromSameVendor) {
          const isAlreadyInTheBasket = currentShoppingCartUnwrapped.find(i => {
            return i.listing.id.uuid === currentListing.id.uuid;
          });

          if (isAlreadyInTheBasket) {
            // UPDATE EXISTING ITEM QUANTITY
            const updatedShoppingCard = currentShoppingCartUnwrapped.map(i => {
              if (i.listing.id.uuid === currentListing.id.uuid) {
                i.checkoutValues.quantity = (
                  Number(i.checkoutValues.quantity) + Number(quantity)
                ).toString();
                return i;
              } else {
                return i;
              }
            });

            const stringifyUpdatedShoppingCart = updatedShoppingCard.map(item => {
              return {
                listing: JSON.stringify(item.listing),
                checkoutValues: JSON.stringify(item.checkoutValues),
              };
            });

            window.sessionStorage.setItem(
              'shoppingCart',
              JSON.stringify([...stringifyUpdatedShoppingCart])
            );
            toast.success('Added to basket!', {
              position: 'top-right',
              autoClose: 1500,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
            setTimeout(function () {
              history.push('/s');
              return openShoppingCartModal();
            }, 2500);
          } else {
            //ADD NEW ITEM TO CART

            const shoppingCartItem = {
              listing: JSON.stringify({ ...currentListing }),
              checkoutValues: JSON.stringify({ ...values }),
            };

            window.sessionStorage.setItem(
              'shoppingCart',
              JSON.stringify([...currentShoppingCart, shoppingCartItem])
            );
            toast.success('Added to basket!', {
              position: 'top-right',
              autoClose: 1500,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
            setTimeout(function () {
              history.push('/s');
              return openShoppingCartModal();
            }, 2500);
          }
        } else {
          setSameVendorWarningModalOpen(true);
        }

        // handleSubmit(e);
      }
    }
  };

  const clearBasket = () => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        return sdk.currentUser
          .updateProfile({
            publicData: {
              shoppingCart: [],
            },
          })
          .then(res => {
            window.location = window.location.href.split("?")[0];
          })
          .catch(e => console.log(e));
      } else {
        window.sessionStorage.setItem('shoppingCart', JSON.stringify([]));
        window.location = window.location.href.split("?")[0];
      }
    }
  };

  const handleFormSubmitBasic = e => {
    const { quantity, deliveryMethod } = values || {};
    if (!quantity || quantity < 1) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('quantity');
      formApi.focus('quantity');
    } else if (!deliveryMethod) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('deliveryMethod');
      formApi.focus('deliveryMethod');
    } else {
      handleSubmit(e);
    }
  };

  const breakdownData = {};
  const showBreakdown =
    breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;
  const breakdown = showBreakdown ? (
    <div className={css.breakdownWrapper}>
      <h3>
        <FormattedMessage id="ProductOrderForm.breakdownTitle2" />
      </h3>
      <EstimatedCustomerBreakdownMaybe
        unitType={config.lineItemUnitType}
        breakdownData={breakdownData}
        lineItems={lineItems}
        listing={listing}
        isListingPage={isListingPage}
      />
    </div>
  ) : null;

  const showContactUser = typeof onContactUser === 'function';

  const onClickContactUser = e => {
    e.preventDefault();
    onContactUser();
  };

  const onClickAddToCartWithoutLogin = e => {
    e.preventDefault();
    return history.push('/login');
  };

  const contactSellerLink = (
    <InlineTextButton onClick={onClickContactUser}>
      <FormattedMessage id="ProductOrderForm.finePrintNoStockLinkText" />
    </InlineTextButton>
  );
  const quantityRequiredMsg = intl.formatMessage({ id: 'ProductOrderForm.quantityRequired' });

  const hasStock = currentStock && currentStock > 0 && !isSold;
  const quantities = hasStock ? [...Array(currentStock).keys()].map(i => i + 1) : [];
  const hasNoStockLeft = typeof currentStock != null && currentStock === 0;
  const hasOneItemLeft = typeof currentStock != null && currentStock === 1;

  const submitInProgress = fetchLineItemsInProgress;
  const submitDisabled = !hasStock;

  const shoppingCartFromSession =
    typeof window !== 'undefined' ? JSON.parse(window.sessionStorage.getItem('shoppingCart')) : [];

  const currentShopCart = currentUser
    ? currentUser.attributes.profile.publicData.shoppingCart
      ? currentUser.attributes.profile.publicData.shoppingCart
      : []
    : shoppingCartFromSession ?? [];

  const currentShopCartUnwrapped = currentShopCart.map(item => {
    return {
      listing: typeof item.listing === 'string' ? JSON.parse(item.listing) : item.listing,
      checkoutValues:
        typeof item.checkoutValues === 'string'
          ? JSON.parse(item.checkoutValues)
          : item.checkoutValues,
    };
  });

  const hostIdOfFirstItem =
    currentShopCartUnwrapped.length > 0
      ? currentShopCartUnwrapped[0].listing.author.id.uuid
      : false;

  const deliveryMethodOfItemsAdded =
    currentShopCartUnwrapped && currentShopCartUnwrapped.length > 0
      ? currentShopCartUnwrapped[0].checkoutValues.deliveryMethod
      : false;

  const pickup = pickupEnabled
    ? [
      {
        value: 'pickup',
        label: 'ProductOrderForm.pickupOption',
      },
    ]
    : [];

  const shipping = shippingEnabled
    ? [
      {
        value: 'shipping',
        label: 'UPS',
      },
    ]
    : [];

  const deliveryMethodsOptions = [...pickup, ...shipping];

  const missingDeliveryMethod = deliveryMethodOfItemsAdded
    ? !!!deliveryMethodsOptions.find(x => {
      return x.value === deliveryMethodOfItemsAdded;
    })
    : false;

  return (
    <Form
      onSubmit={isOfferAccepted && proposedPriceAmount ? handleFormSubmitBasic : handleFormSubmit}
    >
      <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
      {hasNoStockLeft ? null : hasOneItemLeft ? (
        <FieldTextInput
          id={`${formId}.quantity`}
          className={css.quantityField}
          name="quantity"
          type="hidden"
          validate={numberAtLeast(quantityRequiredMsg, 1)}
        />
      ) : (
        <FieldSelect
          id={`${formId}.quantity`}
          className={css.quantityField}
          name="quantity"
          disabled={!hasStock || missingDeliveryMethod}
          label={intl.formatMessage({ id: 'ProductOrderForm.quantityLabel' })}
          validate={numberAtLeast(quantityRequiredMsg, 1)}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ProductOrderForm.selectQuantityOption' })}
          </option>
          {quantities.map(quantity => (
            <option key={quantity} value={quantity}>
              {intl.formatMessage({ id: 'ProductOrderForm.quantityOption' }, { quantity })}
            </option>
          ))}
        </FieldSelect>
      )}

      {hasNoStockLeft || missingDeliveryMethod ? (
        missingDeliveryMethod ? (
          <p className={css.infoText}>
            <HelpOutlineIcon className={css.helpIcon} onClick={() => setEmptyCartModalOpen(true)} />
            {`This product is only available for ${deliveryMethodsOptions[0].value
              }, please choose ${deliveryMethodsOptions[0].value === 'pickup' ? 'shippable' : 'pickup'
              } items`}
          </p>
        ) : null
      ) : (
        // hasMultipleDeliveryMethods ? (
        <FieldSelect
          id={`${formId}.deliveryMethod`}
          className={css.deliveryField}
          name="deliveryMethod"
          disabled={!hasStock}
          label={intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}
          validate={required(intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodRequired' }))}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ProductOrderForm.selectDeliveryMethodOption' })}
          </option>

          {deliveryMethodOfItemsAdded
            ? deliveryMethodsOptions
              .filter(o => {
                return o.value === deliveryMethodOfItemsAdded;
              })
              .map(i => {
                return (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                );
              })
            : deliveryMethodsOptions.map(i => {
              return (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              );
            })}
        </FieldSelect>
      )}

      {!isOwnListing && currentUser?.id?.uuid && (
        <div className={css.buttonsWrapper}>
          <PrimaryButton
            className={
              isOfferAccepted && proposedPriceAmount ? css.longButton : css.addToCartButton
            }
            type="submit"
            inProgress={submitInProgress}
            disabled={
              submitDisabled ||
              missingDeliveryMethod ||
              isRestaurantOnHold ||
              isProductAlreadyInCart
            }
          >
            {isOfferAccepted && proposedPriceAmount ? (
              <FormattedMessage id="BookingDatesForm.buyAfterOfferIsAccepted" />
            ) : hasStock ? (
              <FormattedMessage id="BookingDatesForm.addToCart" />
            ) : (
              <FormattedMessage id="ProductOrderForm.ctaButtonNoStock" />
            )}
          </PrimaryButton>

          {!isOfferAccepted && !proposedPriceAmount && hasStock && !isAllowOffer && toggleMakeOffer !== 'off' && (
            <PrimaryButton
              className={css.offerButton}
              type="button"
              onClick={openMakeOfferModal}
              disabled={isProductAlreadyInCart}
            >
              <FormattedMessage id="ProductOrderForm.makeAnOffer" />
            </PrimaryButton>
          )}
        </div>
      )}

      <Info />

      {!isOwnListing && breakdown}

      {!isOwnListing && (
        <div className={css.buttonsWrapperDesktop}>
          <PrimaryButton
            className={
              isOfferAccepted && proposedPriceAmount ? css.longButton : css.addToCartButton
            }
            type="submit"
            inProgress={submitInProgress}
            disabled={
              submitDisabled ||
              missingDeliveryMethod ||
              isRestaurantOnHold ||
              isProductAlreadyInCart
            }
          >
            {isOfferAccepted && proposedPriceAmount ? (
              <FormattedMessage id="BookingDatesForm.buyAfterOfferIsAccepted" />
            ) : hasStock ? (
              <FormattedMessage id="BookingDatesForm.addToCart" />
            ) : (
              <FormattedMessage id="ProductOrderForm.ctaButtonNoStock" />
            )}
          </PrimaryButton>

          {!isOfferAccepted && !proposedPriceAmount && hasStock && !isAllowOffer && toggleMakeOffer !== 'off' && (
            <PrimaryButton
              className={css.offerButton}
              type="button"
              onClick={openMakeOfferModal}
              disabled={isProductAlreadyInCart}
            >
              <FormattedMessage id="ProductOrderForm.makeAnOffer" />
            </PrimaryButton>
          )}
        </div>
      )}

      {!currentUser?.id?.uuid && (
        <div className={css.buttonsWrapper}>
          <PrimaryButton
            className={css.addToCartButton}
            inProgress={submitInProgress}
            type="submit"
            disabled={
              submitDisabled ||
              missingDeliveryMethod ||
              isRestaurantOnHold ||
              isProductAlreadyInCart
            }
          >
            {isOfferAccepted && proposedPriceAmount ? (
              <FormattedMessage id="BookingDatesForm.buyAfterOfferIsAccepted" />
            ) : hasStock ? (
              <FormattedMessage id="BookingDatesForm.addToCart" />
            ) : (
              <FormattedMessage id="ProductOrderForm.ctaButtonNoStock" />
            )}
          </PrimaryButton>

          {hasStock && toggleMakeOffer !== 'off' && !isAllowOffer ? (
            <PrimaryButton
              className={css.offerButton}
              type="button"
              onClick={onClickAddToCartWithoutLogin}
              disabled={isProductAlreadyInCart}
            >
              <FormattedMessage id="ProductOrderForm.makeAnOffer" />
            </PrimaryButton>
          ) : null}
        </div>
      )}

      {!isOwnListing && currentUser?.id?.uuid && !!hasStock && (
        <p className={css.finePrint}>
          {hasStock ? (
            <FormattedMessage id="ProductOrderForm.finePrint" />
          ) : showContactUser ? (
            <FormattedMessage
              id="ProductOrderForm.finePrintNoStock"
              values={{ contactSellerLink }}
            />
          ) : null}
        </p>
      )}

      <div className={css.deliveryInfoWrapper}>
        <img src={affirmLogo} className={css.affirmLogo} />
        <FormattedMessage id="ProductOrderForm.buyNowPayLater" />
        <span className={css.moreInfoButton} onClick={() => setAffirmMoreInfoModalOpen(true)}>
          <FormattedMessage id="ProductOrderForm.moreInfo" />
        </span>
      </div>

      <div className={css.deliveryInfoWrapper}>
        <img src={shippingIcon} className={css.shippingIcon} />
        <FormattedMessage id="ProductOrderForm.shippingIconInfo" />
        <span className={css.moreInfoButton} onClick={() => setDeliveryMoreInfoModalOpen(true)}>
          <FormattedMessage id="ProductOrderForm.moreInfo" />
        </span>
      </div>

      {/* not same vendor warning */}

      <Modal
        id="sameVendorModal"
        isOpen={sameVendorWarningModalOpen}
        onClose={() => {
          setSameVendorWarningModalOpen(false);
        }}
        onManageDisableScrolling={() => { }}
      >
        <center>
          <h2>
            <FormattedMessage id="ListingPage.sameVendorModalTitle" />
          </h2>
        </center>

        <div className={css.modalButtonsWrapper}>
          <Button type="button" className={css.modalButton} onClick={clearBasket}>
            <FormattedMessage id="ListingPage.clearBasket" />
          </Button>

          <Button
            type="button"
            className={css.modalButton}
            onClick={() => pushToPath(`/s?pub_hostId=${hostIdOfFirstItem}`)}
          >
            <FormattedMessage id="ListingPage.seeSameVendorListings" />
          </Button>
        </div>
      </Modal>

      {/* empty cart modal / when delivery method needs to change */}

      <Modal
        id="emptyCartModal"
        isOpen={emptyCartModalOpen}
        onClose={() => {
          setEmptyCartModalOpen(false);
        }}
        onManageDisableScrolling={() => { }}
      >
        <center>
          <h2>
            <FormattedMessage
              id="ListingPage.emptyCartModalTitle"
              values={{
                method: `${deliveryMethodsOptions[0].value === 'pickup' ? 'pickup' : 'ship'}`,
              }}
            />
          </h2>
        </center>

        <Button type="button" onClick={clearBasket}>
          <FormattedMessage id="ListingPage.emptyCart" />
        </Button>
      </Modal>

      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Form>
  );
};

const ProductOrderForm = props => {
  const intl = useIntl();
  const {
    price,
    currentStock,
    pickupEnabled,
    shippingEnabled,
    isRestaurantOnHold,
    productName,
    currentTransaction,
  } = props;

  // Should not happen for listings that go through EditListingWizard.
  // However, this might happen for imported listings.
  if (!pickupEnabled && !shippingEnabled) {
    <p className={css.error}>
      <FormattedMessage id="ProductOrderForm.noDeliveryMethodSet" />
    </p>;
  }

  if (!price) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProductOrderForm.listingPriceMissing" />
      </p>
    );
  }
  if (price.currency !== config.currency) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProductOrderForm.listingCurrencyInvalid" />
      </p>
    );
  }
  const hasOneItemLeft = currentStock && currentStock === 1;
  const quantityMaybe = { quantity: '1' };
  const singleDeliveryMethodAvailableMaybe =
    // shippingEnabled ?
    // { deliveryMethod: 'shipping' }
    // :
    shippingEnabled && !pickupEnabled
      ? { deliveryMethod: 'shipping' }
      : !shippingEnabled && pickupEnabled
        ? { deliveryMethod: 'pickup' }
        : { deliveryMethod: 'shipping' };
  const hasMultipleDeliveryMethods = pickupEnabled && shippingEnabled;
  const initialValues = { ...quantityMaybe, ...singleDeliveryMethodAvailableMaybe };
  return (
    <FinalForm
      initialValues={(initialValues, { deliveryMethod: 'shipping', quantity: 1 })}
      hasMultipleDeliveryMethods={hasMultipleDeliveryMethods}
      {...props}
      intl={intl}
      pickupEnabled={pickupEnabled}
      shippingEnabled={shippingEnabled}
      render={renderForm}
    />
  );
};

ProductOrderForm.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  currentStock: null,
  listingId: null,
  isOwnListing: false,
  lineItems: null,
  fetchLineItemsError: null,
  isAddToCart: false,
};

ProductOrderForm.propTypes = {
  rootClassName: string,
  className: string,

  // form
  formId: string.isRequired,
  onSubmit: func.isRequired,

  // listing
  listingId: propTypes.uuid,
  price: propTypes.money,
  currentStock: number,
  isOwnListing: bool,

  // line items
  lineItems: propTypes.lineItems,
  onFetchTransactionLineItems: func.isRequired,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // other
  onContactUser: func,
  isAddToCart: bool,
};

export default ProductOrderForm;
