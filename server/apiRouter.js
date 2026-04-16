/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const urlencoded = express.urlencoded({ extended: true });
const jsonfy = express.json();

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const changeAllItemsQuantity = require('./api/changeAllItemsQuantity');
const createUserWithIdp = require('./api/auth/createUserWithIdp');

const mailchimp = require('./api/mailchimp');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');
const sendShippingLabelEmailToProvider = require('./api/send-shipping-label-email-to-provider');
const queryAllTx = require('./api/queryAllTx');
const upsTransition = require('./api/ups/upsTransition');
const checkAddressValidity = require('./api/ups/checkAddressValidity');
const requestPickup = require('./api/ups/requestPickup');
const requestShippingLabel = require('./api/ups/requestShippingLabel');
const requestShippingLabel1 = require('./api/ups/requestShippingLabel1');
const sendPackageOnTheWayEmailToProvider = require('./api/send-package-on-the-way-email-to-provider');

const router = express.Router();
var jsonParser = bodyParser.json();

const multer = require('multer');
const azureUpload = require('./api/azure/azureUpload');
const azureDownload = require('./api/azure/azureDownload');
const azureDelete = require('./api/azure/azureDelete');
const transactionTransition = require('./api/transactions/transactionTransition');
const initiatePrivilegedAffirm = require('./api/initiate-privileged-affirm');
const transitionPrivilegedAffirm = require('./api/transition-privileged-affirm');
const listingsRouter = require('./api/listings/router');
const productsFeed = require('./api/products-feed');
const orderConfirmation = require('./api/order-confirmation');

const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('image');

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //
router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);

router.post('/mailchimp', mailchimp);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);
router.post('/change-all-items-quantity', changeAllItemsQuantity);
// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Flex API to authenticate user to Flex
router.get('/auth/google/callback', authenticateGoogleCallback);
router.post('/query-all-tx', queryAllTx);
router.post('/ups-transition', jsonParser, upsTransition);

// UPS integration
router.post('/ups/verify-address', jsonParser, checkAddressValidity);
router.post('/ups/request-pickup', jsonParser, requestPickup);
router.post('/ups/request-shipping-label1', urlencoded, jsonfy, requestShippingLabel1);
router.post('/ups/send-shipping-label-to-provider', sendShippingLabelEmailToProvider);
router.post('/ups/send-package-on-the-way-email-to-provider', sendPackageOnTheWayEmailToProvider);
router.post('/ups/move-to-refind-delivery', jsonParser, require('./api/ups/moveToRefindDelivery'));

// azure
router.post('/azure-upload', uploadStrategy, azureUpload);
router.get('/azure-download', azureDownload);
router.get('/azure-delete', azureDelete);

//payment methods
router.post('/initiate-privileged-affirm', initiatePrivilegedAffirm);
router.post('/transition-privileged-affirm', transitionPrivilegedAffirm);

router.post('/transaction-transition', jsonParser, transactionTransition);
router.use('/listings', listingsRouter);

//product feeds
router.get('/products-feed', productsFeed);
router.get('/order-confirmation', orderConfirmation);

module.exports = router;
