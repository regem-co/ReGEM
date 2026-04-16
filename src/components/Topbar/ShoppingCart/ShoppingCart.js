import React, { useState, useEffect } from 'react';
import { array } from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useHistory } from 'react-router-dom';

import { FormattedMessage, useIntl } from '../../../util/reactIntl.js';
import { createSlug, pushToPath } from '../../../util/urlHelpers.js';
import { formatMoney } from '../../../util/currency.js';
import { types as sdkTypes } from '../../../util/sdkLoader.js';
import config from '../../../config/index.js';
import routeConfiguration from '../../../routing/routeConfiguration.js';
import { createResourceLocatorString } from '../../../util/routes.js';

import { setInitialValues } from '../../../containers/CheckoutPage/CheckoutPage.duck.js';
import { initializeCardPaymentData } from '../../../ducks/stripe.duck.js';
import { setPaymentMethodToSession } from '../../../containers/CheckoutPage/utils.js';

import { Modal, Button, IconSpinner } from '../../index.js';

import {
  deleteCartItem,
  fetchShoppingCart,
  mergeCartItem,
  setCloseModal,
  setOpenModal,
} from './ShoppingCart.duck.js';
import shoppingBagIcon from './images/shoppingBagIcon.png';
import { handleSaveCartItemsToProfile } from './ShoppingCart.utils.js';

import css from './ShoppingCart.module.css';

const minOrderAmount = process.env.REACT_APP_MIN_CHECKOUT_AMOUNT;
const { UUID } = sdkTypes;

const { Money } = sdkTypes;

