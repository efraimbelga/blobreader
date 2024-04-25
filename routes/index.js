var express = require("express");
var cookieParser = require("cookie-parser");

var router = express.Router();
router.use(cookieParser());

var fileSys = require("fs");
const wave = require("wave");
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

const sqlite = require("sqlite3");
const axios = require("axios");

const db = new sqlite.Database("./test.db", sqlite.OPEN_READWRITE, (err) => {
  if (err) console.log(err);
});

router.get("/login", (request, response) => {
  response.render("login");
});

router.get("/logout", (request, response) => {
  response.clearCookie("user");
  response.end();
});

router.post("/login", function (req, res) {
  const user = {
    account: req.body.account,
    key: req.body.key,
  };
  res.cookie("user", user, { maxAge: 180000 });
  const referer = new URL(req.headers.referer);
  const params = new URLSearchParams(referer.search);
  res.redirect(`/api/blob?${params}`);
});

router.get("/blob", function (request, response) {
  const { url, token } = request.query;
  if (url && token) {
    const user = request.cookies.user;
    if (!user) {
      response.redirect(`/api/login?url=${url}&token=${token}`);
      return;
    }

    main(url, token)
      .then((data) => {
        getData();
        response.send(data);
      })
      .catch((error) =>
        response.render("error", {
          title: error.name,
          message: error.message || error.details.errorCode,
        })
      );
  } else {
    response.render("error", {
      title: "Invalid",
      message: "URI Invalid. Please check and try again.",
    });
  }
});

async function main(url, token) {
  try {
    const sasURL = Buffer.from(url, "base64").toString("utf-8");
    const sasToken = Buffer.from(token, "base64").toString("utf-8");

    const uri = new URL(sasURL);
    const host = uri.host;
    const protocol = uri.protocol;
    const pathname = uri.pathname;
    const filename = pathname.split("/").pop();
    const container = pathname
      .slice(0, pathname.lastIndexOf("/"))
      .replace("/", "");
    const blobServiceClient = new BlobServiceClient(
      `${protocol}//${host}?${sasToken}`
    );
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);
    const contentType = (await blobClient.getProperties()).contentType;
    const ext = path.extname(filename);
    if (!ext) {
      if (contentType === "audio/x-wav" || contentType === "audio/wav") {
        filename = filename + ".wav";
      } else {
        throw new Error("Unknown file type");
      }
    }

    const dirname = __dirname.split("\\");
    const downloadsPath =
      dirname.slice(0, dirname.length - 1).join("\\") + "\\downloads";

    !fileSys.existsSync(downloadsPath) && fs.mkdirSync(downloadsPath);

    const newFileNameAndPath = path.join(downloadsPath, filename);
    await blobClient.downloadToFile(newFileNameAndPath);

    insertData(filename, contentType);

    return `<h1>${filename} downloaded successfully!</h1><p>Please check <b>${newFileNameAndPath}</b></p>`;
  } catch (error) {
    throw error;
  }
}

// creatTable();

const creatTable = () => {
  const sql =
    "CREATE TABLE IF NOT EXISTS audio(ID INTEGER PRIMARY KEY, filename, filetype)";
  db.run(sql);
};
const insertData = (filename, contentType) => {
  try {
    const sql = "INSERT INTO audio(filename, filetype) VALUES(?,?)";
    db.run(sql, [filename, contentType], (error) => {
      error ? console.log(error) : console.log("Insert success");
    });
  } catch (e) {
    console.log(e);
  }
};

const getData = () => {
  try {
    const sql = "SELECT * FROM audio";
    db.all(sql, [], (err, rows) => {
      if (err) throw new Error(err);
      rows.forEach((row) => {
        console.log("Audio data: ", row);
      });
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = router;
