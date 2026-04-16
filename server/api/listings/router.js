const express = require('express');
const bodyParser = require('body-parser');
const integrationSdk = require('./integration-sdk');
const ensureCurrentUser = require('./ensure-current-user');
const { createListing } = require('./service');

const router = express.Router();
const jsonParser = bodyParser.json();

const listingsRouter = express.Router();
listingsRouter.get('/create', createListing);
router.use(jsonParser, integrationSdk, ensureCurrentUser, listingsRouter);

module.exports = router;
