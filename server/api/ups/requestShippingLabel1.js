const fetch = require('node-fetch');

const client_id = process.env.UPS_CLIENT_ID;
const client_secret = process.env.UPS_CLIENT_SECRET;
const x_merchant_id = process.env.X_MERCHANT_ID;

module.exports = async (req, res) => {
  const tracking_number = req.body.tracking_number;
  try {
    const formData = {
      grant_type: 'client_credentials'
    };
    const authResp = await fetch(
      `https://onlinetools.ups.com/security/v1/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-merchant-id': x_merchant_id,
          // Authorization: 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
          Authorization: 'Basic ' + btoa(`${client_id}:${client_secret}`)
        },
        body: new URLSearchParams(formData).toString()
      }
    );
    const authData = await authResp.text();
    const access_token = JSON.parse(authData).access_token;

    // res.send(`1_${authData}_${access_token}_${client_secret}_${x_merchant_id}`);
    const version = 'v1';
    const labelResp = await fetch(
      `https://onlinetools.ups.com/api/labels/${version}/recovery`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          transId: 'string',
          transactionSrc: 'testing',
          Authorization: `Bearer ${access_token}`
        },
        body: JSON.stringify({
          LabelRecoveryRequest: {
            LabelDelivery: {
              LabelLinkIndicator: '',
              ResendEmailIndicator: ''
            },
            LabelSpecification: {
              HTTPUserAgent: 'Mozilla/4.5',
              LabelImageFormat: { Code: 'ZPL' },
              LabelStockSize: { Height: '6', Width: '4' }
            },
            Request: {
              RequestOption: 'Non_Validate',
              SubVersion: '1903',
              TransactionReference: { CustomerContext: '' }
            },
            TrackingNumber: tracking_number,
            Translate: {
              Code: '01',
              DialectCode: 'US',
              LanguageCode: 'eng'
            }
          }
        })
      }
    );
    const labelData = await labelResp.json();
    return res.status(200).send(labelData);
  } catch (error) {
    return res.status(400).send(error);
  }
};
