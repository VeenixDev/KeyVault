const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

function readKeyFile() {
  return JSON.parse(fs.readFileSync("./keys.json").toString());
}
function readWebsite() {
  return fs.readFileSync("./assets/index.html").toString("utf-8")
}

const website = readWebsite();
let keys = readKeyFile();

app.get('/', (req, res) => {
  if(req.query.dev === "true") {
    res.status(200).send(readWebsite());
    return;
  }
  res.status(200).send(website);
})

app.get("/keys", (req, res) => {
  const itemsPerPage = Number(Math.max(0, req.query.perPage))||10;
  const page = Number(Math.max(0, req.query.page))||1;
  const search = req.query.search?.toUpperCase()||"";

  const pages = Math.ceil(Object.keys(keys).length / itemsPerPage);

  const data = {};

  const entries = Object.entries(keys).filter((val) => {
    return val[0].toUpperCase().indexOf(search) > -1;
  });
  const slice = entries.slice(itemsPerPage * (page - 1), itemsPerPage * (page - 1) + itemsPerPage);
  for(let entry of slice) {
    data[entry[0]] = entry[1];
  }
  res.contentType("application/json").status(200).send({data, itemsPerPage, pages});
})

app.post("/key", (req, res) => {
  const game = req.body;
  const title = game.title.toLowerCase();

  if(game.title === undefined) {
    res.sendStatus(404);
    return; 
  }
  if(keys[title] !== undefined) {
    const existingKeys = keys[title].keys;
    if(!game.deleteKeys) {
      for(let element of game.keys) {
        if(existingKeys.includes(element)) {
          console.log("Key already exists");
          res.sendStatus(200);
          return;
        }
      }
    }
    if(game.deleteKeys) {
      if(game.keys.length === 0) {
        delete keys[title];
        res.sendStatus(200);
        return;
      }
      keys[title].keys = game.keys;
    } else {
      keys[title].keys = [...keys[title].keys, ...game.keys];
    }
    res.sendStatus(200);
    return;
  }

  keys[title] = {
    "title": game.title,
    "keys" :game.keys
  };
  res.sendStatus(200);
})

app.get("/store", (req, res) => {
  fs.writeFileSync("./keys.json", JSON.stringify(keys));
  res.sendStatus(200);
})

app.get("/restore", (req, res) => {
  keys = JSON.parse(fs.readFileSync("./keys.json").toString());
  res.sendStatus(200);
})

app.listen(3000, () => {
  console.log("Now listening on port 3000");
}).on("close", () => {
  console.log("Shutting down!");
})