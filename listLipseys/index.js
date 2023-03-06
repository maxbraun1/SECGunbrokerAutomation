import axios from 'axios';
import fs from 'fs';
import * as dotenv from 'dotenv';
import descriptionGenerator from './descriptionGenerator.js';
import { generateImages } from '../imageGenerator.js';
import chalk from 'chalk';
import { logProcess } from '../index.js';
import { GunBrokerAccessToken } from '../index.js';
import { checkAlreadyPosted  } from '../index.js';
import { LipseyAuthToken } from '../index.js';

dotenv.config();

function getInventory(){
  return new Promise(async (resolve,reject) => {
    let token = await LipseyAuthToken;
    logProcess("Retrieving Lipseys Inventory...");
    await axios.get('https://api.lipseys.com/api/Integration/Items/CatalogFeed', {
      headers: {
        Token: token
      }
    }).then(function (response) {
      resolve(response.data.data);
    }).catch(function (error) {
      reject(error);
    });
  });
}

async function filterInventory(dataset){
  logProcess("Filtering Results...");
  let lowestQuantityAllowed = 5;
  let typesAllowed = ['Semi-Auto Pistol','Rifle', 'Revolver', 'Shotgun'];
  let filtered = [];
  
  await dataset.map( async (item) => {
    if(item.quantity >= lowestQuantityAllowed && typesAllowed.includes(item.type) && item.allocated == false && item.price > 150 && item.upc.toString().length == 12){
      filtered.push(item);
    }
  });
  logProcess(chalk.green.bold(filtered.length) + " products eligable to post (after filter)");
  return filtered;
}

