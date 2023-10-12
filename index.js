const express = require("express");
const bodyParser = require("body-parser");
global.request = require("request");
global.jwkToPem = require("jwk-to-pem");
global.jwt = require("jsonwebtoken");
global.navigator = () => null;
global.config = require("./config");
require("./db/mongoose");
require("./db/awsconnect");
require("dotenv").config();

let host = process.env.HOST;
let port = process.env.PORT;
const fs = require("fs");
// Create express instance
const app = express();
app.use(express.json());
var cors = require("cors");
// Require API routes

const name = require("./routes/name.routes");
const surname = require("./routes/surname.routes");
const dataSearchFilter = require("./routes/dataSearchFilter.routes");
const entityLog=require("./routes/entityLog.routes")


// Import API Routes
app.use(bodyParser());
app.use(function (req, res, next) {
  if (req.headers["x-amz-sns-message-type"]) {
    req.headers["content-type"] = "application/json;charset=UTF-8";
  }
  next();
});
app.use(
  bodyParser.urlencoded({
    limit: "200mb",
    extended: true,
  })
);
app.use(bodyParser.json({ limit: "200mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(name);
app.use(surname);
app.use(dataSearchFilter);
app.use(entityLog)


app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

//Start Server
app.listen(port, () => {
  console.log(`Server is listening ${host}:${port}`);
});

