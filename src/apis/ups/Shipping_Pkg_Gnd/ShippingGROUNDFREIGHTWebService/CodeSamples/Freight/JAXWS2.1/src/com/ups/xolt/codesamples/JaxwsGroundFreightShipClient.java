/*
 **
 ** Filename: JaxwsFreightShipClient.java
 ** Authors: United Parcel Service of America
 **
 ** The use, disclosure, reproduction, modification, transfer, or transmittal
 ** of this work for any purpose in any form or by any means without the
 ** written permission of United Parcel Service is strictly prohibited.
 **
 ** Confidential, Unpublished Property of United Parcel Service.
 ** Use and Distribution Limited Solely to Authorized Personnel.
 **
 ** Copyright 2009 United Parcel Service of America, Inc.  All Rights Reserved.
 **
 */
package com.ups.xolt.codesamples;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Calendar;
import java.util.List;
import java.util.Properties;

import javax.xml.ws.BindingProvider;

import com.ups.xmlschema.xoltws.freightship.v1.FreightShipPortType;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipService;
import com.ups.xmlschema.xoltws.freightship.v1.ShipErrorMessage;
import com.ups.xmlschema.xoltws.freightship.v1.RequestType;
import com.ups.xmlschema.xoltws.freightship.v1.ErrorDetailType;
import com.ups.xmlschema.xoltws.freightship.v1.CommodityType;
import com.ups.xmlschema.xoltws.freightship.v1.CommodityValueType;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipAddressType;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipPhoneType;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipRequest;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipResponse;
import com.ups.xmlschema.xoltws.freightship.v1.FreightShipUnitOfMeasurementType;
import com.ups.xmlschema.xoltws.freightship.v1.HandlingUnitType;
import com.ups.xmlschema.xoltws.freightship.v1.NMFCCommodityType;
import com.ups.xmlschema.xoltws.freightship.v1.PayerType;
import com.ups.xmlschema.xoltws.freightship.v1.PaymentInformationType;
import com.ups.xmlschema.xoltws.freightship.v1.ShipCodeDescriptionType;
import com.ups.xmlschema.xoltws.freightship.v1.ShipFromType;
import com.ups.xmlschema.xoltws.freightship.v1.ShipToType;
import com.ups.xmlschema.xoltws.freightship.v1.ShipmentType;
import com.ups.xmlschema.xoltws.freightship.v1.WeightType;
import com.ups.xmlschema.xoltws.freightship.v1.UPSSecurity;
import com.ups.xmlschema.xoltws.freightship.v1.UPSSecurity.ServiceAccessToken;
import com.ups.xmlschema.xoltws.freightship.v1.UPSSecurity.UsernameToken;

public class JaxwsGroundFreightShipClient {
	private static String url;
	private static String accessKey;
	private static String userName;
	private static String password;
	private static String buildPropertiesPath="./build.properties";
	private static String out_file_location="out_file_location";
	private static String tool_or_webservice_name="tool_or_webservice_name";
    private static String statusCode = null;
	private static String description = null;

	private static void loadProperties(){
		Properties properties = new Properties();
		try {
			properties.load(new FileInputStream(buildPropertiesPath));

		} catch (IOException e) {
			statusCode = e.getMessage();
			description = e.toString();
			updateResultsToFile(statusCode, description);
			e.printStackTrace();
		}
		url=properties.getProperty("url");
		accessKey=properties.getProperty("accesskey");
		userName=properties.getProperty("username");
		password=properties.getProperty("password");
		out_file_location=properties.getProperty("out_file_location");
		tool_or_webservice_name=properties.getProperty("tool_or_webservice_name");
	}


	public static void main(String[] arguments) throws Exception {
		try {
			loadProperties();
			FreightShipService freightShipService = new FreightShipService();
			FreightShipPortType freightShipPort = freightShipService.getFreightShipPort();
			BindingProvider bp = (BindingProvider)freightShipPort;
	    	bp.getRequestContext().put(BindingProvider.ENDPOINT_ADDRESS_PROPERTY, url);
			FreightShipResponse freightShipResponse = freightShipPort.processShipment(populateGroundFreightShipRequest(), populateUPSSecurity());
			System.out.println("The transaction was a "+ freightShipResponse.getResponse().getResponseStatus().getDescription());
			System.out.println("The BOLID of the shipment is "+ freightShipResponse.getShipmentResults().getBOLID());

			System.out.println("The Shipment number of the shipment is "+ freightShipResponse.getShipmentResults().getShipmentNumber());
			statusCode = freightShipResponse.getResponse().getResponseStatus().getCode();
            description = freightShipResponse.getResponse().getResponseStatus().getDescription();
			updateResultsToFile(statusCode, description);


		}catch (Exception e) {
			if(e instanceof ShipErrorMessage){
				ShipErrorMessage err = (ShipErrorMessage)e;
				List errorDetail = err.getFaultInfo().getErrorDetail();
				ErrorDetailType errorDetailType = (ErrorDetailType)errorDetail.get(0);
				description = errorDetailType.getPrimaryErrorCode().getDescription();
				statusCode = errorDetailType.getPrimaryErrorCode().getCode();
				updateResultsToFile(statusCode, description);
				System.out.println("\nThe Error Response: Code=" + statusCode
					+ " Decription=" + description);
			}
			else{
				statusCode = e.getMessage();
				description = e.toString();
				updateResultsToFile(statusCode, description);
			}
		}
	}

