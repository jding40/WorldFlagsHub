/*********************************************************************************
 *  WEB322 – Assignment 06 (based on A5 clean)
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: ___Jianzhong Ding___________________ Student ID: ____102212230__________ Date: ____April 9, 2024____________
 *
 *  Online (Cyclic) Link: https://cautious-bull-nightgown.cyclic.app/
 *
 ********************************************************************************/

const unCountryData = require("./modules/unCountries");

const authData = require("./modules/auth-service");
// const path = require("path");
const express = require("express");
const app = express();

//引入了一个名为 "client-sessions" 的 Node.js 模块。
//这个模块是用来在 Express.js 应用中管理客户端会话（sessions）的。
//会话是用来在客户端和服务器之间存储状态信息的一种机制，通常用于跟踪用户的登录状态、购物车内容等。
const clientSessions = require("client-sessions");

// const HTTP_PORT = process.env.PORT || 8080;
const HTTP_PORT = process.env.PORT;

//express.static('public') 是 Express 的一个内置中间件，用于处理静态文件。
app.use(express.static(__dirname + "/public"));
app.set("views", __dirname + "/views");

//The "locals" property allows you to attach local variables to the application, which persist throughout the life of the app.
// You can access local variables in templates rendered within the application
app.locals.title = "My App";

app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

//是将每个请求的 req.session 数据暴露到 res.locals 上，以便在视图模板中可以方便地访问会话信息。
app.use((req, res, next) => {
  res.locals.session = req.session;
  console.log("app.locals in server.js:", app.locals);
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const countries = await unCountryData.getAllCountries();
  const UNSCCountries = countries.filter((country) => country.permanentUNSC);

  res.render("home", { UNSCCountries });
});

app.get("/hello", (req, res) => {
  res.send(`Hello ${req.get("user-agent")}`);
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/un/addCountry", ensureLogin, async (req, res) => {
  let regions = await unCountryData.getAllRegions();
  res.render("addCountry", { regions: regions });
});

app.post("/un/addCountry", ensureLogin, async (req, res) => {
  try {
    await unCountryData.addCountry(req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/un/editCountry/:code", ensureLogin, async (req, res) => {
  try {
    let country = await unCountryData.getCountryByCode(req.params.code);
    let regions = await unCountryData.getAllRegions();

    res.render("editCountry", { country, regions });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.post("/un/editCountry", ensureLogin, async (req, res) => {
  try {
    await unCountryData.editCountry(req.body.a2code, req.body);
    res.redirect("/un/countries");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/un/deleteCountry/:code", ensureLogin, async (req, res) => {
  try {
    await unCountryData.deleteCountry(req.params.code);
    res.redirect("/un/countries");
  } catch (err) {
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.get("/un/countries", async (req, res) => {
  let countries = [];

  try {
    if (req.query.region) {
      countries = await unCountryData.getCountriesByRegion(req.query.region);
    } else {
      countries = await unCountryData.getAllCountries();
    }
    // console.log("countries[0] in server.js:", countries[0])
    res.render("countries", { countries });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/un/countries/:ccode", (req, res) => {
  unCountryData
    .getCountryByCode(req.params.ccode)
    .then((country) => {
      res.render("country", { country });
    })
    .catch((err) => {
      res.status(404).render("404", { message: err });
    });
});

// app.get("/un/countries/region-demo", async (req,res)=>{
//   try{
//     let countries = await unCountryData.getCountriesByRegion("Oceania");
//     res.send(countries);
//   }catch(err){
//     res.send(err);
//   }
// });

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "" });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      res.redirect("/un/countries");
    })
    .catch((err) =>
      res.render("login", { errorMessage: err, userName: req.body.userName })
    );
});

// app.post('/register', (req, res) => {

//   authData.registerUser(req.body).then(
//     ()=>render('register', {successMessage: "User created"}))
//     .catch((err)=> res.render('register', {errorMessage: err, userName: req.body.userName} ) )

// });
app.get("/register", (req, res) => {
  res.render("register", { errorMessage: "", successMessage: "" });
});

// app.post('/register', (req, res) => {

//   authData.registerUser(req.body).then(
//     ()=>render('register',))
//     .catch((err)=> console.log(err) )

// });

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() =>
      res.render("register", {
        successMessage: "Succesfully registered!",
        errorMessage: "",
      })
    )
    .catch((err) =>
      res.render("register", {
        successMessage: "",
        errorMessage: err,
        userName: req.body.userName,
      })
    );
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.use((req, res, next) => {
  app.locals.newPara = "test";
  next(); // 调用 next() 将控制权传递给下一个中间件或路由处理程序
});

app.get("/locals", (req, res) => {
  res.send(app.locals);
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});

//original version in A5 clean
// unCountryData.initialize().then(()=>{
//   app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
// });

//updated version for A6
unCountryData
  .initialize()
  .then(() => {
    return authData.initialize();
  })
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`unable to start server: ${err}`);
  });
