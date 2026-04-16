const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const _integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

const integrationSdk = async (req, res, next) => {
  req.integrationSdk = _integrationSdk;
  next();
};

module.exports = integrationSdk;
