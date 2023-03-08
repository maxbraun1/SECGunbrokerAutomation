import axios from 'axios';
import fs from 'fs';
import * as dotenv from 'dotenv';
import descriptionGenerator from './descriptionGenerator.js';
import { generateImages } from '../imageGenerator.js';
import chalk from 'chalk';
import * as ftp from 'basic-ftp';
import csvToJson from 'convert-csv-to-json/src/csvToJson.js';
import { logProcess } from '../index.js';
import { GunBrokerAccessToken } from '../index.js';
import { currentUserID } from '../index.js';
import { checkAlreadyPosted  } from '../index.js';

dotenv.config();

async function getInventory(){
  return new Promise(async (resolve,reject) => {
    logProcess("Retrieving Sports South Inventory...");
    await axios.get('http://webservices.theshootingwarehouse.com/smart/inventory.asmx/DailyItemUpdate?CustomerNumber='+process.env.SS_ACCOUNT_NUMBER+'&UserName='+process.env.SS_USERNAME+'&Password='+process.env.SS_PASSWORD+'&LastUpdate=1/1/1990&LastItem=-1&Source=string%20HTTP/1.1', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(function (response) {
      console.log(response.data);
      //resolve(response.data.data);
    }).catch(function (error) {
      console.log(error);
      //reject(error);
    });
  });
}

function filterInventory(inventory){
  logProcess("Filtering Results...");
  let lowestQuantityAllowed = 5;
  let lowestPriceAllowed = 150;
  let highestPriceAllowed = 2000;
  let typesAllowed = ['Pistol: Semi-Auto','Pistol','Rifle: Semi-Auto','Rifle: Bolt Action','Rifle: Lever Action','Rifle: Pump Action','Rifle','Revolver','Shotgun: Pump Action',
  'Shotgun: Over and Under','Shotgun: Semi-Auto','Shotgun: Lever Action','Shotgun: Single Shot','Shotgun: Bolt Action','Shotgun: Side by Side'];
  let filtered = [];
  
  inventory.map( async (item) => {
    if(item.Quantity >= lowestQuantityAllowed && typesAllowed.includes(item.GunType) && item.DealerPrice > lowestPriceAllowed && item.DealerPrice < highestPriceAllowed && item.UPCCode.toString().length == 12){
      filtered.push(item);
    }
  });
  console.log(inventory.length + " to " + filtered.length);
  return filtered;
}

function postOnGunBroker(item){
  return new Promise( async (resolve, reject) => {

    try{
      let thumbnail = fs.readFileSync('./tmp/thumbnail.jpeg');
      let img1 = fs.readFileSync('./tmp/tmp.jpeg');

      // Setting Quantity
      let quantity;
      
      if(item.Quantity >= 20){ quantity = 5 } else
      if(item.Quantity < 20){ quantity = 2 }
      else{ quantity = 0 };

      // Setting Price
      let price;
      // Davidsons doesnt provide a MAP price

      let cost = item.DealerPrice;
      let retail = item.RetailPrice; 

      price = cost * 1.15; // set price to cost of gun plus 15% then round to 2 decimals
      price = (Math.round(price * 100) / 100).toFixed(2);

      if(price < retail){ // if new price is lower than map, set price to map
        price = retail;
      }
      
      // Setting Category IDs and Shipping Prices
      let categoryID;
      let ShippingPrice = 30;

      switch(item.GunType) {
        case 'Pistol: Semi-Auto':
          ShippingPrice = 29;
          categoryID = 3026;
          break;
        case 'Pistol':
          ShippingPrice = 29;
          categoryID = 3027;
          break;
        case 'Rifle: Semi-Auto':
          categoryID = 3024;
          break;
        case 'Rifle: Bolt Action':
          categoryID = 3022;
          break;
        case 'Rifle: Lever Action':
          categoryID = 3023;
          break;
        case 'Rifle: Pump Action':
          categoryID = 3102;
          break;
        case 'Rifle':
          categoryID = 3025;
          break;
        case 'Revolver':
          ShippingPrice = 29;
          categoryID = 2325;
          break;
        case 'Shotgun: Pump Action':
          categoryID = 3106;
          break;
        case 'Shotgun: Over and Under':
          categoryID = 3103;
          break;
        case 'Shotgun: Semi-Auto':
          categoryID = 3105;
          break;
        case 'Shotgun: Lever Action':
          categoryID = 3113;
          break;
        case 'Shotgun: Single Shot':
          categoryID = 3107;
          break;
        case 'Shotgun: Bolt Action':
          categoryID = 3112;
          break;
        case 'Shotgun: Side by Side':
          categoryID = 3104;
          break;
        default:
          categoryID = 3004;
      }

      var title = item.Manufacturer + " " + item.ModelSeries + " " + item.Caliber + " " + item.Capacity + " | " + item.UPCCode;

      if(title.length > 75){
        title = item.Manufacturer + " " + item.ModelSeries + " | " + item.UPCCode;
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
          Manufacturer: item.Manufacturer,
          Model: item.ModelSeries,
          Caliber: item.Caliber,
        },
        Condition: 1, // Factory New
        CountryCode: "US",
        Description: descriptionGenerator(item),
        FixedPrice: price,
        InspectionPeriod: 1, // Sales are final
        isFFLRequired: true,
        ListingDuration: 90, // List for 90 days
        MfgPartNumber: item.ModelSeries,
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
        UPC: item.UPCCode,
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
    let alreadyPosted = await checkAlreadyPosted(item.UPCCode);
    if(alreadyPosted){
      console.log(chalk.bold.blue.bgWhite(" Davidsons Item "+ count + " / " + listings.length + " ") + chalk.bold.yellow(" ["+item.UPCCode+"] Item already posted."));
    }else{
      await generateImages('https://res.cloudinary.com/davidsons-inc/c_lpad,dpr_2.0,f_auto,h_635,q_100,w_635/v1/media/catalog/product/' + item.itemNo.charAt(0) + "/" + item.itemNo.charAt(1) + "/" + item.itemNo + ".jpg")
      .then( async () => {
        await postOnGunBroker(item, count).catch((error) => console.log(error)).then(() => {
          countPosted++;
          console.log(chalk.bold.blue.bgWhite(" Davidsons Item "+ count + " / " + listings.length + " ") + chalk.bold.green(" [" + item.UPCCode + "] Item (" + item.Manufacturer + " " + item.ModelSeries + ") Posted"));
        });
      })
      .catch((error) => {
        console.log(chalk.bold.red("Image Download Error: "+error));
      });
    }
  }
  console.log(chalk.bold.green("Davidsons postings complete. "+countPosted+" listings posted."));
  return countPosted;
}

async function postDavidsonsProducts(){
  let inventory = await getInventory();
  let filteredInventory = filterInventory(inventory);
  let countPosted = await postAllListings(filteredInventory);
  return countPosted;
}

export {getInventory};