function postOnGunBroker(item){
  return new Promise( async (resolve, reject) => {

    try{
      let thumbnail = fs.readFileSync('./tmp/thumbnail.jpeg');
      let img1 = fs.readFileSync('./tmp/tmp.jpeg');

      // Setting Quantity
      let quantity;
      
      if(item.quantity >= 20){ quantity = 5 } else
      if(item.quantity < 20){ quantity = 2 }
      else{ quantity = 0 };

      // Setting Price
      let price;

      let cost = item.price;
      let map = item.retailMap; // Map will be number, 0 if there is no map

      price = cost * 1.15; // set price to cost of gun plus 15% then round to 2 decimals
      price = (Math.round(price * 100) / 100).toFixed(2);

      if(price < map){ // if new price is lower than map, set price to map
        price = map;
      }
      
      // Setting Category IDs and Shipping Prices
      let categoryID;
      let ShippingPrice = 30;

      switch(item.type) {
        case 'Semi-Auto Pistol':
          ShippingPrice = 29;
          categoryID = 3026;
          break;
        case 'Rifle':
          switch (item.action) {
            case 'Semi-Auto':
              categoryID = 3024;
              break;
            case 'Single Shot':
              categoryID = 3011;
              break;
            case 'Pump Action':
              categoryID = 3102;
              break;
            case 'Bolt Action':
              categoryID = 3022;
              break;
            case 'Lever Action':
              categoryID = 3023;
              break;
            default:
              categoryID = 3025;
          }
          break;
        case 'Revolver':
          categoryID = 2325;
          break;
        case 'Shotgun':
          switch (item.action) {
            case 'Semi-Auto':
              categoryID = 3105;
              break;
            case 'Side By Side':
              categoryID = 3104;
              break;
            case 'Over / Under':
              categoryID = 3103;
              break;
            case 'Pump Action':
              categoryID = 3106;
              break;
            default:
              categoryID = 3108;
          }
          break;
        default:
          categoryID = 3004;
      }

      var title = item.manufacturer + " " + item.model + " " + item.caliberGauge + " " + item.capacity + " | " + item.upc;

      if(title.length > 75){
        title = item.manufacturer + " " + item.model + " | " + item.upc;
        if(title.length > 75){
          return;
        }
      }

      title = Array.from(new Set(title.split(' '))).toString();
      title = title.replaceAll(",", " ");

      // Prepare listing
      var listingSettings = {
        AutoRelist: 1, // Do not relist
        CanOffer: false, 
        CategoryID: categoryID,
        Characteristics: {
          Manufacturer: item.manufacturer,
          Model: item.model,
          Caliber: item.caliberGauge,
        },
        Condition: 1, // Factory New
        CountryCode: "US",
        Description: descriptionGenerator(item),
        FixedPrice: price,
        InspectionPeriod: 1, // Sales are final
        isFFLRequired: true,
        ListingDuration: 90, // List for 90 days
        MfgPartNumber: item.manufacturerModelNo,
        PaymentMethods: {
          Check: false,
          VisaMastercard: true,
          COD: false,
          Escrow: false,
          Amex: true,
          PayPal: false,
          Discover: true,
          SeeItemDesc: false,
          CertifiedCheck: false,
          USPSMoneyOrder: true,
          MoneyOrder: true,
          FreedomCoin: false
        },
        PaymentPlan: 0,
        PremiumFeatures: {
          IsFeaturedItem: true,
        },
        PostalCode: "33511",
        Prop65Warning: "Cancer and Reproductive Harm www.P65Warnings.ca.gov",
        Quantity: quantity,
        UseDefaultSalesTax: true,
        ShippingClassesSupported: {
          Overnight: false,
          TwoDay: false,
          ThreeDay: false,
          Ground: true,
          FirstClass: false,
          Priority: false,
          InStorePickup: false,
          AlaskaHawaii: false,
          Other: false
        },
        ShippingClassCosts: { Ground: ShippingPrice },
        StandardTextID: 1138,
        Title: title,
        UPC: item.upc,
        WhoPaysForShipping: 8,
        WillShipInternational: false
      };

      const listingSettingsJSON = JSON.stringify(listingSettings);
      const listingSettingsBlob = new Blob([listingSettingsJSON], {
        type: 'form-data',
      });
      const thumbnailBlob = new Blob([thumbnail], { name: "thumbnail", type: 'image/jpeg', 'Content-Disposition':'form-data' });
      const img1Blob = new Blob([thumbnail], { name: "picture", type: 'image/jpeg', 'Content-Disposition':'form-data' });
      const img2Blob = new Blob([img1], { name: "picture", type: 'image/jpeg', 'Content-Disposition':'form-data' });
      const data = new FormData();
      data.append("data", listingSettingsBlob);
      data.append("thumbnail", thumbnailBlob, 'thumbnail.jpeg');
      data.append("picture", img1Blob, 'picture1.jpeg');
      data.append("picture", img2Blob, 'picture2.jpeg');

      let token = await GunBrokerAccessToken;
      await axios.post('https://api.sandbox.gunbroker.com/v1/Items', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-DevKey': process.env.GUNBROKER_DEVKEY,
          'X-AccessToken': token
        }
      })
      .then(function (response) {
        logProcess(response.data.userMessage,'good');
      })
      .catch(function (error) {
        console.log(error.response.data);
        reject(error.response.data);
        return;
      });

      resolve();
    }catch(error){
      logProcess(error, 'bad');
      reject(error);
      return;
    }
  });
}

async function postAllListings(listings, limit){

  if(limit && limit < listings.length){
    listings = listings.slice(0, limit);
  }

  logProcess("Posting " + chalk.bold.green(listings.length) + " items on GunBroker.");

  let count = 0;
  let countPosted = 0;

  for(let item of listings){
    count++;

    // Check if item is already posted
    let alreadyPosted = await checkAlreadyPosted(item.upc);
    if(alreadyPosted){
      console.log(chalk.bold.blue.bgWhite(" Lipseys Item "+ count + " / " + listings.length + " ") + chalk.bold.yellow(" ["+item.upc+"] Item already posted."));
    }else{
      await generateImages("https://www.lipseyscloud.com/images/"+item.imageName)
      .then( async () => {
        await postOnGunBroker(item, count).catch((error) => console.log(error)).then(() => {
          countPosted++;
          console.log(chalk.bold.blue.bgWhite(" Lipseys Item "+ count + " / " + listings.length + " ") + chalk.bold.green(" [" + item.upc + "] Item (" + item.manufacturer + " " + item.model + ") Posted"));
        });
      })
      .catch((error) => {
        console.log(error);
      });
    }
  }
  console.log(chalk.bold.green("Lipseys postings complete. "+countPosted+" listings posted."));
  return countPosted;
}

async function postLipseysProducts(){
  let inventory = await getInventory().catch((error) => console.log(error));
  let filteredInventory = await filterInventory(inventory);
  let countPosted = await postAllListings(filteredInventory);
  return countPosted;
}

export {postLipseysProducts};