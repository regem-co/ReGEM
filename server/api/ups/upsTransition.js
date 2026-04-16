const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

module.exports = (req, response) => {
  const txId = req.body.txId;
  const transition = req.body.transition;

  return integrationSdk.transactions
    .transition(
      {
        id: txId,
        transition,
        params: {},
      },
      {
        expand: true,
      }
    )
    .then(res => {
      return response.sendStatus(200);
    })
    .catch(e => {
      return response.status(400).send(e);
    });
};
