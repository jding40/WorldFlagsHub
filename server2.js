const unCountryData = require("./modules/unCountries");

const authData = require("./modules/auth-service");
// const path = require("path");
const express = require("express");
const app = express();

const session = require("express-session");

// const HTTP_PORT = process.env.PORT || 8080;
const HTTP_PORT = process.env.PORT;

//express.static('public') 是 Express 的一个内置中间件，用于处理静态文件。
app.use(express.static(__dirname + "/public"));
app.set("views", __dirname + "/views");

//The "locals" property allows you to attach local variables to the application, which persist throughout the life of the app.
// You can access local variables in templates rendered within the application
app.locals.title = "My App";

app.use(express.urlencoded({ extended: true }));

// 使用 express-session 进行会话管理
app.use(
  session({
    name: "sessionID",
    secret: "week10example_web322",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 1000 }, // 2 分钟过期
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;

  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const countries = await unCountryData.getAllCountries();
  res.render("home", {
    UNSCCountries: countries.filter((c) => c.permanentUNSC),
  });
});

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

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/un/countries", async (req, res) => {
  try {
    const countries = req.query.region
      ? await unCountryData.getCountriesByRegion(req.query.region)
      : await unCountryData.getAllCountries();
    res.render("countries", { countries });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

unCountryData
  .initialize()
  .then(() => authData.initialize())
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log(`Server running on port ${HTTP_PORT}`)
    );
  })
  .catch((err) => console.log(`Unable to start server: ${err}`));
