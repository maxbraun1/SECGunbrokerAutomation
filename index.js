import axios from 'axios';
import fs from 'fs';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as ftp from 'basic-ftp';
import csvToJson from 'convert-csv-to-json';
import { postLipseysProducts } from './listLipseys/index.js';
import { postDavidsonsProducts } from './listDavidsons/index.js';
import { postRSRProducts } from './listRSR/index.js';

dotenv.config();

function logProcess(message, type){
  console.log("_________________________________________________________________________________");
  switch(type){
    case 'good':
      console.log(chalk.green(message));
      break;
      case 'bad':
        console.log(chalk.red(message));
        break;
      case 'warning':
        console.log(chalk.yellow(message));
        break;
      default:
        console.log(chalk.magenta(message));
  }
}

let GunBrokerAccessToken = new Promise(function(resolve,reject){
  logProcess("Getting Gunbroker access token...");
  const gunbroker_credentials = { "Username": process.env.GUNBROKER_USERNAME, "Password": process.env.GUNBROKER_PASSWORD };
  axios.post('https://api.sandbox.gunbroker.com/v1/Users/AccessToken', gunbroker_credentials,{
  headers: {
    'Content-Type': 'application/json',
    'X-DevKey': process.env.GUNBROKER_DEVKEY
  },
  })
  .then(function (response) {
    resolve(response.data.accessToken);
  })
  .catch(function (error) {
    reject(new Error(error));
  });
});

let currentUserID = new Promise( async (resolve, reject) => {
  let token = await GunBrokerAccessToken;
  axios.get('https://api.sandbox.gunbroker.com/v1/Users/AccountInfo',{
    headers: {
      'Content-Type': 'application/json',
      'X-DevKey': process.env.GUNBROKER_DEVKEY,
      'X-AccessToken': token
    },
  })
  .then(function (response) {
    resolve(response.data.userSummary.userID);
  })
  .catch(function (error) {
    reject(new Error(error));
  });
});

function checkAlreadyPosted(upc){
  return new Promise( async (resolve, reject) => {
    let userID = await currentUserID;
    let token = await GunBrokerAccessToken;
    axios.get('https://api.sandbox.gunbroker.com/v1/Items?IncludeSellers='+userID+'&UPC='+upc,{
      headers: {
        'Content-Type': 'application/json',
        'X-DevKey': process.env.GUNBROKER_DEVKEY,
        'X-AccessToken': token
      },
    })
    .then(function (response) {
      if(response.data.countReturned > 0){
        // Product Already Posted
        resolve(true);
      }else{
        resolve(false);
      }
    })
    .catch(function (error) {
      console.log(error);
      reject(new Error(error));
    });
  });
}

function getAllListings(){
  return new Promise( async (resolve, reject) => {
    let userID = await currentUserID;
    let token = await GunBrokerAccessToken;
    await axios.get('https://api.sandbox.gunbroker.com/v1/Items?BuyNowOnly=true&PageSize=1&IncludeSellers='+userID,{
      headers: {
        'Content-Type': 'application/json',
        'X-DevKey': process.env.GUNBROKER_DEVKEY,
        'X-AccessToken': token
      },
    })
    .then(async (response) => {
      let listings = []
      let listingsNum = response.data.countReturned; // Total number of listinigs
      let iterations = Math.ceil(listingsNum/300); // Number of times to request results in sets of 300
      for(let i = 1; i <= iterations; i++){
        let token = await GunBrokerAccessToken;
        await axios.get('https://api.sandbox.gunbroker.com/v1/Items?BuyNowOnly=true&PageSize=300&PageIndex='+i+'&IncludeSellers='+userID,{
          headers: {
            'Content-Type': 'application/json',
            'X-DevKey': process.env.GUNBROKER_DEVKEY,
            'X-AccessToken': token
          },
        }).then((response) => {
          // get item IDs of all listings returned
          
          for(const listing in response.data.results){
            listings.push(response.data.results[listing].itemID);
          }
        }).catch(function (error) {
          console.log(error);
          reject(new Error(error));
        });
      }
      resolve(listings);
    })
    .catch(function (error) {
      console.log(error);
      reject(new Error(error));
    });
  });
}

