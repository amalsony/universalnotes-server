// const ProductAdvertisingAPIv1 = require("paapi5-nodejs-sdk");

// const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

// // Specify your credentials here. These are used to create and sign the request.
// defaultClient.accessKey = process.env.AMAZON_ACCESS_KEY;
// defaultClient.secretKey = process.env.AMAZON_SECRET_KEY;

// /**
//  * Specify Host and Region to which you want to send the request to.
//  * For more details refer:
//  * https://webservices.amazon.com/paapi5/documentation/common-request-parameters.html#host-and-region
//  */
// defaultClient.host = "webservices.amazon.com";
// defaultClient.region = "us-east-1";

// var api = new ProductAdvertisingAPIv1.DefaultApi();

// /**
//  * The following is a sample request for SearchItems operation.
//  * For more information on Product Advertising API 5.0 Operations,
//  * refer: https://webservices.amazon.com/paapi5/documentation/operations.html
//  */
// var searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();

// /** Enter your partner tag (store/tracking id) and partner type */
// searchItemsRequest["PartnerTag"] = "wardrobeai-20";
// searchItemsRequest["PartnerType"] = "Associates";

// // Specify search keywords
// searchItemsRequest["Keywords"] = "H&M Women's dress";

// /**
//  * Specify the category in which search request is to be made.
//  * For more details, refer:
//  * https://webservices.amazon.com/paapi5/documentation/use-cases/organization-of-items-on-amazon/search-index.html
//  */
// searchItemsRequest["SearchIndex"] = "Fashion";

// // Specify the number of items to be returned in search result
// searchItemsRequest["ItemCount"] = 2;

// /**
//  * Choose resources you want from SearchItemsResource enum
//  * For more details, refer: https://webservices.amazon.com/paapi5/documentation/search-items.html#resources-parameter
//  */
// searchItemsRequest["Resources"] = [
//   "Images.Primary.Medium",
//   "ItemInfo.Title",
//   "Offers.Listings.Price",
// ];

// var callback = function (error, data, response) {
//   if (error) {
//     console.log("Error calling PA-API 5.0!");
//     console.log(
//       "Printing Full Error Object:\n" + JSON.stringify(error, null, 1)
//     );
//     console.log("Status Code: " + error["status"]);
//     if (
//       error["response"] !== undefined &&
//       error["response"]["text"] !== undefined
//     ) {
//       console.log(
//         "Error Object: " + JSON.stringify(error["response"]["text"], null, 1)
//       );
//     }
//   } else {
//     console.log("API called successfully.");
//     var searchItemsResponse =
//       ProductAdvertisingAPIv1.SearchItemsResponse.constructFromObject(data);
//     console.log(
//       "Complete Response: \n" + JSON.stringify(searchItemsResponse, null, 1)
//     );
//     if (searchItemsResponse["SearchResult"] !== undefined) {
//       console.log("Printing First Item Information in SearchResult:");
//       var item_0 = searchItemsResponse["SearchResult"]["Items"][0];
//       if (item_0 !== undefined) {
//         if (item_0["ASIN"] !== undefined) {
//           console.log("ASIN: " + item_0["ASIN"]);
//         }
//         if (item_0["DetailPageURL"] !== undefined) {
//           console.log("DetailPageURL: " + item_0["DetailPageURL"]);
//         }
//         if (
//           item_0["ItemInfo"] !== undefined &&
//           item_0["ItemInfo"]["Title"] !== undefined &&
//           item_0["ItemInfo"]["Title"]["DisplayValue"] !== undefined
//         ) {
//           console.log("Title: " + item_0["ItemInfo"]["Title"]["DisplayValue"]);
//         }
//         if (
//           item_0["Offers"] !== undefined &&
//           item_0["Offers"]["Listings"] !== undefined &&
//           item_0["Offers"]["Listings"][0]["Price"] !== undefined &&
//           item_0["Offers"]["Listings"][0]["Price"]["DisplayAmount"] !==
//             undefined
//         ) {
//           console.log(
//             "Buying Price: " +
//               item_0["Offers"]["Listings"][0]["Price"]["DisplayAmount"]
//           );
//         }
//       }
//     }
//     if (searchItemsResponse["Errors"] !== undefined) {
//       console.log("Errors:");
//       console.log(
//         "Complete Error Response: " +
//           JSON.stringify(searchItemsResponse["Errors"], null, 1)
//       );
//       console.log("Printing 1st Error:");
//       var error_0 = searchItemsResponse["Errors"][0];
//       console.log("Error Code: " + error_0["Code"]);
//       console.log("Error Message: " + error_0["Message"]);
//     }
//   }
// };

// function searchAmazon() {
//   try {
//     api.searchItems(searchItemsRequest, callback);
//   } catch (ex) {
//     console.log("Exception: " + ex);
//   }
// }

// module.exports = searchAmazon;

const ProductAdvertisingAPIv1 = require("paapi5-nodejs-sdk");

const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

// Specify your credentials here
defaultClient.accessKey = process.env.AMAZON_ACCESS_KEY;
defaultClient.secretKey = process.env.AMAZON_SECRET_KEY;
defaultClient.host = "webservices.amazon.com";
defaultClient.region = "us-east-1";

var api = new ProductAdvertisingAPIv1.DefaultApi();

/**
 * Function to search Amazon with provided keywords.
 * @param {string} keywords - The search keywords.
 * @returns {Promise<Array>} - Promise that resolves to an array of product data.
 */
function searchAmazon(keywords) {
  var searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
  searchItemsRequest["PartnerTag"] = "wardrobeai-20";
  searchItemsRequest["PartnerType"] = "Associates";
  searchItemsRequest["Keywords"] = keywords;
  searchItemsRequest["SearchIndex"] = "Fashion";
  searchItemsRequest["ItemCount"] = 4;
  searchItemsRequest["Resources"] = [
    "Images.Primary.Medium",
    "ItemInfo.Title",
    "Offers.Listings.Price",
  ];

  return new Promise((resolve, reject) => {
    api.searchItems(searchItemsRequest, function (error, data) {
      if (error) {
        console.error("Error calling PA-API 5.0:", error);
        reject(error);
      } else {
        const items = data.SearchResult.Items.map((item) => {
          const price =
            item.Offers &&
            item.Offers.Listings &&
            item.Offers.Listings.length > 0 &&
            item.Offers.Listings[0].Price
              ? item.Offers.Listings[0].Price.DisplayAmount
              : "Tap to view price";

          return {
            _id: item.ASIN,
            name:
              item.ItemInfo &&
              item.ItemInfo.Title &&
              item.ItemInfo.Title.DisplayValue
                ? item.ItemInfo.Title.DisplayValue
                : "Title not available",
            brand:
              item.ItemInfo &&
              item.ItemInfo.ByLineInfo &&
              item.ItemInfo.ByLineInfo.Brand
                ? item.ItemInfo.ByLineInfo.Brand.DisplayValue
                : "Tap to view brand",
            image:
              item.Images &&
              item.Images.Primary &&
              item.Images.Primary.Medium &&
              item.Images.Primary.Medium.URL
                ? item.Images.Primary.Medium.URL
                : "Image not available",
            price: price,
            link: item.DetailPageURL
              ? item.DetailPageURL
              : "Link not available",
          };
        });
        resolve(items);
      }
    });
  });
}

module.exports = searchAmazon;
