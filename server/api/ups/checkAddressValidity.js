const axios = require('axios');
const xml2js = require('xml2js');
const upsAPIKey = process.env.UPS_ACCESS_KEY;
const upsUserName = process.env.UPS_USER_NAME;
const upsPassword = process.env.UPS_PASSWORD;

function convertXMLtoJSON(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = async (req, response) => {
  const address = req.body.address;

  try {
    const url = `https://onlinetools.ups.com/ups.app/xml/XAV`;

    const data = `<?xml version="1.0"?>
          <AccessRequest xml:lang="en-US">
              <AccessLicenseNumber>${upsAPIKey}</AccessLicenseNumber>
              <UserId>${upsUserName}</UserId>
              <Password>${upsPassword}</Password>
          </AccessRequest>
          <?xml version="1.0"?>
          <AddressValidationRequest xml:lang="en-US">
              <Request>
                  <TransactionReference>
                      <CustomerContext>Address Validation</CustomerContext>
                      <XpciVersion>1.0001</XpciVersion>
                  </TransactionReference>
                  <RequestAction>XAV</RequestAction>
                  <RequestOption>3</RequestOption>
              </Request>
              <AddressKeyFormat>
                  <AddressLine>${address.addressLine1}</AddressLine>
                  <AddressLine>${address.addressLine2}</AddressLine>
                  <PoliticalDivision2>${address.city}</PoliticalDivision2>
                  <PoliticalDivision1>${address.state}</PoliticalDivision1>
                  <PostcodePrimaryLow>${address.zipCode}</PostcodePrimaryLow>
                  <CountryCode>${address.country}</CountryCode>
              </AddressKeyFormat>
          </AddressValidationRequest>`;

    const upsApiResponse = await axios.post(url, data);
    const xmlResponse = upsApiResponse.data;
    const jsonResponse = await convertXMLtoJSON(xmlResponse);
    const addressDescription =
      Array.isArray(jsonResponse?.AddressValidationResponse?.AddressKeyFormat) &&
      jsonResponse?.AddressValidationResponse?.AddressKeyFormat[0]?.AddressClassification[0]
        ?.Description[0];

    if (addressDescription === 'Commercial' || addressDescription === 'Residential') {
      return response.status(200).send('Address is valid');
    } else {
      return response.status(400).send('Address is invalid');
    }
  } catch (error) {
    return response.status(400).send(error);
  }
};