let LipseyAuthToken = new Promise(function(resolve, reject){
  logProcess("Getting Lipseys API token...");
  const login_credentials = { "Email": process.env.LIPSEY_EMAIL, "Password": process.env.LIPSEY_PASSWORD };
  axios.post('https://api.lipseys.com/api/Integration/Authentication/Login', login_credentials,{
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(function (response) {
    resolve(response.data.token);
  })
  .catch(function (error) {
    reject(new Error(error));
  });
});

async function getLipseysInventory(upc){
  return new Promise( async (resolve,reject) => {
    let token = await LipseyAuthToken;
    logProcess("Retrieving Lipseys Inventory...");
    await axios.get('https://api.lipseys.com/api/Integration/Items/CatalogFeed',{
    headers: {
      Token: token
    },
    })
    .then((response) => {
      let products = [];

      let inventory = response.data.data;

      inventory.map((item) => {
        let product = {};
        product.upc = parseInt(item.upc);
        product.price = item.price;
        product.quantity = item.quantity;
        product.map = item.retailMap;

        products.push(product);
      });

      resolve(products);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

async function getDavidsonsInventoryFile(){
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
      await client.access({
        host: "ftp.davidsonsinventory.com",
        user: process.env.DAVIDSONS_FTP_USERNAME,
        password: process.env.DAVIDSONS_FTP_PASSWORD,
        secure: false
      });
      await client.downloadTo("davidsons_inventory.csv", "davidsons_inventory.csv");
  }
  catch(err) {
      console.log(err);
  }
  console.log(chalk.bold.green("File downloaded."));
  client.close();
}

async function getDavidsonsInventory(){

  await getDavidsonsInventoryFile();

  let DavidsonsInventory = csvToJson.fieldDelimiter(',').getJsonFromCsv('davidsons_inventory.csv');

  let products = [];

  DavidsonsInventory.map((item) => {
    let product = {};
    product.upc = parseInt(item.UPCCode.replace('#', ''));
    product.price = Number(item.DealerPrice.replace('$', ''));
    product.quantity = parseInt(item.Quantity);
    product.msrp = Number(item.RetailPrice.replace('$', ''));

    products.push(product);
  });

  return products;
}

async function getRSRInventoryFile(){
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
      await client.access({
          host: "rsrgroup.com",
          user: process.env.RSRUSERNAME,
          password: process.env.RSRPASSWORD,
          secure: false
      });
      await client.downloadTo("rsrinventory.txt", "ftpdownloads/rsrinventory-new.txt");

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
  }
  catch(err) {
      console.log(err);
  }
  console.log(chalk.bold.green("File downloaded and headers added."));
  client.close();
}

async function getRSRInventory(){

  await getRSRInventoryFile();

  let RSRInventory = csvToJson.getJsonFromCsv('rsrinventory.txt');

  let products = [];

  RSRInventory.map((item) => {
    let product = {};
    product.upc = parseInt(item.upc);
    product.price = Number(item.rsrPrice);
    product.quantity = parseInt(item.quantity);
    product.map = Number(item.retailMAP);

    products.push(product);
  });

  return products;
}

async function getListing(itemNo){
  return new Promise( async (resolve,reject)=>{
    let token = await GunBrokerAccessToken;
    await axios.get('https://api.sandbox.gunbroker.com/v1/Items/' + itemNo,{
      headers: {
        'Content-Type': 'application/json',
        'X-DevKey': process.env.GUNBROKER_DEVKEY,
        'X-AccessToken': token
      },
    }).then((response) => {
      resolve({upc: response.data.upc, price: response.data.buyPrice, quantity: response.data.quantity});
    }).catch((error) => {
      console.log(error);
      reject(error);
    })
  });
}

async function checkAllListings(){
  // Get every Gunbroker listing item No
  let listings = await getAllListings();

  // Get every listing from Lipseys, Davidsons, and RSR
  let LipseysInventory = await getLipseysInventory();
  let DavidsonsInventory = await getDavidsonsInventory();
  let RSRInventory = await getRSRInventory();

  // Loop through every gunbroker listing
  for(let i = 0; i <= listings.length; i++){
    let listing = await getListing(listings[i]);

    let lipseysResults = await LipseysInventory.find(item => item.upc == listing.upc);
    let RSRResults = await RSRInventory.find(item => item.upc == listing.upc);
    let davidsonsResults = await DavidsonsInventory.find(item => item.upc == listing.upc);
    if(lipseysResults == undefined){lipseysResults={};lipseysResults.quantity = 0}
    if(RSRResults == undefined){RSRResults={};RSRResults.quantity = 0}
    if(davidsonsResults == undefined){davidsonsResults={};davidsonsResults.quantity = 0}

    if(listing.quantity > lipseysResults.quantity && listing.quantity > RSRResults.quantity && listing.quantity > davidsonsResults.quantity){
      console.log(chalk.red.bold(listing.upc));
    }
    
    /*
    console.log(chalk.yellow.bold("Item: "+listing.upc));
    console.log("Listed on Gunbroker: Quantity - "+listing.quantity+" | Price - "+listing.price);
    console.log("For sale on Lipseys: Quantity - "+lipseysResults.quantity+" | Price - "+lipseysResults.price);
    console.log("For sale on RSR: Quantity - "+RSRResults.quantity+" | Price - "+RSRResults.price);
    console.log("For sale on Davidsons: Quantity - "+davidsonsResults.quantity+" | Price - "+davidsonsResults.price);
    console.log("-----------------------------------------------------------------------------------------");*/
  }
}

export {logProcess, currentUserID, GunBrokerAccessToken, checkAlreadyPosted, LipseyAuthToken};

// RUN PROCESS

async function postAll(){
  console.log(chalk.green.bold("Posting Lipseys products..."));
  //let lispeysPostCount = await postLipseysProducts();
  console.log(chalk.green.bold("Posting Davidsons products..."));
  //let davidsonsPostCount = await postDavidsonsProducts();
  console.log(chalk.green.bold("Posting RSR products..."));
  let RSRPostCount = await postRSRProducts();

  let totalPosted = lispeysPostCount + davidsonsPostCount + RSRPostCount;

  console.log(chalk.green.bold(totalPosted + "listings posted."));
}

postAll();