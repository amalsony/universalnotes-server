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
  searchItemsRequest["PartnerTag"] = process.env.AMAZON_ASSOCIATE_TAG;
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
