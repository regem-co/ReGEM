using System;
using System.Collections.Generic;
using System.Text;
using FreightShipWSSample.FreightShipWebReference;
using System.ServiceModel;

namespace FreightShipWSSample
{
    class FreightShipWSClient
    {
        static void Main()
        {
            try
            {
                FreightShipService freightShipService = new FreightShipService();
                FreightShipRequest freightShipRequest = new FreightShipRequest();
                RequestType request = new RequestType();
                String[] requestOption = { "1" };
                request.RequestOption = requestOption;
                freightShipRequest.Request = request;
                ShipmentType shipment = new ShipmentType();

                /** ****************ShipFrom******************************* */
                ShipFromType shipFrom = new ShipFromType();
                FreightShipAddressType shipFromAddress = new FreightShipAddressType();
                String[] shipFromAddressLines = { "ShipFrom address line" };
                shipFromAddress.AddressLine = shipFromAddressLines;
                shipFromAddress.City = "Roswell";
                shipFromAddress.StateProvinceCode = "GA";
                shipFromAddress.PostalCode = "30076";
                shipFromAddress.CountryCode = "US";
                shipFrom.Address = shipFromAddress;
                shipFrom.AttentionName = "XYZ Associates";
                shipFrom.Name = "XYZ Associates";

                FreightShipPhoneType shipFromPhone = new FreightShipPhoneType();
                shipFromPhone.Number = "123456789";
                shipFromPhone.Extension = "34567";
                shipFrom.Phone = shipFromPhone;
                shipFrom.EMailAddress = "fyq9wpg@ups.com";
                shipment.ShipFrom = shipFrom;
                /** ****************ShipFrom******************************* */

                shipment.ShipperNumber = "Your shipper number";

                /** ****************ShipTo*************************************** */
                ShipToType shipTo = new ShipToType();
                FreightShipAddressType shipToAddress = new FreightShipAddressType();
                String[] shipToAddressLines = { "ShipTo address line" };
                shipToAddress.AddressLine = shipToAddressLines;
                shipToAddress.City = "Roswell";
                shipToAddress.StateProvinceCode = "GA";
                shipToAddress.PostalCode = "30076";
                shipToAddress.CountryCode = "US";
                shipTo.Address = shipFromAddress;
                shipTo.AttentionName = "PQR Associates";
                shipTo.Name = "PQR";
                FreightShipPhoneType shipToPhone = new FreightShipPhoneType();
                shipToPhone.Number = "123456789";
                shipToPhone.Extension = "34567";
                shipTo.Phone = shipToPhone;
                shipTo.EMailAddress = "wbb6tdf@ups.com";
                shipment.ShipTo = shipTo;
                /** ****************ShipTo*************************************** */

                /** ***************PaymentInformationType************************* */
                PaymentInformationType paymentInfo = new PaymentInformationType();
                PayerType payer = new PayerType();
                payer.AttentionName = "Mr. XYZ";
                payer.Name = "XYZ Associates";
                FreightShipPhoneType payerPhone = new FreightShipPhoneType();
                payerPhone.Number = "123456789";
                payerPhone.Extension = "3456";
                payer.Phone = payerPhone;
                payer.ShipperNumber = "Your Shipper Number";
                payer.EMailAddress = "fyq9wpg@ups.com";

                FreightShipAddressType payerAddress = new FreightShipAddressType();
                String[] payerAddressLines = { "Payer address line" };
                payerAddress.AddressLine = payerAddressLines;
                payerAddress.City = "Roswell";
                payerAddress.StateProvinceCode = "GA";
                payerAddress.PostalCode = "30075";
                payerAddress.CountryCode = "US";
                payer.Address = payerAddress;
                paymentInfo.Payer = payer;
                ShipCodeDescriptionType shipBillOption = new ShipCodeDescriptionType();
                shipBillOption.Code = "10";
                shipBillOption.Description = "PREPAID";
                paymentInfo.ShipmentBillingOption = shipBillOption;
                shipment.PaymentInformation = paymentInfo;
                /** ***************PaymentInformationType************************* */

                /** ***************Service************************************** */
                ShipCodeDescriptionType service = new ShipCodeDescriptionType();
                service.Code = "309";
                service.Description = "UPS Ground Freight";
                shipment.Service = service;
                /** ***************Service************************************** */

                //Below sample contains dummy data for your reference
                //Please update dummy date as per your requirement
                /** **************Commodity************************************* */
                CommodityType commodity = new CommodityType();
                commodity.NumberOfPieces = "20";
                NMFCCommodityType nmfcCommodity = new NMFCCommodityType();
                nmfcCommodity.PrimeCode = "132680";
                nmfcCommodity.SubCode = "02";
                commodity.NMFCCommodity = nmfcCommodity;
                commodity.FreightClass = "77.5";
                ShipCodeDescriptionType packagingType = new ShipCodeDescriptionType();
                packagingType.Code = "BAG";
                packagingType.Description = "BAG";
                commodity.PackagingType = packagingType;
                WeightType weight = new WeightType();
                weight.Value = "200";
                FreightShipUnitOfMeasurementType unitOfMeasurement = new FreightShipUnitOfMeasurementType();
                unitOfMeasurement.Code = "lbs";
                unitOfMeasurement.Description = "pounds";
                weight.UnitOfMeasurement = unitOfMeasurement;
                commodity.Weight = weight;
                CommodityValueType commodityValue = new CommodityValueType();
                commodityValue.CurrencyCode = "USD";
                commodityValue.MonetaryValue = "100";
                commodity.CommodityValue = commodityValue;
                commodity.Description = "LCD TVS";
                CommodityType[] commodityArray = { commodity };
                shipment.Commodity = commodityArray;
                /** **************Commodity************************************* */

                /** **************HandlingUnitOne************************** */
                HandlingUnitType handlingUnit = new HandlingUnitType();
                handlingUnit.Quantity = "1";
                ShipCodeDescriptionType handlingUnitType = new ShipCodeDescriptionType();
                handlingUnitType.Code = "SKD";
                handlingUnitType.Description = "SKID";
                handlingUnit.Type = handlingUnitType;
                shipment.HandlingUnitOne = handlingUnit;
                /** **************HandlingUnitOne************************** */

                UPSSecurity upss = new UPSSecurity();
                UPSSecurityServiceAccessToken upssSvcAccessToken = new UPSSecurityServiceAccessToken();
                upssSvcAccessToken.AccessLicenseNumber = "Your License";
                upss.ServiceAccessToken = upssSvcAccessToken;
                UPSSecurityUsernameToken upssUsrNameToken = new UPSSecurityUsernameToken();
                upssUsrNameToken.Username = "Your Username";
                upssUsrNameToken.Password = "Your password";
                upss.UsernameToken = upssUsrNameToken;
                freightShipService.UPSSecurityValue = upss;

                freightShipRequest.Shipment = shipment;

                System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12 | System.Net.SecurityProtocolType.Tls | System.Net.SecurityProtocolType.Tls11; //This line will ensure the latest security protocol for consuming the web service call.
                Console.WriteLine(freightShipRequest);
                FreightShipResponse freightShipResponse = freightShipService.ProcessShipment(freightShipRequest);
                Console.WriteLine("The transaction was a " + freightShipResponse.Response.ResponseStatus.Description);
                Console.WriteLine("The BOLID of the shipment is: " + freightShipResponse.ShipmentResults.BOLID);
                Console.WriteLine("The Shipment number of the shipment is " + freightShipResponse.ShipmentResults.ShipmentNumber);
                Console.ReadKey();
            }
            catch (System.Web.Services.Protocols.SoapException ex)
            {
                Console.WriteLine("");
                Console.WriteLine("---------FreightShip Web Service returns error----------------");
                Console.WriteLine("---------\"Hard\" is user error \"Transient\" is system error----------------");
                Console.WriteLine("SoapException Message= " + ex.Message);
                Console.WriteLine("");
                Console.WriteLine("SoapException Category:Code:Message= " + ex.Detail.LastChild.InnerText);
                Console.WriteLine("");
                Console.WriteLine("SoapException XML String for all= " + ex.Detail.LastChild.OuterXml);
                Console.WriteLine("");
                Console.WriteLine("SoapException StackTrace= " + ex.StackTrace);
                Console.WriteLine("-------------------------");
                Console.WriteLine("");
            }
            catch (System.ServiceModel.CommunicationException ex)
            {
                Console.WriteLine("");
                Console.WriteLine("--------------------");
                Console.WriteLine("CommunicationException= " + ex.Message);
                Console.WriteLine("CommunicationException-StackTrace= " + ex.StackTrace);
                Console.WriteLine("-------------------------");
                Console.WriteLine("");

            }
            catch (Exception ex)
            {
                Console.WriteLine("");
                Console.WriteLine("-------------------------");
                Console.WriteLine(" Generaal Exception= " + ex.Message);
                Console.WriteLine(" Generaal Exception-StackTrace= " + ex.StackTrace);
                Console.WriteLine("-------------------------");

            }
            finally
            {
                Console.ReadKey();
            }

        }
    }
}

