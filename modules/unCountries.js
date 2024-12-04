
// const countryData = require("../data/countryData"); // temp for bulk data loading
// const regionData = require("../data/regionData");

//用于加载.env文件中的环境变量到Node.js的process.env对象中。
require('dotenv').config();

const Sequelize = require('sequelize');

// country up sequelize to point to our postgres database
let sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  }
});

// Region model

const Region = sequelize.define(
  'Region',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true, // use "id" as a primary key
      autoIncrement: true, // automatically increment the value

    },
    name: Sequelize.STRING,
    subs: Sequelize.STRING
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Country model

const Country = sequelize.define(
  'Country',
  {
    a2code: {
      type: Sequelize.STRING,
      primaryKey: true, // use "a2code" as a primary key
    },
    name: Sequelize.STRING,
    "official": Sequelize.STRING,
    "nativeName": Sequelize.STRING,
    "permanentUNSC": Sequelize.BOOLEAN,
    "wikipediaURL": Sequelize.STRING,
    "capital": Sequelize.STRING,
    "regionId": Sequelize.INTEGER,
    "languages": Sequelize.STRING,
    "population": Sequelize.INTEGER,
    "flag": Sequelize.STRING
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

Country.belongsTo(Region, {foreignKey: 'regionId'})

// Note, extra wrapper promises added for simplicity and greater control over error messages

function initialize() { 
  return new Promise(async (resolve, reject) => {
    try{
      await sequelize.sync();
      resolve();
    }catch(err){
      reject(err.message)
    }
  });
}

function getAllCountries() {

  return new Promise(async (resolve,reject)=>{
    let countries = await Country.findAll({include: [Region]});
    // console.log("countries[0]:", countries[0])
    resolve(countries.map(c => c.dataValues));
  });

}

// function getAllCountries() { 
//   return new Promise((resolve, reject) => {
//     Country.findAll({include: [Region]} )
//     .then((data) => {
//       console.log(data);
//       resolve(data);
//     })
//     .catch((err) => {
//       console.log(err);
//       reject(err);
//     });
//   }
// )}

function getAllRegions() {

  return new Promise(async (resolve,reject)=>{
    let regions = await Region.findAll();
    resolve(regions.map(r => r.dataValues));
  });
   
}

function getCountryByCode(countryCode) {

  return new Promise(async (resolve, reject) => {
    let foundCountry = await Country.findAll({include: [Region], where: { a2code: {[Sequelize.Op.iLike]: countryCode}}});
 
    if (foundCountry.length > 0) {
      resolve(foundCountry[0].dataValues);
    } else {
      reject("Unable to find requested country");
    }

  });

}

function getCountriesByRegion(region) {

  return new Promise(async (resolve, reject) => {
    let foundCountries = await Country.findAll({include: [Region], where: { 
      '$Region.name$': {
        [Sequelize.Op.iLike]: `%${region}%`
      }
    }});
 
    if (foundCountries.length > 0) {
      resolve(foundCountries.map(r => r.dataValues));
    } else {
      reject("Unable to find requested countries");
    }

  });

}

function addCountry(countryData){
  return new Promise(async (resolve,reject)=>{
    try{
      countryData.permanentUNSC = countryData.permanentUNSC ? true : false;
      await Country.create(countryData);
      resolve();
    }catch(err){
      reject(err.message); // reject(err.errors[0].message);
    }
  });
}

function editCountry(countryCode, countryData){
  return new Promise(async (resolve,reject)=>{
    try {
      countryData.permanentUNSC = countryData.permanentUNSC ? true : false;
      await Country.update(countryData,{where: {a2code: countryCode}})
      resolve();
    }catch(err){
      reject(err.message); // reject(err.errors[0].message);
    }
  });
}

function deleteCountry(countryCode){
  return new Promise(async (resolve,reject)=>{
    try{
      await Country.destroy({
        where: { a2code: countryCode }
      });
      resolve();
    }catch(err){
      reject(err.message); // reject(err.errors[0].message);
    }
   
  });
  
}

module.exports = { initialize, getAllCountries, getCountryByCode, getCountriesByRegion, getAllRegions, addCountry, editCountry, deleteCountry }
// Code Snippet to insert existing data from Country / Regions



// // temp for bulk data loading
// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await Region.bulkCreate(regionData);
//       await Country.bulkCreate(countryData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Countries" violates foreign key constraint "Countries_region_id_fkey"

//       // it is because you have a "country" in your collection that has a "regionId" that does not exist in the "regionData".   

//       // To fix this, use PgAdmin to delete the newly created "Regions" and "Countries" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });


