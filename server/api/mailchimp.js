const { default: axios } = require('axios');
const { serialize, handleError } = require('../api-util/sdk');

module.exports = async (req, res) => {
  const { email } = req.body;
  const url = `${process.env.REACT_APP_MAILCHIMP_URL}/subscribe/post?u=${process.env.REACT_APP_MAILCHIMP_U}&id=${process.env.REACT_APP_MAILCHIMP_ID}&EMAIL=${email}`;

  axios.get(url)
    .then(response => {
      const { status, statusText, data } = response;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          }),
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
