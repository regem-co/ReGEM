const { calculateTotalFromLineItems } = require('../api-util/lineItemHelpers');
const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

module.exports = async (req, res) => {
  const { payment_intent } = req.query;
  console.log(req.query)

  try {
    // Retrieve the PaymentIntent from Stripe using the payment_intent ID
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

    // Check the status of the payment
    if (paymentIntent.status === 'succeeded') {
        // Payment was successful
        // Handle successful payment logic (e.g., update database, notify user)
        res.redirect('/success-page'); // Redirect to a success page after processing
    } else {
        // Handle other statuses or failures
        res.redirect('/failure-page'); // Redirect to a failure page
    }
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.redirect('/error-page'); // Handle error appropriately
  }
};
