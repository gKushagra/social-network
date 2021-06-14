require("dotenv").config();

const cors = require("cors");
const bodyParser = require("body-parser");

const express = require("express");
const router = require("./routes");
const app = express();

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use(router);

app.listen(4050, () => {
  // console.log("http server listening on 4050");
});
