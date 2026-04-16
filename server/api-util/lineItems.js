const {
  calculateQuantityFromDates,
  calculateTotalFromLineItems,
  calculateShippingFee,
} = require('./lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

// This unit type needs to be one of the following:
// line-item/night, line-item/day or line-item/units
const lineItemUnitType = 'line-item/units';
const sellingUnitType = 'line-item/quantity';
// const PROVIDER_COMMISSION_PERCENTAGE = -15;

/** Returns collection of lineItems (max 50)
 *
 * Each line items has following fields:
 * - `code`: string, mandatory, indentifies line item type (e.g. \"line-item/cleaning-fee\"), maximum length 64 characters.
 * - `unitPrice`: money, mandatory
 * - `lineTotal`: money
 * - `quantity`: number
 * - `percentage`: number (e.g. 15.5 for 15.5%)
 * - `seats`: number
 * - `units`: number
 * - `includeFor`: array containing strings \"customer\" or \"provider\", default [\":customer\"  \":provider\" ]
 *
 * Line item must have either `quantity` or `percentage` or both `seats` and `units`.
 *
 * `includeFor` defines commissions. Customer commission is added by defining `includeFor` array `["customer"]` and provider commission by `["provider"]`.
 *
 * @param {Object} listing
 * @param {Object} orderData
 * @returns {Array} lineItems
 */
exports.transactionLineItems = (listing, orderData) => {
  const proposedPriceAmount =
    orderData?.proposedPriceAmount || orderData?.orderData?.proposedPriceAmount;
  if (proposedPriceAmount) {
    // if proposedPriceAmount is string, try to convert it to number
    const proposedPriceAmountNumber = Number(proposedPriceAmount);
    listing.attributes.price.amount = proposedPriceAmountNumber;//proposedPriceAmount;
  }
  const { toggleShippingFee } = listing?.attributes?.metadata || {};
  const publicData = listing.attributes.publicData;
  const listingAuthor = listing.author;
  const listingAuthorDedicatedCommission =
    listingAuthor?.attributes?.profile?.publicData?.customMarketplaceCommission;
  // const marketplaceCommission = listingAuthorDedicatedCommission
  //   ? -Number(listingAuthorDedicatedCommission)
  //   : PROVIDER_COMMISSION_PERCENTAGE;
  const unitPrice = listing.attributes.price;
  const currency = unitPrice.currency;

  // Check delivery method and shipping prices
  const deliveryMethod = orderData && orderData.deliveryMethod;
  const isShipping = deliveryMethod === 'shipping';
  const isPickup = deliveryMethod === 'pickup';
  const shippingPriceInSubunitsOneItem = 2500; //publicData && publicData.shippingPriceInSubunitsOneItem ;
  const shippingPriceInSubunitsAdditionalItems =
    publicData && publicData.shippingPriceInSubunitsAdditionalItems;

  // California sales tax (9.75%) - applied when shipping to CA
  const CALIFORNIA_TAX_RATE = 0.0975;
  const shippingState = orderData && orderData.shippingState;
  const shouldApplyTax = shippingState === 'CA';

  // stockReservationQuantity is used with stock management
  const hasStockReservationQuantity = orderData && orderData.stockReservationQuantity;
  // quantity is used with bookings (time-based process: e.g. units: hours, quantity: 5)
  const hasQuantity = orderData && orderData.quantity;
  // bookingStart & bookingend are used with day-based bookings (how many days / nights)
  const { bookingStart, bookingEnd } = orderData || {};
  const shouldCalculateQuantityFromDates =
    bookingStart && bookingEnd && ['line-item/day', 'line-item/night'].includes(lineItemUnitType);

  // Throw error if there is no quantity information given
  const hasQuantityInformation =
    hasStockReservationQuantity || hasQuantity || shouldCalculateQuantityFromDates;
  if (!hasQuantityInformation) {
    const message = `Error: transition should contain quantity information: 
      stockReservationQuantity, quantity, or bookingStart & bookingEnd (if "line-item/day" or "line-item/night" is used)`;
    const error = new Error(message);
    error.status = 400;
    error.statusText = message;
    error.data = {};
    throw error;
  }

  // Quantity for line-items
  // Note: this uses ternary as conditional chain
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator#conditional_chains
  const orderQuantity = hasStockReservationQuantity
    ? orderData.stockReservationQuantity
    : hasQuantity
      ? orderData.quantity
      : shouldCalculateQuantityFromDates
        ? calculateQuantityFromDates(bookingStart, bookingEnd, lineItemUnitType)
        : 1;

  const restOfShoppingCartItems = orderData.restOfShoppingCartItems;

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for order,
   * you should use one of the codes:
   * line-item/night, line-item/day or line-item/units.
   *
   * Pre-definded commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default OrderBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const order = {
    code: lineItemUnitType,
    unitPrice,
    quantity: orderQuantity,
    includeFor: ['customer', 'provider'],
  };

  let shoppingCartItems = [];

  if (restOfShoppingCartItems) {
    restOfShoppingCartItems.forEach(item => {
      shoppingCartItems.push({
        code: `line-item/${item.listing.id.uuid}`,
        unitPrice: new Money(item.listing.attributes.price.amount, unitPrice.currency),
        quantity: item.checkoutValues.quantity,
        includeFor: ['customer', 'provider'],
      });
    });
  }

  // Calculate shipping fee if applicable
  const shippingFee = isShipping && toggleShippingFee !== 'off'
    ? calculateShippingFee(
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
      currency,
      orderQuantity
    )
    : null;

  // Add line-item for given delivery method.
  // Note: by default, pickup considered as free.
  const deliveryLineItem = !!shippingFee
    ? [
      {
        code: 'line-item/shipping-fee',
        unitPrice: shippingFee,
        quantity: 1,
        includeFor: ['customer'],
      },
    ]
    : isPickup
      ? [
        {
          code: 'line-item/pickup-fee',
          unitPrice: new Money(0, currency),
          quantity: 1,
          includeFor: ['customer'],
        },
      ]
      : [];

  let totalAmount = calculateTotalFromLineItems([order, ...shoppingCartItems])?.amount;
  if (proposedPriceAmount) {
    totalAmount = proposedPriceAmount;
  }
  const marketplaceCommission = listingAuthorDedicatedCommission
    ? -Number(listingAuthorDedicatedCommission)
    : totalAmount > 499900
      ? (totalAmount > 999900 ? -20 : -25)
      : -30;

  let basicCommissionBaseAmount = calculateTotalFromLineItems([order, ...shoppingCartItems])?.amount;
  if (proposedPriceAmount) {
    basicCommissionBaseAmount = proposedPriceAmount;
  }

  const basicCommissionAmount =
    basicCommissionBaseAmount * (- marketplaceCommission / 100);

  const totalCommissionAmount = 100 * Math.round(basicCommissionAmount / 100);

  const providerCommission = {
    code: 'line-item/provider-commission',
    unitPrice: new Money(-totalCommissionAmount, unitPrice.currency),
    quantity: 1,
    includeFor: ['provider'],
  };

  // Calculate tax for California orders (tax on item price only, not shipping)
  // total = item_price * (1 + tax) + shipping_fee
  let taxLineItem = [];
  if (shouldApplyTax) {
    const itemsOnly = [order, ...shoppingCartItems];
    const itemsSubtotal = calculateTotalFromLineItems(itemsOnly);
    const taxAmount = Math.round(itemsSubtotal.amount * CALIFORNIA_TAX_RATE);

    if (taxAmount > 0) {
      taxLineItem = [{
        code: 'line-item/tax',
        unitPrice: new Money(taxAmount, currency),
        quantity: 1,
        includeFor: ['customer'],
      }];
    }
  }

  const lineItems = [order, ...deliveryLineItem, ...shoppingCartItems, ...taxLineItem, providerCommission];
  return lineItems;
};
