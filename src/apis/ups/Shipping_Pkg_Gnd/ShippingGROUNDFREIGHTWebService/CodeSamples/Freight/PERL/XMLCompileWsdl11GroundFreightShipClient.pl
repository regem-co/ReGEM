 no warnings; # turn off warnings
 
 use XML::Compile::WSDL11;
 use XML::Compile::SOAP11;
 use XML::Compile::Transport::SOAPHTTP;
 use HTTP::Request;
 use HTTP::Response;
 use Data::Dumper;
 
 #Configuration
 $access = " Add License Key Here";
 $userid = " Add User Id Here";
 $passwd = " Add Password Here";
 $operation = "ProcessShipment";
 $endpointurl = " Add URL Here";
 $wsdlfile = " Add Wsdl File Here ";
 $schemadir = "Add Schema Location Here";
 $outputFileName = "XOLTResult.xml";
 
 sub processShipment
 {
 	my $request =
 	{
 		UPSSecurity =>  
	  	{
		   UsernameToken =>
		   {
			   Username => "$userid",
			   Password => "$passwd"
		   },
		   ServiceAccessToken =>
		   {
			   AccessLicenseNumber => "$access"
		   }
	  	},
		Request =>
		{
			RequestOption => ['1' , 'Shipping'],
			TransactionReference =>
			{
				CustomerContext => 'Add description'
			}
		},
		Shipment =>
		{
			ShipFrom =>
			{
				Name => 'Ship From Name',
				TaxIdentificationNumber => '1234567890',
				Address =>
				{
					 AddressLine => 'Street Name',
					 City => 'City Name',
					 StateProvinceCode => 'State or Province Code',
					 PostalCode => 'Postal Code',
					 CountryCode => 'Country Code'
				},
				AttentionName => 'Attention Name',
				Phone =>
				{
					Number => '123456789',
					Extension => '123'
				},
			},
			ShipperNumber => 'Shipper Number',
			ShipTo =>
			{
				Name => 'Ship To Name',
				Address =>
				{
					AddressLine => 'Street Name',
					StateProvinceCode => 'State or Province Code',
					PostalCode => 'Postal Code',
					CountryCode => 'Country Code',
					
					City => 'City Name',
					StateProvinceCode => 'State or Province Code',
					PostalCode => 'Postal Code',
					CountryCode => 'Code'
				},
				AttentionName => 'Attention Name',
				Phone =>
				{
					Number => '123456789',
					Extension => '111'
				}
			},
			PaymentInformation =>
			{
				Payer => 
				{
					Name => 'Payer Name',
					Address =>
					{
						AddressLine => 'Street Name',
						City => 'City Name',
						StateProvinceCode => 'State or Province Code',
						PostalCode => 'Postal Code',
						CountryCode => 'Country Code'
					},
					ShipperNumber => 'Payer Shipper Number',
					AttentionName => 'Attention Name',
					Phone =>
					{
						Number => '123456789'
					},
				},
				ShipmentBillingOption =>
				{
					Code => '10',
					Description => 'Billing Description'
				}
			},
			Service =>
			{
				Code => '308',
				Description => 'Service Description'
			},
			HandlingUnitOne =>
			{
				Quantity => '16',
				Type =>
				{
					Code => 'PLT',
					Description => 'Handling Unit Description'
				}
			},
			Commodity =>
			{
				CommodityID => '22',
				Description => 'Commodity Description',
				Weight =>
				{
					UnitOfMeasurement =>
					{
						Code => 'LBS',
						Description => 'Measurement Description'
					},
					Value => '123.45'
				},
				Dimensions =>
				{
					UnitOfMeasurement =>
					{
						Code => 'IN',
						Description => 'Measurement Description'
					},
					Length => '1.25',
					Width => '1.2',
					Height => '5'
				},
				NumberOfPieces => '1',
				PackagingType =>
				{
					Code => 'PLT',
					Description => 'Packaging Description'
				},
				CommodityValue =>
				{
					CurrencyCode => 'USD',
					MonetaryValue => '265.2'
				},
				FreightClass => '60',
				NMFCCommodityCode => '566'
			},
			Reference =>
			{
				Number =>
				{
					Code => 'PM',
					Value => '1651651616'
				},
				BarCodeIndicator =>
				{
					NumberOfCartons => '5',
					Weight =>
					{
						UnitOfMeasurement =>
						{
							Code => 'LBS',
							Description => 'Measurement Description'
						},
						Value => '2'
					}
				}
			}
		}
 	};
 	
 	return $request;
 }
 
 my $wsdl = XML::Compile::WSDL11->new( $wsdlfile );
 my @schemas = glob "$schemadir/*.xsd";
 $wsdl->importDefinitions(\@schemas) if scalar(@schemas) > 0;
 my $operation = $wsdl->operation($operation);
 my $call = $operation->compileClient(endpoint => $endpointurl);
 
 ($answer , $trace) = $call->(processShipment() , 'UTF-8');	
 
 if($answer->{Fault})
 {
	print $answer->{Fault}->{faultstring} ."\n";
	print Dumper($answer);
	print "See XOLTResult.xml for details.\n";
		
	# Save Soap Request and Response Details
	open(fw,">$outputFileName");
	$trace->printRequest(\*fw);
	$trace->printResponse(\*fw);
	close(fw);
 }
 else
 {
	# Get Response Status Description
    print "Description: " . $answer->{Body}->{Response}->{ResponseStatus}->{Description} . "\n"; 
        
    # Print Request and Response
    my $req = $trace->request();
 	print "Request: \n" . $req->content() . "\n";
	my $resp = $trace->response();
	print "Response: \n" . $resp->content();
		
	# Save Soap Request and Response Details
	open(fw,">$outputFileName");
	$trace->printRequest(\*fw);
	$trace->printResponse(\*fw);
	close(fw);
}
 