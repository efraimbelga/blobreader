var express = require("express");
var cookieParser = require("cookie-parser");

var router = express.Router();
router.use(cookieParser());

var fileSys = require("fs");

const { DefaultAzureCredential } = require("@azure/identity");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

// const path = require("path");
const path = require("node:path");
const sqlite = require("sqlite3");

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
  // const { url, token } = request.query;
  // if (url && token) {
  const { url } = request.query;
  if (url) {
    const user = request.cookies.user;
    if (!user) {
      // response.redirect(`/api/login?url=${url}&token=${token}`);
      response.redirect(`/api/login?url=${url}`);
      return;
    }

    main(url)
      .then((data) => {
        // getData(); //display db data
        const filename = path.basename(data);
        const result = `<h1>${filename} downloaded successfully!</h1><p>Please check <b>${data}</b></p>`;

        uploadAudio(data);
        response.send(result);

        // insertData(filename, contentType); //Insert to db
        return;
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

async function main(url) {
  try {
    const sasURL = Buffer.from(url, "base64").toString("utf-8");
    // const sasToken = Buffer.from(token, "base64").toString("utf-8");

    const uri = new URL(sasURL);
    const sasToken = new URLSearchParams(uri.search);

    const host = uri.host;

    const protocol = uri.protocol;
    const pathname = uri.pathname;
    const filename = path.basename(pathname);
    const [container] = path
      .dirname(pathname.replace(/^\/|\/$/g, ""))
      .split("/");
    const blobServiceClient = new BlobServiceClient(
      `${protocol}//${host}?${sasToken}`
    );
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(filename);

    const ext = path.extname(filename);
    if (!ext) {
      throw new Error("Unknown file type");
    }

    const downloadsPath = path.resolve(__dirname, "../downloads");
    // console.log({ downloadsPath });
    !fileSys.existsSync(downloadsPath) && fileSys.mkdirSync(downloadsPath);

    const newFileNameAndPath = path.join(downloadsPath, filename);
    await blobClient.downloadToFile(newFileNameAndPath);

    return newFileNameAndPath;
  } catch (error) {
    throw error;
  }
}

const uploadAudio = async (newFileNameAndPath) => {
  try {
    // console.log(newFileNameAndPath);
    const account = "genaistorageaccount02"; //request.cookies.user.account
    const accountKey =
      "GicYbkLLELQ4H69hWr9C87l7gWzGvez0sK9ulsjekZTz1Wmn1Y8w3pxgebVFLrFYAy9NGQsTu3Bd+AStvNGRqQ==";
    const containerName = "web";
    const sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accountKey
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const createContainerResponse = await containerClient.createIfNotExists();

    const blobName = path.basename(newFileNameAndPath);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadBlobResponse = await blockBlobClient.uploadFile(
      newFileNameAndPath.replaceAll("\\", "/")
    );
  } catch (error) {
    console.log(error);
  }
};

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
