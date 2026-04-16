
const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const { listingId, ...restParams } = bodyParams && bodyParams.params ? bodyParams.params : {};

  const sdk = getSdk(req, res);
  let lineItems = null;

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
      // Add lineItems to the body params

      if (restParams.restOfShoppingCartItems === null) {
        delete restParams.restOfShoppingCartItems;
      }


      // let orderData= bodyParams.params.orderData;

      // if (orderData === null) {
      //   orderData = {
      //       quantity: 1,
      //       deliveryMethod: 'shipping',
      //       proposedPriceAmount: 85000
      //     }
      //   }

      const body = {
        ...bodyParams,
        params: {
          ...restParams,
          lineItems,
        },
      };

      if (isSpeculative) {
        console.log('actually here need also an affirm transition!');
        return trustedSdk.transactions.transitionSpeculative(body, queryParams);
      }
      console.log('test right before trustedSdk.transactions.transition');

      return trustedSdk.transactions.transition(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
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
      console.log('error', e);
      handleError(res, e);
    });
};
