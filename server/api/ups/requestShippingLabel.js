const axios = require('axios');
const qs = require('querystring');

const fetch = require('node-fetch');

const UPS_API_KEY = process.env.UPS_ACCESS_KEY;
const UPS_USERNAME = process.env.UPS_USER_NAME;
const UPS_PASSWORD = process.env.UPS_PASSWORD;



const environment = 'sandbox';
const baseURL = environment === 'sandbox'
    ? 'https://wwwcie.ups.com'
    : 'https://onlinetools.ups.com';

// Function to Validate Address
async function validateAddress(accessToken, address) {
  const query = new URLSearchParams({
    regionalrequestindicator: 'True',
    maximumcandidatelistsize: '1'
  }).toString();

  const requestoption = '1';
  const version = 'v1';
  const resp = await fetch(
    `https://wwwcie.ups.com/api/addressvalidation/${version}/${requestoption}?${query}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer '+ accessToken
      },
      body: JSON.stringify({
        XAVRequest: {
          AddressKeyFormat: {
            ConsigneeName: 'RITZ CAMERA CENTERS-1749',
            BuildingName: 'Innoplex',
            AddressLine: [
              '26601 ALISO CREEK ROAD',
              'STE D',
              'ALISO VIEJO TOWN CENTER'
            ],
            Region: 'ROSWELL,GA,30076-1521',
            PoliticalDivision2: 'ALISO VIEJO',
            PoliticalDivision1: 'CA',
            PostcodePrimaryLow: '92656',
            PostcodeExtendedLow: '1521',
            Urbanization: 'porto arundal',
            CountryCode: 'US'
          }
        }
      })
    }
  );

  const data = await resp.json();
  return data;
}

async function getAccessToken(clientId, clientSecret) {
  const formData = {
    grant_type: 'client_credentials' //=> 401!  'authorization_code', //
    //code: '86384W',//'5DC72C45179FC570',
    //redirect_uri: 'https://joinrefind.com'
  };

  const resp = await fetch(
    `https://wwwcie.ups.com/security/v1/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-merchant-id': '86384W',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams(formData).toString()
    }
  );

  const data = await resp.text();
  return JSON.parse(data).access_token;
}

async function createShipment(accessToken, fromAddress, toAddress, packageDetails, serviceDetails) {
  const body = {
    LabelSpecification: {
      LabelImageFormat: {
        Code: 'PNG',
      },
    },
    Shipment: {
      Shipper: {
        Name: fromAddress.name,
        Address: {
          AddressLine: [fromAddress.street],
          City: fromAddress.city,
          StateProvinceCode: fromAddress.state,
          PostalCode: fromAddress.postalCode,
          CountryCode: fromAddress.country,
        },
      },
      ShipTo: {
        Name: toAddress.name,
        Address: {
          AddressLine: [toAddress.street],
          City: toAddress.city,
          StateProvinceCode: toAddress.state,
          PostalCode: toAddress.postalCode,
          CountryCode: toAddress.country,
        },
      },
      Service: {
        Code: serviceDetails.code,
        Description: serviceDetails.description,
      },
      Package: {
        PackagingType: {
          Code: packageDetails.packagingTypeCode,
          Description: packageDetails.packagingTypeDescription,
        },
        Dimensions: packageDetails.dimensions,
        PackageWeight: packageDetails.packageWeight,
      },
    },
  };

  const baseURL = 'https://wwwcie.ups.com';
  const config = {
    method: 'post',
    url: `${baseURL}/ship/v1/shipments`, // Replace with the appropriate UPS API endpoint
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: body,
  };

  const response = await axios(config);
  return response.data;
}

