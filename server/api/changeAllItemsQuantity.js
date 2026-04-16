const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

module.exports = (req, response) => {
  const restOfShoppingCartItems = req.body.restOfShoppingCartItems;

  const promises = restOfShoppingCartItems.map(x => {
    return integrationSdk.stockAdjustments
      .create({
        listingId: x.listing.id.uuid,
        quantity:
          Number(x.listing.currentStock.attributes.quantity) - Number(x.checkoutValues.quantity), //TODO see if correct
      })
      .catch(e => console.log(e));
  });

  return Promise.all(promises)
    .then(resp => {
      return response.sendStatus(200);
    })
    .catch(e => {
      return response.sendStatus(200);
    });
};