	private static UPSSecurity populateUPSSecurity(){
		/** ************UPSSE************************** */
		UPSSecurity upsSecurity = new UPSSecurity();
		UsernameToken usernameToken = new UsernameToken();
		usernameToken.setUsername(userName);
		usernameToken.setPassword(password);
		upsSecurity.setUsernameToken(usernameToken);
		ServiceAccessToken accessToken = new ServiceAccessToken();
		accessToken.setAccessLicenseNumber(accessKey);
		upsSecurity.setServiceAccessToken(accessToken);

		/** ************UPSSE***************************** */

		return upsSecurity;
    }

	 private static FreightShipRequest populateGroundFreightShipRequest(){

			FreightShipRequest freightShipRequest = new FreightShipRequest();
			RequestType request = new RequestType();
			request.getRequestOption().add("1");
			freightShipRequest.setRequest(request);
			ShipmentType shipment = new ShipmentType();

			/** ****************ShipFrom******************************* */
			ShipFromType shipFrom = new ShipFromType();
			FreightShipAddressType shipFromAddress = new FreightShipAddressType();
			String[] shipFromAddressLines = { "AddressLine1" };
			shipFromAddress.getAddressLine().add(shipFromAddressLines[0]);
			shipFromAddress.setCity("Roswell");
			shipFromAddress.setStateProvinceCode("GA");
			shipFromAddress.setPostalCode("30076");
			shipFromAddress.setCountryCode("US");
			shipFrom.setAddress(shipFromAddress);
			shipFrom.setAttentionName("Mr. XYZ");
			shipFrom.setName("XYZ Associates");
			FreightShipPhoneType shipFromPhone = new FreightShipPhoneType();
			shipFromPhone.setNumber("123456789");
			shipFromPhone.setExtension("34567");
			shipFrom.setPhone(shipFromPhone);
			shipFrom.setEMailAddress("wbb6tdf@ups.com");
			shipment.setShipFrom(shipFrom);
			/** ****************ShipFrom******************************* */

			shipment.setShipperNumber("222006");

			/** ****************ShipTo*************************************** */
			ShipToType shipTo = new ShipToType();
			FreightShipAddressType shipToAddress = new FreightShipAddressType();
			String[] shipToAddressLines = { "123 main st", "Address Line2",
					"Address Line3" };
			shipToAddress.getAddressLine().add(shipToAddressLines[0]);
			shipToAddress.setCity("Roswell");
			shipToAddress.setStateProvinceCode("GA");
			shipToAddress.setPostalCode("30076");
			shipToAddress.setCountryCode("US");
			shipTo.setAddress(shipFromAddress);
			shipTo.setAttentionName("PQR Associates");
			shipTo.setName("PQR");
			FreightShipPhoneType shipToPhone = new FreightShipPhoneType();
			shipToPhone.setNumber("123456789");
			shipToPhone.setExtension("34567");
			shipTo.setPhone(shipToPhone);
			shipTo.setEMailAddress("wbb6tdf@ups.com");
			shipment.setShipTo(shipTo);
			/** ****************ShipTo*************************************** */

			/** ***************PaymentInformationType************************* */
			PaymentInformationType paymentInfo = new PaymentInformationType();
			PayerType payer = new PayerType();
			payer.setAttentionName("Mr. XYZ");
			payer.setName("XYZ Associates");
			FreightShipPhoneType payerPhone = new FreightShipPhoneType();
			payerPhone.setNumber("123456789");
			payerPhone.setExtension("3456");
			payer.setPhone(payerPhone);
			payer.setShipperNumber("Your Shipper Number");
			payer.setEMailAddress("xxx2yyy@ups.com");
			FreightShipAddressType payerAddress = new FreightShipAddressType();
			String[] payerAddressLines = { "123 main st", "Address Line2",
					"Address Line3" };
			payerAddress.getAddressLine().add(payerAddressLines[0]);
			payerAddress.setCity("Roswell");
			payerAddress.setStateProvinceCode("GA");
			payerAddress.setPostalCode("30075");
			payerAddress.setCountryCode("US");
			payer.setAddress(payerAddress);
			paymentInfo.setPayer(payer);
			ShipCodeDescriptionType shipBillOption = new ShipCodeDescriptionType();
			shipBillOption.setCode("10");
			shipBillOption.setDescription("PREPAID");
			paymentInfo.setShipmentBillingOption(shipBillOption);
			shipment.setPaymentInformation(paymentInfo);
			/** ***************PaymentInformationType************************* */

			/** ***************Service************************************** */
			ShipCodeDescriptionType service = new ShipCodeDescriptionType();
			service.setCode("309");
			service.setDescription("UPS Ground Freight");
			shipment.setService(service);
			/** ***************Service************************************** */

			/** **************Commodity************************************* */
			CommodityType commodity = new CommodityType();
			commodity.setNumberOfPieces("20");
			NMFCCommodityType nmfcCommodity = new NMFCCommodityType();
			nmfcCommodity.setPrimeCode("132680");
			nmfcCommodity.setSubCode("02");
			commodity.setNMFCCommodity(nmfcCommodity);
			commodity.setFreightClass("77.5");
			ShipCodeDescriptionType packagingType = new ShipCodeDescriptionType();
			packagingType.setCode("BAG");
			packagingType.setDescription("BAG");
			commodity.setPackagingType(packagingType);
			WeightType weight = new WeightType();
			weight.setValue("200");
			FreightShipUnitOfMeasurementType unitOfMeasurement = new FreightShipUnitOfMeasurementType();
			unitOfMeasurement.setCode("lbs");
			unitOfMeasurement.setDescription("pounds");
			weight.setUnitOfMeasurement(unitOfMeasurement);
			commodity.setWeight(weight);
			CommodityValueType commodityValue = new CommodityValueType();
			commodityValue.setCurrencyCode("USD");
			commodityValue.setMonetaryValue("100");
			commodity.setCommodityValue(commodityValue);
			commodity.setDescription("LCD TVS");
			CommodityType[] commodityArray = { commodity };
			shipment.getCommodity().add(commodityArray[0]);
			/** **************Commodity************************************* */

			/** **************HandlingUnitOne************************** */
			HandlingUnitType handlingUnit = new HandlingUnitType();
			handlingUnit.setQuantity("1");
			ShipCodeDescriptionType handlingUnitType = new ShipCodeDescriptionType();
			handlingUnitType.setCode("SKD");
			handlingUnitType.setDescription("SKID");
			handlingUnit.setType(handlingUnitType);
			shipment.setHandlingUnitOne(handlingUnit);
			/** **************HandlingUnitOne************************** */

			freightShipRequest.setShipment(shipment);
			return freightShipRequest;
	 }

