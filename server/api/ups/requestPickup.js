const axios = require('axios');
const upsAPIKey = process.env.UPS_ACCESS_KEY;
const upsUserName = process.env.UPS_USER_NAME;
const upsPassword = process.env.UPS_PASSWORD;

module.exports = async (req, response) => {
  const address = req.body.address;
  try {
    const options = {
      headers: {
        AccessLicenseNumber: upsAPIKey,
        UserId: upsUserName,
        Password: upsPassword,
      },
    };
    const requestBody = {
      PickupRequest: {
        Request: {
          RequestOption: '1',
          TransactionReference: {
            CustomerContext: 'Pickup Request',
          },
        },
        PickupType: {
          Code: '01',
          Description: 'Daily Pickup',
        },
        Contact: {
          Name: 'John Doe',
          Phone: '555-555-5555',
        },
        Address: {
          AddressLine: [address.addressLine1, address.addressLine2],
          City: address.city,
          StateProvinceCode: address.state,
          PostalCode: address.zipCode,
          CountryCode: address.country,
        },
        PackageLocation: 'Front Door',
        PackageReadyTime: '12:00',
        SpecialInstructions: 'Leave package by front door',
      },
    };

    const upsApiResponse = await axios.post(
      'https://wwwcie.ups.com/rest/Pickup',
      requestBody,
      options
    );
    return response.status(200).send(upsApiResponse);
  } catch (error) {
    return response.status(400).send(error);
  }
};
