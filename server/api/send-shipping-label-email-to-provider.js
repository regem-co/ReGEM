const sgMail = require('@sendgrid/mail');
const { response } = require('express');
sgMail.setApiKey(
  process.env.SENDGRID_API_KEY
);
const fs = require('fs');
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

async function readCopy(i, copyFileName) {
  const attachment = await fs.readFileSync(copyFileName).toString('base64');
  const attachmentJson = {
    content: attachment,
    filename: 'shippinhLabel.pdf',
    type: 'application/pdf',
    disposition: 'attachment',
    content_id: `${i}`,
  };
  return attachmentJson;
}

module.exports = (req, response) => {
  const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER || 'emanuel.pasat@epicvisits.com';
  const authorId = req.body.authorId;
  const listing = req.body.listing;

  const listingName = listing.attributes.title;
  const fileName = 'server/utils/ups/dummyShippingLabel.pdf';

  return integrationSdk.users
    .show({ id: authorId })
    .then(res => {
      const authorEmail = res.data.data.attributes.email;

      return readCopy('shipping-label', fileName)
        .then(resp => {
          const msg = {
            to: authorEmail || verifiedSender, //TODO uncomment //authorEmail || verifiedSender,
            from: verifiedSender,
            subject: `Shipping label for ${listingName}`,
            text: `Shipping label for ${listingName}`,
            html: `Shipping label for ${listingName}`,
            attachments: [resp],
          };

          return sgMail
            .send(msg)
            .then(resp => {
              console.log('Email sent');
              return response.sendStatus(200);
            })
            .catch(err => {
              throw err;
            });
        })
        .catch(err => {
          throw err;
        });
    })
    .catch(e => {
      console.log(e);
      return response.sendStatus(404);
    });
};