	/**
     * This method updates the XOLTResult.xml file with the received status and description
     * @param statusCode
     * @param description
     */
	   private static void updateResultsToFile(String statusCode, String description){
	    	BufferedWriter bw = null;
	    	try{

	    		File outFile = new File(out_file_location);
	    		System.out.println("Output file deletion status: " + outFile.delete());
	    		outFile.createNewFile();
	    		System.out.println("Output file location: " + outFile.getCanonicalPath());
	    		bw = new BufferedWriter(new FileWriter(outFile));
	    		StringBuffer strBuf = new StringBuffer();
	    		strBuf.append("<ExecutionAt>");
	    		strBuf.append(Calendar.getInstance().getTime());
	    		strBuf.append("</ExecutionAt>\n");
	    		strBuf.append("<ToolOrWebServiceName>");
	    		strBuf.append(tool_or_webservice_name);
	    		strBuf.append("</ToolOrWebServiceName>\n");
	    		strBuf.append("\n");
	    		strBuf.append("<ResponseStatus>\n");
	    		strBuf.append("\t<Code>");
	    		strBuf.append(statusCode);
	    		strBuf.append("</Code>\n");
	    		strBuf.append("\t<Description>");
	    		strBuf.append(description);
	    		strBuf.append("</Description>\n");
	    		strBuf.append("</ResponseStatus>");
	    		bw.write(strBuf.toString());
	    		bw.close();
	    	}catch (Exception e) {
				e.printStackTrace();
			}finally{
				try{
					if (bw != null){
						bw.close();
						bw = null;
					}
				}catch (Exception e) {
					e.printStackTrace();
				}
			}
	    }
}