const ShoppingCart = props => {
  const { mobile, setHideMobileMenuCloseButton } = props;
  const dispatch = useDispatch();
  const intl = useIntl();
  const history = useHistory();

  const isAuthenticated = useSelector(state => state.Auth.isAuthenticated);
  const currentUser = useSelector(state => state.user.currentUser);
  const isOpenModal = useSelector(state => state.ShoppingCart.isOpenModal);
  const shoppingCartItems = useSelector(state => state.ShoppingCart.shoppingCart) || [];
  const fetchShoppingCartInProgress = useSelector(
    state => state.ShoppingCart.fetchShoppingCartInProgress
  );
  const deleteCartItemInProgress = useSelector(
    state => state.ShoppingCart.deleteCartItemInProgress
  );
  const mergeCartItemInProgress = useSelector(state => state.ShoppingCart.mergeCartItemInProgress);

  const [subShoppingCartItems, setSubShoppingCartItems] = useState([]);
  const [notLoggedInWarning, setNotLoggedInWarning] = useState(false);
  const [isSameVendor, setIsSameVendor] = useState(true);

  const onMergeCartItem = params => dispatch(mergeCartItem(params));
  const onDeleteCartItem = deletedId => dispatch(deleteCartItem({ deletedId }));
  const onFetchShoppingCart = payload => dispatch(fetchShoppingCart(payload));
  const openModal = () => dispatch(setOpenModal());
  const closeModal = () => dispatch(setCloseModal());
  const callSetInitialValues = (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage));

  useEffect(() => {
    if (isOpenModal) {
      setIsSameVendor(true);
    }
    onFetchShoppingCart();
    if (isAuthenticated) {
      const shoppingCartNonLogin = JSON.parse(window.sessionStorage.getItem('shoppingCart'))?.map(
        item => {
          return {
            listing: JSON.parse(
              typeof item.listing === 'string' ? item.listing : JSON.stringify(item.listing)
            ),
            checkoutValues: JSON.parse(
              typeof item.checkoutValues === 'string'
                ? item.checkoutValues
                : JSON.stringify(item.checkoutValues)
            ),
          };
        }
      );
      setSubShoppingCartItems(shoppingCartNonLogin || []);
    }
  }, [isOpenModal, isAuthenticated]);

  const mergeItems = () => {
    handleSaveCartItemsToProfile({
      onMergeCartItem,
      onWarnNotSameVendor: () => setIsSameVendor(false),
      onSaveCompleted: () => {
        setSubShoppingCartItems([]);
      },
      newShoppingCartItems: subShoppingCartItems,
      savedShoppingCartItems: shoppingCartItems,
    });
  };

  const clearNonLoginItems = () => {
    window.sessionStorage.setItem('shoppingCart', JSON.stringify([]));
    setSubShoppingCartItems([]);
  };

  let totalPrice;
  let totalOrderAmount = 0;

  if (shoppingCartItems.length > 0) {
    const amountsArray = shoppingCartItems.map(i => {
      return i.listing.attributes.price.amount * Number(i.checkoutValues.quantity);
    });
    const totalAmount = amountsArray.reduce(
      (previousValue, currentValue) => previousValue + currentValue,
      0
    );
    totalOrderAmount = totalAmount;
    totalPrice = intl
      ? formatMoney(intl, new Money(totalAmount, config.currency))
      : `${totalAmount / 100} ${config.currency}`;
  }

  const isBelowMininumAmount = totalOrderAmount < Number(minOrderAmount) * 100;
  // const callSetInitialValues = (setInitialValues, values, saveToSessionStorage) => {
  //         return setInitialValues(values, saveToSessionStorage)
  // }

  const toCheckout = () => {
    if (currentUser) {
      closeModal();
      const listingId = new UUID(shoppingCartItems[0].listing.id.uuid);
      const listing = shoppingCartItems[0].listing;

      const orderData = shoppingCartItems[0].checkoutValues;
      // const restOfShoppingCartItems = [...shoppingCartItems];
      // restOfShoppingCartItems.shift();
      // bookingData.restOfShoppingCartItems = restOfShoppingCartItems;

      const restOfShoppingCartItems = [...shoppingCartItems];
      restOfShoppingCartItems.shift();
      orderData.restOfShoppingCartItems = restOfShoppingCartItems;

      const initialValues = {
        listing,
        orderData,
        confirmPaymentError: null,
      };

      const saveToSessionStorage = true;

      const routes = routeConfiguration();
      // Customize checkout page state with current listing and selected bookingDates
      // const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);

      callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

      // Clear previous Stripe errors from store if there is any
      initializeCardPaymentData();

      // Redirect to CheckoutPage
      history.push(
        createResourceLocatorString(
          'CheckoutPage',
          routes,
          { id: listing.id.uuid, slug: createSlug(listing.attributes.title) },
          {}
        )
      );
    } else {
      setNotLoggedInWarning(true);
    }
  };

  const toCardCheckout = () => {
    setPaymentMethodToSession('card');
    toCheckout();
  };

  const toAffirmCheckout = () => {
    setPaymentMethodToSession('affirm');
    toCheckout();
  };

  const shippingItem = shoppingCartItems.find(item => {
    return item.checkoutValues.deliveryMethod === 'shipping';
  });

  let quantityTotal = 0;

  shoppingCartItems.forEach(item => {
    quantityTotal += Number(item.checkoutValues.quantity);
  });
  subShoppingCartItems.forEach(item => {
    quantityTotal += Number(item.checkoutValues.quantity);
  });

  return (
    <>
      <div
        className={css.shoppingCartWrapper}
        onClick={() => {
          openModal();
          if (mobile && setHideMobileMenuCloseButton) {
            setHideMobileMenuCloseButton(true);
          }
        }}
      >
        {shoppingCartItems.length + subShoppingCartItems.length > 0 ? (
          <div className={css.itemsCount}>{quantityTotal}</div>
        ) : null}

        {<img src={shoppingBagIcon} className={css.bagIcon} />}
      </div>

      <Modal
        id="shoppingCartModal"
        isOpen={isOpenModal}
        onClose={() => {
          closeModal();

          if (mobile && setHideMobileMenuCloseButton) {
            setHideMobileMenuCloseButton(false);
          }
        }}
        onManageDisableScrolling={() => {}}
        doubleModal={mobile}
        additionalContainerClassName={css.modalContainer}
        additionalContentClassName={css.modalContent}
      >
        <h2 className={css.modalTitle}>
          <FormattedMessage id="ShoppingCart.modalTitle" />
        </h2>
        {fetchShoppingCartInProgress || shoppingCartItems.length === 0 ? (
          <div className={css.cartNoItemsWrapper}>
            {' '}
            {mobile ? <br /> : null}
            <center>
              <h2>
                {fetchShoppingCartInProgress ? (
                  <IconSpinner />
                ) : (
                  <FormattedMessage id="ShoppingCart.emptyTitle" />
                )}
              </h2>
            </center>
            <br />
            {subShoppingCartItems.length > 0 && (
              <div className={css.nonLoginItemsContainer}>
                <p className={css.noticeAboutNonLoginItems}>
                  These below items were added when you are not login. <br />
                  Do you want to merge these items into your profile?
                </p>
                <div className={css.mergeActions}>
                  <Button
                    className={css.mergeItems}
                    onClick={mergeItems}
                    inProgress={mergeCartItemInProgress}
                  >
                    Merge
                  </Button>
                  <Button className={css.mergeItems} onClick={clearNonLoginItems}>
                    Clear
                  </Button>
                </div>

                {subShoppingCartItems.map(item => {
                  const totalItemAmount =
                    item.listing.attributes.price.amount * Number(item.checkoutValues.quantity);
                  const totalPriceOfItem = new Money(totalItemAmount, config.currency);
                  const formattedPrice = intl
                    ? formatMoney(intl, totalPriceOfItem)
                    : `${totalItemAmount / 100} ${totalPriceOfItem.currency}`;

                  const itemImage =
                    item.listing.images[0]?.attributes?.variants?.['listing-card-6x']?.url;

                  return (
                    <div className={css.cartItem} key={item.listing.id.uuid}>
                      <div className={css.cartItemLeft}>
                        <img src={itemImage} className={css.cartItemImage} />
                        <span>
                          <a
                            onClick={() =>
                              pushToPath(
                                `/l/${item.listing.attributes.title.replace(' ', '-')}/${
                                  item.listing.id.uuid
                                }`
                              )
                            }
                          >
                            {item.listing.attributes.title}
                          </a>
                        </span>
                      </div>

                      <div className={css.cartItemRight}>
                        <span>{formattedPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <br />
            <Button onClick={() => pushToPath('/s')}>
              <FormattedMessage id="ShoppingCart.searchListing" />
            </Button>
          </div>
        ) : (
          <div className={css.cartItemsWrapper}>
            {shoppingCartItems.map(item => {
              const totalItemAmount =
                item.listing.attributes.price.amount * Number(item.checkoutValues.quantity);
              const totalPriceOfItem = new Money(totalItemAmount, config.currency);
              const formattedPrice = intl
                ? formatMoney(intl, totalPriceOfItem)
                : `${totalItemAmount / 100} ${totalPriceOfItem.currency}`;

              const itemImage =
                item.listing.images[0]?.attributes?.variants?.['listing-card-6x']?.url;

              return (
                <div className={css.cartItem} key={item.listing.id.uuid}>
                  <div className={css.cartItemLeft}>
                    <img src={itemImage} className={css.cartItemImage} />
                    <span>
                      <a
                        onClick={() =>
                          pushToPath(
                            `/l/${item.listing.attributes.title.replace(' ', '-')}/${
                              item.listing.id.uuid
                            }`
                          )
                        }
                      >
                        {item.listing.attributes.title}
                      </a>
                    </span>
                  </div>

                  <div className={css.cartItemRight}>
                    {deleteCartItemInProgress ? (
                      <IconSpinner className={css.deleteIcon} />
                    ) : (
                      <DeleteOutlineIcon
                        className={css.deleteIcon}
                        onClick={() => onDeleteCartItem(item.listing.id.uuid)}
                      />
                    )}

                    <span>{formattedPrice}</span>
                  </div>
                </div>
              );
            })}

            {subShoppingCartItems.length > 0 && (
              <div className={css.nonLoginItemsContainer}>
                {!isSameVendor && (
                  <p className={css.noticeAboutNotSameVendor}>
                    These items are not same vendor, please clear below items or your saved items above.
                  </p>
                )}
                <p className={css.noticeAboutNonLoginItems}>
                  These below items were added when you are not login. <br />
                  Do you want to save these items into your shopping cart?
                </p>
                <div className={css.mergeActions}>
                  <Button
                    className={css.mergeItems}
                    onClick={mergeItems}
                    inProgress={mergeCartItemInProgress}
                  >
                    Merge
                  </Button>
                  <Button className={css.mergeItems} onClick={clearNonLoginItems}>
                    Clear
                  </Button>
                </div>
                {subShoppingCartItems.map(item => {
                  const totalItemAmount =
                    item.listing.attributes.price.amount * Number(item.checkoutValues.quantity);
                  const totalPriceOfItem = new Money(totalItemAmount, config.currency);
                  const formattedPrice = intl
                    ? formatMoney(intl, totalPriceOfItem)
                    : `${totalItemAmount / 100} ${totalPriceOfItem.currency}`;

                  const itemImage =
                    item.listing.images[0]?.attributes?.variants?.['listing-card-6x']?.url;

                  return (
                    <div className={css.cartItem} key={item.listing.id.uuid}>
                      <div className={css.cartItemLeft}>
                        <img src={itemImage} className={css.cartItemImage} />
                        <span>
                          <a
                            onClick={() =>
                              pushToPath(
                                `/l/${item.listing.attributes.title.replace(' ', '-')}/${
                                  item.listing.id.uuid
                                }`
                              )
                            }
                          >
                            {item.listing.attributes.title}
                          </a>
                        </span>
                      </div>

                      <div className={css.cartItemRight}>
                        <span>{formattedPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={css.total}>
              <span>
                {' '}
                <FormattedMessage id="ShoppingCart.total" />
              </span>

              <span>{totalPrice}</span>
            </div>
            {shippingItem ? <p className={css.infoTextTotal}>Before delivery cost</p> : null}

            <br />
            {isBelowMininumAmount ? (
              <p className={css.infoText}>* The minimum order amount is ${minOrderAmount}</p>
            ) : null}

            {notLoggedInWarning ? (
              <>
                <p className={css.notLoggedInText1}>
                  You need to <a href="/login">log in</a> to proceed to checkout
                </p>
                <p className={css.notLoggedInText2}>
                  You don't have an account ? Create one in <a href="/signup">here</a>
                </p>
              </>
            ) : null}

            <Button
              className={css.checkoutButton}
              type="button"
              disabled={isBelowMininumAmount}
              onClick={toCardCheckout}
            >
              <FormattedMessage id="ShoppingCart.checkout" />
            </Button>
            <Button className={css.affirmButton} type="button" onClick={toAffirmCheckout}>
              <FormattedMessage id="ShoppingCart.affirm" />
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

ShoppingCart.defaultProps = {
  filterConfig: config.custom.filters,
};

ShoppingCart.propTypes = {
  filterConfig: array,
};

export default ShoppingCart;
