const { response } = require('express');
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

module.exports = (req, response) => {
  return integrationSdk.transactions
    .query({
      include: [
        'listing',
        'provider',
        'provider.profileImage',
        'customer',
        'customer.profileImage',
        'booking',
      ],
      'fields.transaction': [
        'lastTransition',
        'lastTransitionedAt',
        'transitions',
        'payinTotal',
        'payoutTotal',
        'lineItems',
        'protectedData',
        'metadata',
      ],
      'fields.listing': ['title', 'publicData'],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(resp => {
      const included = resp.data.included;
      const finalTxs = resp.data.data.map(t => {
        const listingId = t.relationships.listing.data.id.uuid;
        const authorId = t.relationships.provider.data.id.uuid;
        const customerId = t.relationships.customer.data.id.uuid;
        const foundListing = included.find(l => {
          return l.id.uuid === listingId;
        });

        const foundAuthor = included.find(x => {
          return x.id.uuid === authorId;
        });

        const foundCustomer = included.find(x => {
          return x.id.uuid === customerId;
        });

        t.listing = foundListing;
        t.author = foundAuthor;
        t.customer = foundCustomer;
        return t;
      });
      return response.status(200).send(finalTxs);
    })
    .catch(e => {
      return response.status(404).send(e);
    });
};
