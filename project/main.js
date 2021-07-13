//#region global imports
const DButils = require("./routes/utils/DButils");
const axios = require("axios");
require("dotenv").config({path: 'project/.env'})
var express = require("express");
var path = require("path");
const session = require("client-sessions");
var logger = require("morgan");
var cors = require("cors");

var app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json
app.use(
  session({
    cookieName: "session", 
    secret: process.env.COOKIE_SECRET, 
    duration: 60 * 60 * 1000, 
    activeDuration: 0, 
    cookie: {
      httpOnly: false,
    },
  })
);

let api_domain = "https://soccer.sportmonks.com/api/v2.0";
process.env.api_domain = api_domain;

let LEAGUE_ID = 271;
process.env.LEAGUE_ID = LEAGUE_ID;

const delay = ms => new Promise(res => setTimeout(res, ms));

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files

// middleware to serve all the needed static files under the dist directory - loaded from the index.html file
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("dist"));

app.get("/api", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const corsConfig = {
  origin: true,
  credentials: true,
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

const port = process.env.PORT || "3000";

const auth = require("./routes/auth");
const manage_league = require("./routes/manage_league");
const users = require("./routes/users");
const league = require("./routes/league");
const teams = require("./routes/teams");
const players = require("./routes/players");
const coaches = require("./routes/coaches");
const search = require("./routes/search");
const { waitForDebugger } = require("inspector");



//#endregion

//#region cookie middleware
app.use(function (req, res, next) {
  if (req.session && req.session.userID) {
    DButils.execQuery("SELECT userID FROM dbo.Users")
      .then((users) => {
        if (users.find((x) => x.userID === req.session.userID)) {
          req.userID = req.session.userID;
        }
        next();
      })
      .catch((error) => next());
  } else {
    next();
  }
});
//#endregion

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", users);
app.use("/manage_league", manage_league);
app.use("/league", league);
app.use("/teams", teams);
app.use("/players", players);
app.use("/coaches", coaches);
app.use("/search", search);

app.use(auth);
app.use(manage_league);

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send(err.message);
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
});

module.exports = app;
