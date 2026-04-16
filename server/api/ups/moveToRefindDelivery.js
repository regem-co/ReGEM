const azureUpload = require('../azure/azureUpload');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const {validateAddress, createShipment1, getAccessToken} = require('./requestShippingLabel');


const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});


const UPS_API_KEY = process.env.UPS_ACCESS_KEY;
const UPS_USERNAME = process.env.UPS_USER_NAME;
const UPS_PASSWORD = process.env.UPS_PASSWORD;


const environment = 'sandbox';
const baseURL = environment === 'sandbox'
    ? 'https://wwwcie.ups.com'
    : 'https://onlinetools.ups.com';

const isDev = process.env.NODE_ENV === 'development';

//const clientId= process.env.UPS_USER_NAME;
//const clientSecret= process.env.UPS_PASSWORD;


// create a method to convert state name to state code
const stateNameToCode = (stateName) => {
  const states = {
    "Alabama": "AL",
    "Alaska": "AK",
    "American Samoa": "AS",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "District Of Columbia": "DC",
    "Federated States Of Micronesia": "FM",
    "Florida": "FL",
    "Georgia": "GA",
    "Guam": "GU",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Marshall Islands": "MH",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Northern Mariana Islands": "MP",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Palau": "PW",
    "Pennsylvania": "PA",
    "Puerto Rico": "PR",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virgin Islands": "VI",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
  };
  return states[stateName];
};



module.exports = async (req, response) => {
    //const { Body } = req.body;
    
    const transactionId = req.query.transactionId;

    const clientId = 'B4wQHC2cA7NtQLRl2JsgkaPhumhNVAuDcA8aWjaRaXgINMom';
    const clientSecret = 'i95mLD4t4MtBBUFuVjawPJSyErfIzupgkuvJ1HGFfgK77MArEbrAkE6nEclJkd8A';

    try {
      const res = await integrationSdk.transactions.show({
        id: transactionId
      });
      const { data } = res.data;
      if (data.attributes.lastTransition === 'transition/ups-shipping-to-refind') {//'transition/confirm-payment') {


        // TODO!!!!!!!!!!!!!!!!!!!!!! state Deutscland to DE ca altfel nu accepta!!!!!!!!!!!!!!!
        // handle that
        
        // shippingDetails in protectedData example
        // {
        //   "address": {
        //     "city": "Pulheim",
        //     "country": "US",
        //     "line1": "Gut Vinkenpütz",
        //     "line2": "1",
        //     "postalCode": "50259",
        //     "state": "Deutschland"
        //   },
        //   "name": "Karl Nesseler",
        //   "phoneNumber": "3606449209"
        // }



        let { shippingDetails } = //data.attributes.protectedData; // la teste pune asta!
        {"shippingDetails":{
          "address": {
            "city": "Los Angeles",
            "country": "US",
            "line1": "2533 Greenvalley Road",
            "line2": null,
            "postalCode": "90046",
            "state": "CA"
          },
          "name": "Mark McTavish",
          "phoneNumber": "3239077741"
        }};

        if (shippingDetails.address.state.length > 2 && shippingDetails.address.country === 'US') {
          shippingDetails.address.state = stateNameToCode(shippingDetails.address.state);
        }

        //TODO!!!!!!!!!!!!!!!!!!!!!!
        // convert California to CA ca altfel nu accepta.
        // TODO!!!!!!!!!!!!!!!!!!!!!!
        const { address, name, phoneNumber } = shippingDetails;        
        

        const addressFrom = {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        };





        //8033 Sunset Blvd, #1121, Los Angeles, CA 90046
        const addressTo = {
          line1 : "8033 Sunset Blvd",
          line2 : "#1121",
          city : "Los Angeles",
          state : "CA",
          postalCode : "90046",
          country : "US",
        };

        const accessToken = await getAccessToken(clientId, clientSecret);
        const validatedAddressFrom = await validateAddress(accessToken, addressFrom);
        const validatedAddressTo = await validateAddress(accessToken, addressTo);
        

        const shipment = await createShipment1(accessToken, 
          addressTo, 
          addressFrom,
          name,
          phoneNumber);

        const { TrackingNumber, ShippingLabel } = shipment.ShipmentResponse.ShipmentResults.PackageResults;
        
        //const byteCharacters = Buffer.from(ShippingLabel.GraphicImage, 'base64').toString('binary');
        const buffer = Buffer.from(ShippingLabel.GraphicImage, 'base64');

        // Save it to a file, this works
        //const filePath = 'shipping-label.gif';
        //fs.writeFileSync(filePath, buffer);

        // Convert the binary string to a Buffer
        

        
        // add the shipping label graphic image to the formData 
        // with the extension imageFormat.code
        // add the tracking number to the formData
        // add the shipping label html image to the formData
        // send the formData to the azureUpload function
        //

        const formData = new FormData();
        formData.append('image', buffer, { filename: TrackingNumber + '.'+ShippingLabel.ImageFormat.Code, contentType: 'image/gif' });


        
        //formData.append('image', byteCharacters, 
        //      TrackingNumber + '.'+ShippingLabel.ImageFormat.Code);
        

 
        const file = await axios.post(`${isDev ? 'http://localhost:4000' : ''}/api/azure-upload`, formData,
          {
            headers: {
            ...formData.getHeaders(),
          },
        });
        
        // save shipping label graphic image with extension imageFormat.code to azure storage 
        // and send the link to the client
        // save the tracking number in the transaction protectedData
        // send the tracking number to the client
        // send the shipping label html image to the client

          
        // const shippingLabel = {
        //   trackingNumber: TrackingNumber,
        //   shippingLabel: ShippingLabel.GraphicImage,
        //   shippingLabelHtml: ShippingLabel.HTMLImage,
        // };

        // const resp = await integrationSdk.transactions.transition(
        //   {
        //     id: transactionId,
        //     transition: 'transition/ups-shipping-to-refind',
        //     params: {
        //       protectedData: {
        //         shippingLabel
        //       },
        //     },
        //   },
        //   {
        //     expand: true,
        //   }
        // );

        
      







        // const resp = await integrationSdk.transactions.transition(
        //   {
        //     id: transactionId,
        //     transition: 'transition/ups-shipping-to-refind',
        //     params: {
        //       protectedData: {
        //         // shippingLabel
        //       },
        //     },
        //   },
        //   {
        //     expand: true,
        //   }
        // );
  
        return response.sendStatus(200);
      } else {
        return response.sendStatus(200);
      }
    } catch (e) {
      console.log(e);
      return response.sendStatus(200);
    }
  };
  