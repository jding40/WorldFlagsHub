//step B0
const bcrypt = require('bcryptjs'); //stands for "Blowfish Crypt"

//step A2.4
const mongoose = require('mongoose');
//step A2.4
let Schema = mongoose.Schema;

//step A2.5
//用于加载.env文件中的环境变量到Node.js的process.env对象中。
require('dotenv').config();

//step A2.6
const userSchema = new Schema({
    userID: {type: String, unique: true},
    //userName: String,
    password: String,
    userType: String,
    email: String,
    tel: String,
    firstName: String,
    lastName: String,
    loginHistory:[{
        dateTime: Date,
        userAgent: String
    }]
});



//step A2.7
let User; // to be defined on new connection (see initialize)

//step A2.8

//version 1
// function initialize(){
//     return new Promise((resolve, reject)=>{
//         mongoose.connect("mongodb://127.0.0.1:27017/test2").then(()=> resolve())  //待替换成process.env.MONGODB
//         .catch((err)=> reject(err));
//     })
// }


//version 2
function initialize(){
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("Users", userSchema); //Users is the name of the collection in the database
           resolve();
        });
    });

}




//step A2.9



// function registerUser(userData){


//     return new Promise((resolve, reject)=>{

//         bcrypt.hash(userData.password, 10).then((hash)=> {


//         if (hash !== userData.password2) reject("Passwords do not match");
//         else{
//             let newUser = new User(userData);
//             newUser.save().then(()=> resolve()).catch((err)=>{
//                 if(err.code ==  11000) reject("User Name already taken")
//                 else reject(`There was an error creating the user: ${err}`)
//             })
//         }
//     })
//     })
// }


function registerUser(userData){

    
    return new Promise((resolve, reject)=>{

        if (userData.password !== userData.password2) reject("Passwords do not match");
        else{
            
            bcrypt.hash(userData.password, 10).then((hash)=> {
        

                userData.password=hash;
                let newUser = new User(userData);
                newUser.save().then(()=> resolve()).catch((err)=>{
                    if(err.code===11000) {console.log("xxxxxxxxxxxxxx"); reject("User Name already taken")}
                    else {reject(`There was an error creating the user: ${err}`)}
                }).catch((err)=> {return Promise.reject("There was an error creating encrypting the password")})
            //})
        })

        }
    })
}






// function registerUser(userData){

    
//     return new Promise((resolve, reject)=>{

//         if (userData.password !== userData.password2) reject("Passwords do not match");
//         else{
//             bcrypt.hash(userData.password, 10).then((hash)=> {

//                 userData.password=hash;
//                 let newUser = new User(userData);
//                return newUser.save()}).then(()=> resolve()).catch((err)=>{
//                     if(err.code===11000) reject("User Name already taken")
//                     else reject(`There was an error creating the user: ${err}`)
//                 }).catch((err)=> reject("There was an error creating encrypting the password"))
//             //})

//         }
//     })
// }






//function for part A
// function registerUser(userData){

    
//     return new Promise((resolve, reject)=>{

//         if (userData.password !== userData.password2) reject("Passwords do not match");
//         else{
//             let newUser = new User(userData);
//             newUser.save().then(()=> resolve()).catch((err)=>{
//                 if(err.code ===  11000) reject("User Name already taken")
//                 else reject(`There was an error creating the user: ${err}`)
//             })
//         }
//     })
// }

//step A2.10
//version 1
// function checkUser(userData){
//     User.findOne({userName: userData.userName, password:userData.password}).then((data)=> resolve(data))

// }

//version 2


//function for Part B
function checkUser(userData){
    return new Promise((resolve, reject)=> {
    User.find({userName: userData.userName}).then((users)=> {
        if (users.length==0)  reject(`Unable to find user: ${userData.userName}`);

        bcrypt.compare(userData.password, users[0].password).then((result)=>{
            if(!result)  reject(`Incorrect Password for user: ${userData.userName}`);
            else { 
                if(users[0].loginHistory.length >= 8) users[0].loginHistory.pop();
                users[0].loginHistory.unshift({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                
                User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                        .then(() => {
                            resolve(users[0]);
                        })
                        .catch(err => {
                            reject(`There was an error verifying the user: ${err}`);
                        });           
            }


        }).catch((err)=> reject(`Unable to find user: ${userData.userName}`))
})


})
}



// function checkUser(userData){
//     return new Promise((resolve, reject)=> {
//     User.find({userName: userData.userName}).then((users)=> {
//         if (users.length==0)  reject(`Unable to find user: ${userData.userName}`);

//         let test;
//         bcrypt.compare(userData.password, users[0].password).then((result)=>{test = result})
//         if (!test) reject(`Incorrect Password for user: ${userData.userName}`);
//         else{ 
//             if(users[0].loginHistory.length >= 8) users[0].loginHistory.pop();
//             users[0].loginHistory.unshift({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
            
//             User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
//                     .then(() => {
//                         resolve(users[0]);
//                     })
//                     .catch(err => {
//                         reject(`There was an error verifying the user: ${err}`);
//                     });           
//         }
//     }).catch((err)=> reject(`Unable to find user: ${userData.userName}`))
// })

// }




module.exports = { initialize, registerUser, checkUser }


