import xml.etree.ElementTree as ET
from zeep import Client, Settings
from zeep.exceptions import Fault, TransportError, XMLSyntaxError

# Set Connection
settings = Settings(strict=False, xml_huge_tree=True)
client = Client('<WSDL_LOCATION>/FreightShip.wsdl', settings=settings)

# Set SOAP headers
headers = {
    'UPSSecurity': {
        'UsernameToken': {
            'Username': '<Your User Id>',
            'Password': '<Your Password>'
        },
        'ServiceAccessToken': {
            'AccessLicenseNumber': '<Your Access License Number>'
        }
    }
}

# Create request dictionary
request = {
    'RequestOption' : '1',
    'TransactionReference' : {
        'CustomerContext':'<Customer Context>'
    }
}

shipment = {
'ShipFrom': {
    'Name':'Main Name',
    'Address' : {
        'AddressLine' : 'Address Line',
        'AddressLine' : 'Address Line',
        'City': 'Columbus',
        'StateProvinceCode' : 'OH',
        'PostalCode' : '43240',
        'CountryCode' : 'US'
    },
    'AttentionName' : 'Bob Shipper',
    'Phone' : {
        'Number' : '<Phone Number>'
    },
    'EMailAddress': '<email Address>'
},
'ShipperNumber' : '<Shipper Number>',
'ShipTo': {
    'Name' : 'Nothing' ,
    'Address': {
        'AddressLine': 'Address Line',
        'City': 'Cambridge',
        'StateProvinceCode': 'ON',
        'PostalCode': 'N1P0A1',
        'CountryCode': 'CA'
    },
    'AttentionName': ' Ship To',
    'Phone': {
        'Number': '<Phone Number>'
    },
    'EMailAddress': '<Email Address>'
},
'PaymentInformation': {
    'Payer' : {
        'Name' : 'Payment Name',
        'Address' : {
            'AddressLine' : 'Address Line',
            'City' : 'Alpharetta',
            'StateProvinceCode' : 'GA',
            'PostalCode' : '30005',
            'CountryCode' : 'US'
        }
    },
    'ShipmentBillingOption' : {
      'Code' : '10'
    }
},

'Service': {
    'Code': '<service Code>'
},

'HandlingUnitOne': {
    'Quantity' : '2',
    'Type' : {
        'Code' : 'SKD'
    }
},
'Commodity': {
    'Description' : 'desc, sample',
    'Weight' : {
        'UnitOfMeasurement' : {
            'Code' : 'LBS'
        },
     'Value' : '500.00'
    },
    'Dimensions' : {
      'UnitOfMeasurement' : {
            'Code' : 'IN'
      },
      'Length' : '40.00',
      'Width' : '48.00',
      'Height' : '48.00'
    },
    'NumberOfPieces' : '2',
    'PackagingType' : {
        'Code' : 'PLT',
        'Description' : 'Pallet'
    },
    'FreightClass' : '60',
    'NMFCCommodity' : {
        'PrimeCode' : '111450'
    }
},
'ShipmentServiceOptions':{
    'PickupOptions' : '',
    'DeliveryOptions' : ''
}
}
# Try operation
try:
    response = client.service.ProcessShipment(_soapheaders=headers, Request=request,
                                              Shipment=shipment)
    #print('Response:::'+response)


except Fault as  error:
    print(ET.tostring(error.detail))


