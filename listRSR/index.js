import axios from 'axios';
import fs from 'fs';
import * as dotenv from 'dotenv';
import descriptionGenerator from './descriptionGenerator.js';
import { generateImages } from '../imageGenerator.js';
import chalk from 'chalk';
import csvToJson from 'convert-csv-to-json/src/csvToJson.js';
import * as ftp from 'basic-ftp';
import { logProcess } from '../index.js';
import { GunBrokerAccessToken } from '../index.js';
import { currentUserID } from '../index.js';
import { checkAlreadyPosted  } from '../index.js';

dotenv.config();

async function getInventoryFiles(){
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
      await client.access({
          host: "rsrgroup.com",
          user: process.env.RSRUSERNAME,
          password: process.env.RSRPASSWORD,
          secure: false
      });
      //console.log(await client.list());
      await client.downloadTo("rsrinventory.txt", "ftpdownloads/rsrinventory-new.txt");
      await client.downloadTo("attributes.txt", "ftpdownloads/attributes-all.txt");

      // Add headers to inventory file
      const InventoryData = fs.readFileSync('rsrinventory.txt')
      const Inventoryfd = fs.openSync('rsrinventory.txt', 'w+')
      const InventoryHeaders = "stockNo;upc;description;dept;manufacturerId;retailPrice;rsrPrice;weight;quantity;model;mfgName;mfgPartNo;status;longDescription;imgName;AK;AL;AR;AZ;CA;CO;CT;DC;DE;FL;GA;HI;IA;ID;IL;IN;KS;KY;LA;MA;MD;ME;MI;MN;MO;MS;MT;NC;ND;NE;NH;NJ;NM;NV;NY;OH;OK;OR;PA;RI;SC;SD;TN;TX;UT;VA;VT;WA;WI;WV;WY;groundShipmentsOnly;adultSigRequired;noDropShip;date;retailMAP;imageDisclaimer;length;width;height;prop65;vendorApprovalRequired\n";
      const InventoryInsert = Buffer.from(InventoryHeaders);
      fs.writeSync(Inventoryfd, InventoryInsert, 0, InventoryInsert.length, 0)
      fs.writeSync(Inventoryfd, InventoryData, 0, InventoryData.length, InventoryInsert.length)
      fs.close(Inventoryfd, (err) => {
        if (err) throw err;
      });

      // Add headers to attributes file
      const AttributesData = fs.readFileSync('attributes.txt')
      const Attributesfd = fs.openSync('attributes.txt', 'w+')
      const AttributesHeaders = "stockNo;manufacturerId;accessories;action;typeOfBarrel;barrelLength;catalogCode;chamber;chokes;condition;capacity;description;dram;edge;firingCasing;finish;fit;fit2;fps;frame;caliber;caliber2;grainWeight;grips;hand;mfg;mfgPartNo;weight;moa;model;model2;newStockNo;nsn;objective;ounceOfShot;packaging;power;reticle;safety;sights;size;type;unitsPerBox;unitsPerCase;wtCharacteristics;subCategory;diameter;color;material;stock;lensColor;handleColor;x;y;z\n";
      const AttributesInsert = Buffer.from(AttributesHeaders);
      fs.writeSync(Attributesfd, AttributesInsert, 0, AttributesInsert.length, 0)
      fs.writeSync(Attributesfd, AttributesData, 0, AttributesData.length, AttributesInsert.length)
      fs.close(Attributesfd, (err) => {
        if (err) throw err;
      });
  }
  catch(err) {
      console.log(err);
  }
  console.log(chalk.bold.green("File downloaded and headers added."));
  client.close();
}

async function getInventory(){

  await getInventoryFiles();

  let products = csvToJson.getJsonFromCsv('rsrinventory.txt');
  let productInfo = csvToJson.getJsonFromCsv('attributes.txt');

  let withImage = products.filter( item => item.imgName);

  let items = withImage.map((item) => {
    item.upc = parseInt(item.upc);
    item.rsrPrice = Number(item.rsrPrice);
    item.quantity = parseInt(item.quantity);
    item.retailMAP = Number(item.retailMAP);
    item.imgName = item.imgName.replace('.','_HR.');
    item.imageURL = 'https://img.rsrgroup.com/highres-pimages/' + item.imgName;

    return item;
  });
  return filterProducts(items, productInfo);
}

