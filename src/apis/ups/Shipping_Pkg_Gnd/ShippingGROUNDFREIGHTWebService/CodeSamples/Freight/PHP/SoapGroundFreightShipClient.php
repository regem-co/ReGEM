<?php

  //Configuration
  $access = " Add License Key Here";
  $userid = " Add User Id Here";
  $passwd = " Add Password Here";
  $wsdl = " Add Wsdl File Here ";
  $operation = "ProcessShipment";
  $endpointurl = ' Add URL Here';
  $outputFileName = "XOLTResult.xml";

  function processShipment()
  {
      //create soap request
      $request['Request'] = array
      (
         'RequestOption' => array ('1','Shipping')
      );
      $shipfrom['Name'] = 'Pat Stewart';
      $shipfrom['TaxIdentification'] = '1234567890';
      $shipfrom['Address'] = array
      (
          'AddressLine' => '2311 York Road',
          'City' => 'Timonium',
          'StateProvinceCode' => 'MD',
          'PostalCode' => '21093',
          'CountryCode' => 'US'
      );
      $shipfrom['AttentionName'] = 'String';
      $shipfrom['Phone'] = array
      (
          'Number' => '6785851000',
          'Extension' => '123'
      );
      $shipment['ShipFrom'] = $shipfrom;
      $shipment['ShipperNumber'] = 'Your Shipper Number';

      $shipto['Name'] = 'Superman';
      $shipto['Address'] = array
      (
           'AddressLine' => '2010 Warsaw Road',
           'StateProvinceCode' => 'ON',
           'PostalCode' => 'M4C2M6',
           'CountryCode' => 'CA',

           'City' => 'Roswell',
           'StateProvinceCode' => 'GA',
           'PostalCode' => '30076',
           'CountryCode' => 'US'
       );
       $shipto['AttentionName'] = 'String';
       $shipto['Phone'] = array
       (
           'Number' => '6785851000',
           'Extention' => '111'
       );
       $shipment['ShipTo'] = $shipto;

       $payer['Name'] = 'Superman';
       $payer['Address'] = array
       (
           'AddressLine' => '2010 Warsaw Road',
           'City' => 'Roswell',
           'StateProvinceCode' => 'GA',
           'PostalCode' => '30075',
           'CountryCode' => 'US'
       );
       $payer['ShipperNumber'] = 'Your Shipper Number';
       $payer['AttentionName'] = 'String';
       $payer['Phone'] = array
       (
           'Number' => '6785851000'
       );
       $paymentinformation['Payer'] = $payer;
       $paymentinformation['ShipmentBillingOption'] = array
       (
           'Code' => '10',
           'Description' => 'String'
       );
       $shipment['PaymentInformation'] = $paymentinformation;
       $shipment['Service'] = array
       (
           'Code' => '308',
           'Description' => 'String'
       );

       $shipment['HandlingUnitOne'] = array
       (
           'Quantity' => '16',
           'Type' => array
           (
               'Code' => 'PLT',
               'Description' => 'String'
           )
       );
       $shipment['Commodity'] = array
       (
           'CommodityID' => '22',
           'Description' => 'BUGS',
           'Weight' => array
           (
               'UnitOfMeasurement' => array
               (
                    'Code' => 'LBS',
                    'Description' => 'String'
               ),
               'Value' => '511.25'
           ),
           'Dimensions' => array
           (
               'UnitOfMeasurement' => array
               (
                    'Code' => 'IN',
                    'Description' => 'String'
               ),
               'Length' => '1.25',
               'Width' => '1.2',
               'Height' => '5'
           ),
           'NumberOfPieces' => '1',
           'PackagingType' => array
           (
               'Code' => 'PLT',
               'Description' => 'String'
           ),
           'CommodityValue' => array
           (
               'CurrencyCode' => 'USD',
               'MonetaryValue' => '265.2'
           ),
           'FreightClass' => '60',
           'NMFCCommodityCode' => '566'
       );

       $shipment['Reference'] = array
       (
           'Number' => array
           (
                'Code' => 'PM',
                'Value' => '1651651616'
           ),

           'BarCodeIndicator' => array
           (
                'NumberOfCartons' => '5',
                'Weight' => array
                (
                    'UnitOfMeasurement' => array
                    (
                        'Code' => 'LBS',
                        'Description' => 'String'
                    ),
                    'Value' => '2'
                )
           )
       );
      $request['Shipment'] = $shipment;

      echo "Request.......\n";
      print_r($request);
      echo "\n\n";
      return $request;
  }

  try
  {

    $mode = array
    (
         'soap_version' => 'SOAP_1_1',  // use soap 1.1 client
         'trace' => 1
    );

    // initialize soap client
  	$client = new SoapClient($wsdl , $mode);

  	//set endpoint url
  	$client->__setLocation($endpointurl);


    //create soap header
    $usernameToken['Username'] = $userid;
    $usernameToken['Password'] = $passwd;
    $serviceAccessLicense['AccessLicenseNumber'] = $access;
    $upss['UsernameToken'] = $usernameToken;
    $upss['ServiceAccessToken'] = $serviceAccessLicense;

    $header = new SoapHeader('http://www.ups.com/XMLSchema/XOLTWS/UPSS/v1.0','UPSSecurity',$upss);
    $client->__setSoapHeaders($header);


    //get response
  	@ $resp = $client->__soapCall($operation ,array(processShipment()));

    //get status
    echo "Response Status: " . $resp->Response->ResponseStatus->Description ."\n";

    //save soap request and response to file
    $fw = fopen($outputFileName , 'w');
    fwrite($fw , "Request: \n" . $client->__getLastRequest() . "\n");
    fwrite($fw , "Response: \n" . $client->__getLastResponse() . "\n");
    fclose($fw);

  }
  catch(Exception $ex)
  {
  	print_r ($ex);
  }

?>
