const mongoose = require('mongoose');
let Schema = mongoose.Schema;

// 用于加载 .env 文件中的环境变量到 Node.js 的 process.env 对象中
require('dotenv').config();

const inventorySchema = new Schema({
    barCode: { type: String, unique: true },
    productName: String,
    brand: String,
    weightInGram: {
        type: Number,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    price: { type: Number, min: 0, set: value => Math.round(value * 100) / 100 }, // 保留两位小数
    primaryShelfLocation: String,
    alternativeShelfLocation: String
});

let Inventory; // 将在新连接上定义

function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        db.on('error', (err) => {
            reject(err); // 拒绝并返回错误
        });
        db.once('open', () => {
            Inventory = db.model("inventories", inventorySchema); // inventories 是数据库中的集合名称
            resolve();
        });
    });
}

// inventoryMgmt.js:
function getProductByKeyWords(string) {

    
    return new Promise((resolve, reject) => {

        if (/^[a-zA-Z0-9 ]*$/.test(string) && string.trim().length < 3) return reject("Please double check your input 请检查您的输入"); 
        // 使用正则表达式进行不区分大小写的模糊匹配
        Inventory.find({ productName: { $regex: string, $options: 'i' } })
            .then(products => {
                if (products.length > 0) {
                    resolve(products); // 如果找到匹配的产品，返回它们
                } else {
                    resolve([]); // 没有匹配产品，返回空数组
                }
            })
            .catch(err => {
                reject(`Error finding products by keywords: ${err}`); // 捕获任何错误
            });
    });
}

function addProductToShelf(barCode, shelfLocation, isAlternative) {
    return new Promise((resolve, reject) => {
        // 查找产品通过 barCode
        Inventory.findOne({ barCode: barCode })
            .then(product => {
                if (!product) {
                    // 如果没有找到产品，报错
                    console.log("Not Found!")
                    return reject("Product not found");
                }

                if (!isAlternative) {
                    // 如果 isAlternative 为 false，设置 primaryShelfLocation
                    if (product.primaryShelfLocation) {
                        // 如果已经有 primaryShelfLocation，报错
                        return reject("This product already had a primary shelf location.");
                    } else {
                        // 否则，设置 primaryShelfLocation
                        product.primaryShelfLocation = shelfLocation;
                    }
                } else {
                    // 如果 isAlternative 为 true，设置 alternativeShelfLocation
                    if (product.alternativeShelfLocation) {
                        // 如果已经有 alternativeShelfLocation，报错
                        return reject("This product already had an alternative shelf location.");
                    } else {
                        // 否则，设置 alternativeShelfLocation
                        product.alternativeShelfLocation = shelfLocation;
                    }
                }
                return product.save();
            })
            .then(() => {
                // 更新成功，resolve
                resolve("Product shelf location updated successfully.");
            })
            .catch(err => {
                // 捕获任何错误
                reject(`Error updating product shelf location: ${err}`);
            });
    });
}


function getProductsByShelfLocationID(scode) {
    return new Promise((resolve, reject) => {
        
            // 查找 primaryShelfLocation 或 alternativeShelfLocation 等于 scode 的产品
            Inventory.find({
            $or: [
                { primaryShelfLocation: scode },
                { alternativeShelfLocation: scode }
            ]
        })
        .then(products => {
            if (products.length > 0) {
                resolve(products); // 如果找到匹配的产品，返回它们
            } else {
                resolve([]); // 没有匹配产品，返回空数组
            }
        })
        .catch(err => {
            reject(`Error finding products by shelf location: ${err}`); // 捕获任何错误
        });
    });
}

function removeProductFromShelf(barCode, shelfLocation) {
    console.log("barCode is ",barCode, "shelfLocation is ", shelfLocation)
    return new Promise((resolve, reject) => {
        // 查找产品通过 barCode
        Inventory.findOne({ barCode: barCode })
            .then(product => {
                if (!product) {
                    // 如果没有找到产品，报错
                    return reject("Product not found");
                }

                let updated = false;

                // 如果产品的 primaryShelfLocation 匹配
                if (product.primaryShelfLocation === shelfLocation) {
                    product.primaryShelfLocation = null; // 设置为 null
                    updated = true;
                }

                // 如果产品的 alternativeShelfLocation 匹配
                if (product.alternativeShelfLocation === shelfLocation) {
                    product.alternativeShelfLocation = null; // 设置为 null
                    updated = true;
                }

                if (!updated) {
                    // 如果没有更新任何位置，说明 shelfLocation 不匹配
                    return reject("Shelf location not found for this product.");
                }

                // 保存更新后的产品信息
                return product.save();
            })
            .then(() => {
                resolve("Product shelf location removed successfully.");
            })
            .catch(err => {
                reject(`Error removing product from shelf location: ${err}`);
            });
    });
}



function registerNewProduct(productData) {
    return new Promise((resolve, reject) => {
        let newProduct = new Inventory(productData); // 修正 userData -> productData
        newProduct.save()
            .then(() => resolve())
            .catch((err) => {
                if (err.code === 11000) {
                    console.log("xxxxxxxxxxxxxx");
                    reject("Product already existed");
                } else {
                    reject(`There was an error creating the inventory: ${err}`);
                }
            });
    });
}

module.exports = { initialize, registerNewProduct, getProductByKeyWords, getProductsByShelfLocationID, addProductToShelf, removeProductFromShelf}