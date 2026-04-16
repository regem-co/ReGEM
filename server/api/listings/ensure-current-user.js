const { getSdk } = require('../../api-util/sdk');

const ERROR_MESSAGE = 'Unable to determine current user.';

const ensureCurrentUser = async (req, res, next) => {
  const sdk = getSdk(req, res);

  sdk.currentUser
    .show()
    .then(apiResponse => {
      const currentUser = apiResponse.data.data;
      req.currentUser = currentUser;
      next();
    })
    .catch(e => res.status(401).json({ error: ERROR_MESSAGE }));
};

module.exports = ensureCurrentUser;
