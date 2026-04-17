const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(
  process.env.SENDGRID_API_KEY
);
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

module.exports = (req, response) => {
  const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER || 'emanuel.pasat@epicvisits.com';
  const authorId = req.body.authorId;
  const listing = req.body.listing;

  const listingName = listing.attributes.title;

  return integrationSdk.users
    .show({ id: authorId })
    .then(res => {
      const authorEmail = res.data.data.attributes.email;
      const authorName = res.data.data.attributes.profile.displayName;
      const msg = {
        to: authorEmail || verifiedSender, //TODO uncomment //authorEmail || verifiedSender,
        from: verifiedSender,
        subject: `${listingName} it's on the way!`,
        html: `<div>
                    <h2>It's on the way!</h2>
                    <p>Hi ${authorName}!</p>
                    <p>The buyer is so exited. The package is on the way!</p>
                    <p>You can keep an eye on its progress by tapping the Tracking Number or going to the <a href='https://refind-dev.herokuapp.com/inbox/sales'>Order Status</a> page.</p>
                 
                    <table>
                    <tr>
                      <td><img src="https://www.ups.com/assets/resources/images/UPS_logo.svg" alt="UPS logo" /></td>
                      <td>Tracking Number: 
                        <br/>
                        <a href='https://refind-dev.herokuapp.com/inbox/sales'>639cb94f10f74147bb6e828936195196</a>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" align="center">
                        <a href="https://refind-dev.herokuapp.com/inbox/sales" style="background-color: orange; color: white; padding: 15px; text-decoration: none;">See Order Status</a>
                      </td>
                    </tr>
                  </table>

                    </div>`,
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
    .catch(e => {
      console.log(e);
      return response.sendStatus(404);
    });
};