function filterProducts(products, productInfo){
  logProcess("Filtering Results and combining with product details...");
  let lowestQuantityAllowed = 5;
  let lowestPriceAllowed = 150;
  let highestPriceAllowed = 3000;
  let typesAllowed = ['01','05'];
  let categoriesAllowed = ['Modern Sporting Rifles','Sporting Shotguns','Pistols - Metal Frame','Pistols - Polymer Frame','Bullpups','Defensive Shotguns','Hunting Rifles',
  'Other Handguns','Revolvers','AK Style Rifles'];
  let filtered = [];
  
  // First Filter and Combine product with product info
  products.map( async (item) => {
    if(item.quantity >= lowestQuantityAllowed && typesAllowed.includes(item.dept) && item.rsrPrice > lowestPriceAllowed && item.rsrPrice < highestPriceAllowed && item.upc.toString().length == 12){
      item.info = productInfo.find(info => info.stockNo == item.stockNo);
      if(categoriesAllowed.includes(item.info.subCategory)){
        filtered.push(item);
      }
    }
  });
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

      let cost = item.rsrPrice;
      let map = item.retailMAP; // Map will be number, 0 if there is no map

      price = cost * 1.15; // set price to cost of gun plus 15% then round to 2 decimals
      price = (Math.round(price * 100) / 100).toFixed(2);

      if(price < map){ // if new price is lower than map, set price to map
        price = map;
      }
      
      // Setting Category IDs and Shipping Prices
      let categoryID;
      let ShippingPrice = 30;

      switch(item.GunType) {
        case 'Modern Sporting Rifles':
          categoryID = 3024;
          break;
        case 'Sporting Shotguns':
          categoryID = 3103;
          break;
        case 'Pistols - Metal Frame':
          ShippingPrice = 29;
          categoryID = 3026;
          break;
        case 'Pistols - Polymer Frame':
          ShippingPrice = 29;
          categoryID = 3026;
          break;
        case 'Bullpups':
          categoryID = 3024;
          break;
        case 'Defensive Shotguns':
          categoryID = 3108;
          break;
        case 'Hunting Rifles':
          categoryID = 3022;
          break;
        case 'Other Handguns':
          categoryID = 3027;
          break;
        case 'Revolvers':
          ShippingPrice = 29;
          categoryID = 2325;
          break;
        case 'AK Style Rifles':
          categoryID = 3024;
          break;
        default:
          categoryID = 3004;
      }

      var title = item.mfgName + " " + item.model + " " + item.info.caliber + " " + item.info.capacity + " | " + item.upc;

      if(title.length > 75){
        title = item.manufacturerId + " " + item.model + " | " + item.upc;
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
          Manufacturer: item.mfgName,
          Model: item.model,
          Caliber: item.info.caliber,
        },
        Condition: 1, // Factory New
        CountryCode: "US",
        Description: descriptionGenerator(item),
        FixedPrice: price,
        InspectionPeriod: 1, // Sales are final
        isFFLRequired: true,
        ListingDuration: 90, // List for 90 days
        MfgPartNumber: item.mfgPartNo,
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
        SKU: 'RSR',
        StandardTextID: 4713,
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
      
      await axios.post('https://api.gunbroker.com/v1/Items', data, {
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
      console.log(chalk.bold.blue.bgWhite(" RSR Item "+ count + " / " + listings.length + " ") + chalk.bold.yellow(" ["+item.upc+"] Item already posted."));
    }else{
      await generateImages(item.imageURL)
      .then( async () => {
        await postOnGunBroker(item, count).catch((error) => console.log(error)).then(() => {
          countPosted++;
          console.log(chalk.bold.blue.bgWhite(" RSR Item "+ count + " / " + listings.length + " ") + chalk.bold.green(" [" + item.upc + "] Item (" + item.description + ") Posted"));
        }); 
      })
      .catch((error) => {
        console.log(chalk.bold.red("Image Download Error: "+error));
      });
    }
  }
  console.log(chalk.bold.green("RSR postings complete. "+countPosted+" listings posted."));
  return countPosted;
}

async function postRSRProducts(limit){
  let filteredInventory = await getInventory();
  let countPosted = await postAllListings(filteredInventory, limit);
  return countPosted;
}

export {postRSRProducts};