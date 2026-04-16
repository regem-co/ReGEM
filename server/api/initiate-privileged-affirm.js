const { calculateTotalFromLineItems } = require('../api-util/lineItemHelpers');
const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});
module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const listingId = bodyParams && bodyParams.params ? bodyParams.params.listingId : null;
  const skipStripePaymentIntent = orderData?.skipStripePaymentIntent;
  const sdk = getSdk(req, res);
  let lineItems = null;
  let customPi = {};

  console.log("in initiate privileged affirm");

  sdk.listings
    .show({ id: listingId, include: ['author'] })
    .then(listingResponse => {
      const listing = listingResponse.data.data;
      const listingAuthor = listingResponse.data.included.find(i => i?.type === 'user');
      listing.author = listingAuthor;
      lineItems = transactionLineItems(listing, { ...orderData, ...bodyParams.params });

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      const { params } = bodyParams;

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
          lineItems,
        },
      };

      if (isSpeculative) {
        const lineItems = body?.params?.lineItems;
        const payinLineItems = lineItems.filter(l => l.code !== 'line-item/provider-commission');
        const shippingFeeItem = lineItems.find(l => l.code === 'line-item/shipping-fee');
        const commissionLineItem = lineItems.find(l => l.code === 'line-item/provider-commission');
        const totalPayin = calculateTotalFromLineItems(payinLineItems);
        const shippingFee = calculateTotalFromLineItems([shippingFeeItem]);
        const commission = calculateTotalFromLineItems([commissionLineItem]);
        const providerId = body?.params?.providerId;
        return integrationSdk.users
          .show({ id: providerId, include: ['stripeAccount'] })
          .then(resp => {
            const stripeAccountId = resp.data.included[0].attributes.stripeAccountId;
            if (skipStripePaymentIntent) {
              return trustedSdk.transactions.initiateSpeculative(body, queryParams).catch(e => {
                throw e;
              });
            } else {
              console.log("on server, before payment intents");
              return stripe.paymentIntents
                .create({
                  amount: totalPayin?.amount,
                  currency: process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY,
                  payment_method_types: ['affirm'],
                  application_fee_amount: - commission?.amount + shippingFee?.amount,
                  transfer_data: {
                    destination: stripeAccountId,
                  },
                })
                .then(resp1 => {
                  const piSecret = resp1.client_secret;
                  const piId = resp1.id;
                  customPi = {
                    piSecret,
                    piId,
                  };
                  return trustedSdk.transactions.initiateSpeculative(body, queryParams);
                })
                .catch(e => {
                  throw e;
                });
            }
          })
          .catch(e => {
            throw e;
          });
      }
      return trustedSdk.transactions.initiate(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;

      if (customPi?.piId && customPi?.piSecret) {
        data.data.attributes.protectedData = {
          stripePaymentIntents: {
            default: {
              stripePaymentIntentId: customPi?.piId,
              stripePaymentIntentClientSecret: customPi?.piSecret,
            },
          },
        };
      }

      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