async function createShipment1(accessToken, toAddress, fromAddress, name, phoneNumber)
{
  const query = new URLSearchParams({
    additionaladdressvalidation: 'city'
  }).toString();

  const version = 'v1';
  const resp = await fetch(
    `https://wwwcie.ups.com/api/shipments/${version}/ship?${query}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        transId: 'transId',//'12345678901234567890123456789012', //32 size
        transactionSrc: 'testing',
        Authorization: 'Bearer '+ accessToken
      },
      body: JSON.stringify({
        ShipmentRequest: {
          Request: {
            SubVersion: '1801',
            RequestOption: 'nonvalidate',
            TransactionReference: {CustomerContext: ''}
          },
          Shipment: {
            Description: 'Ship WS test',
            Shipper: {
              Name: name, //'ShipperName',
              AttentionName: name,
              TaxIdentificationNumber: '123456',
              Phone: {
                Number: phoneNumber,// '1115554758',
                Extension: ' '
              },
              ShipperNumber: '86384W', // still Refind !
              FaxNumber: '8002222222',

              //Name: fromAddress.name,
              Address: {
                AddressLine: [fromAddress.line1],
                City: fromAddress.city,
                StateProvinceCode: fromAddress.state,
                PostalCode: fromAddress.postalCode,
                CountryCode: fromAddress.country,
              },
              // Address: {
              //   AddressLine: ['2311 York Rd'],
              //   City: 'Timonium',
              //   StateProvinceCode: 'MD',
              //   PostalCode: '21093',
              //   CountryCode: 'US'
              // }
            },
            ShipTo: {
              Name: 'Refind',
              AttentionName: 'Jane Smith',
              Phone: {Number: '9225377171'},
              // Address: {
              //   AddressLine: ['123 Main St'],
              //   City: 'timonium',
              //   StateProvinceCode: 'MD',
              //   PostalCode: '21030',
              //   CountryCode: 'US'
              // },
              //Name: toAddress.name,
              Address: {
                AddressLine: [toAddress.line1],
                City: toAddress.city,
                StateProvinceCode: toAddress.state,
                PostalCode: toAddress.postalCode,
                CountryCode: toAddress.country,
              },
              Residential: ' '
            },
            ShipFrom: {
              Name: name, // company name
              AttentionName: name,
              Phone: {Number: phoneNumber},
              FaxNumber: '1234567890',
              //Name: fromAddress.name,
              Address: {
                AddressLine: [fromAddress.line1],
                City: fromAddress.city,
                StateProvinceCode: fromAddress.state,
                PostalCode: fromAddress.postalCode,
                CountryCode: fromAddress.country,
              },
            },
            PaymentInformation: {
              ShipmentCharge: {
                Type: '01',
                BillShipper: {AccountNumber: '86384W'} 
              }
            },
            Service: {
              Code: '03',
              Description: 'Express'
            },
            Package: {
              Description: ' ',
              Packaging: {
                Code: '02',
                Description: 'Nails'
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: 'IN',
                  Description: 'Inches'
                },
                Length: '10',
                Width: '30',
                Height: '45'
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'LBS',
                  Description: 'Pounds'
                },
                Weight: '5'
              }
            }
          },
          LabelSpecification: {
            LabelImageFormat: {
              Code: 'GIF',
              Description: 'GIF'
            },
            HTTPUserAgent: 'Mozilla/4.5'
          }
        }
      })
    }
  );

  const data = await resp.json();
  return data;
}


module.exports = {
  validateAddress,
  getAccessToken,
  createShipment1
};

// module.exports = async (req, response) => {

//   // const address = req.body.address;




//   const toAddress = {
//     name: 'Emanuel Jane',
//     street: '91508 Stallings Ln',
//     city: 'COBURG',
//     state: 'OR',
//     postalCode: '97408',
//     country: 'US',
//     phoneNumber: '6282672995',
//   };

//   const fromAddress = {
//     name: 'Neiman Marcus',
//     street: '1618 Main St.',
//     city: 'Dallas',
//     state: 'TX',
//     postalCode: '75201',
//     country: 'US',
//     phoneNumber: '6282672995',
//   };

//   const packageDetails = {
//     packagingTypeCode: "01",
//     packagingTypeDescription: "Package/customer supplied",
//     dimensions: {
//       UnitOfMeasurement: {
//         Code: "IN",
//         Description: "inches"
//       },
//       Length: "10",
//       Width: "10",
//       Height: "10"
//     },
//     packageWeight: {
//       UnitOfMeasurement: {
//         Code: "LBS",
//         Description: "pounds"
//       },
//       Weight: "10"
//     }
//   };
  
//   const serviceDetails = {
//     code: "01",
//     description: "UPS Ground"
//   };
  

//   const clientId = 'B4wQHC2cA7NtQLRl2JsgkaPhumhNVAuDcA8aWjaRaXgINMom';
//   const clientSecret = 'i95mLD4t4MtBBUFuVjawPJSyErfIzupgkuvJ1HGFfgK77MArEbrAkE6nEclJkd8A';

//   //const clientId= process.env.UPS_USER_NAME;
//   //const clientSecret= process.env.UPS_PASSWORD;

//   try {
//     const accessToken = await getAccessToken(clientId, clientSecret);

    
//     // Validate 'from' address
//     const fromValidation = await validateAddress(accessToken, fromAddress);
//     if (fromValidation && fromValidation.XAVResponse.Response.ResponseStatus.Code !== '1') {
//       console.log('From address is invalid');
//       return;
//     }

//     // Validate 'to' address
//     const toValidation = await validateAddress(accessToken, toAddress);
//     if (toValidation && toValidation.XAVResponse.Response.ResponseStatus.Code !== '1') {
//       console.log('To address is invalid');
//       return;
//     }

//     //const label = await createShipment(accessToken, fromAddress, toAddress, packageDetails, serviceDetails);
//     await createShipment1(accessToken, toAddress, fromAddress, name, phoneNumber);
//     console.log('Shipping label:', label);
//     return response.status(200).send(label);
//   } catch (error) {
//     console.error('Error:', error);
//     return response.status(400).send(error);
//   }

// /*
//   // 7737 Burnet Ave #92360 
// //Van Nuys,  CA 91405 US
// const fromAddress = {
//   name: 'Neiman Marcus',
//   street: '7737 Burnet Ave #92360',
//   city: 'Van Nuys',
//   state: 'CA',
//   postalCode: '91405',
//   country: 'US',
//   phoneNumber: '6282672995',
// };

// //8033 Sunset Blvd  
// //WEST HOLLYWOOD,  CA 90046 US

// const toAddress = {
//   name: 'Emanuel Jane',
//   street: '8033 Sunset Blvd',
//   city: 'WEST HOLLYWOOD',
//   state: 'CA',
//   postalCode: '90046',
//   country: 'US',
//   phoneNumber: '6282672995',
// };
// */
//   try {
//     // Set up the request header
//     const headers = {
//       'Access-Control-Allow-Origin': '*',
//       'Content-Type': 'application/json',
//       Authorization: 'Basic ' + Buffer.from(UPS_USERNAME + ':' + UPS_PASSWORD).toString('base64'),
//     };

//     // Set up the request body
//     const body = {
//       UPSSecurity: {
//         UsernameToken: {
//           Username: UPS_USERNAME,
//           Password: UPS_PASSWORD,
//         },
//         ServiceAccessToken: {
//           AccessLicenseNumber: UPS_API_KEY,
//         },
//       },
//       LabelSpecification: {
//         LabelImageFormat: {
//           Code: 'PNG',
//         },
//       },
//       Shipment: {
//         Shipper: {
//           Name: fromAddress.name,
//           Address: {
//             AddressLine: [fromAddress.street], // Fixed from fromAddress.addressLine1
//             City: fromAddress.city,
//             StateProvinceCode: fromAddress.state,
//             PostalCode: fromAddress.postalCode, // Fixed from fromAddress.zip
//             CountryCode: fromAddress.country,
//           },
//         },
//         ShipTo: {
//           Name: toAddress.name,
//           Address: {
//             AddressLine: [toAddress.street], // Fixed from toAddress.addressLine1
//             City: toAddress.city,
//             StateProvinceCode: toAddress.state,
//             PostalCode: toAddress.postalCode, // Fixed from toAddress.zip
//             CountryCode: toAddress.country,
//           },
//         },
//         Service: {
//           Code: '01',
//           Description: 'UPS Ground',
//         },
//         Package: {
//           PackagingType: {
//             Code: '01',
//             Description: 'Package/customer supplied',
//           },
//           Dimensions: {
//             UnitOfMeasurement: {
//               Code: 'IN',
//               Description: 'inches',
//             },
//             Length: '10',
//             Width: '10',
//             Height: '10',
//           },
//           PackageWeight: {
//             UnitOfMeasurement: {
//               Code: 'LBS',
//               Description: 'pounds',
//             },
//             Weight: '10',
//           },
//         },
//       },
//     };

//     // Make the request to the UPS API
//     const resp = await axios.post('https://onlinetools.ups.com/rest/Ship', body, { headers });

//     // Extract the shipping label from the response
//     const label = resp.data; //.ShipmentResults.PackageResults.ShippingLabel.GraphicImage;
//     return response.status(200).send(label);
//   } catch (error) {
//     console.error(error);
//     return response.status(400).send(error);
//   }
// };
