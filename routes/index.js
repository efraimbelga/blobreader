var express = require("express");
var cookieParser = require("cookie-parser");
require("dotenv").config();
// console.log(process.env);

var router = express.Router();
router.use(cookieParser());

var fileSys = require("fs");

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

// const path = require("path");
const path = require("node:path");
const sqlite = require("sqlite3");

// const db = new sqlite.Database("./test.db", sqlite.OPEN_READWRITE, (err) => {
//   if (err) console.log(err);
// });

router.get("/createsas", (request, response) => {
  const url = "";
  const encoded = Buffer.from(url, "utf-8").toString("base64");
  console.log({ encoded });
});

router.get("/login", (request, response) => {
  const html = path.resolve(__dirname, "../views/loginform.html");
  response.sendFile(html);
  // response.render("login");
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
  const { url } = request.query;
  if (url) {
    const user = request.cookies.user;
    if (!user) {
      response.redirect(`/api/login?url=${url}`);
      return;
    }

    main(url)
      .then((newFileNameAndPath) => {
        const result = `Donwloaded successfully! Creating container...`;
        console.log({ result });
        return newFileNameAndPath;
      })
      .then((newFileNameAndPath) => {
        createContainer()
          .then((containerClient) => {
            const result = "Container created. Now uploading...";
            console.log({ result });

            uploadBlob(newFileNameAndPath, containerClient).then(() => {
              const result = `${path.basename(
                newFileNameAndPath
              )} was uploaded successfully!`;
              console.log({ result });
              const html = path.resolve(__dirname, "../views/success.html");
              response.sendFile(html);
              // response.render("index", {
              //   title: "Success!",
              //   message: result,
              // });
              return;
            });
          })
          .catch(
            (error) => {
              console.log({ error });
              const html = path.resolve(__dirname, "../views/error.html");
              response.sendFile(html);
            }
            // response.render("index", {
            //   title: error.name,
            //   message: error.message || error.details.errorCode,
            // })
          );
      })
      .catch((error) =>
        // response.render("index", {
        //   title: error.name,
        //   message: error.message || error.details.errorCode,
        // })
        {
          console.log({ error });
          const html = path.resolve(__dirname, "../views/error.html");
          response.sendFile(html);
        }
      );
  } else {
    // response.render("index", {
    //   title: "Invalid",
    //   message: "URI Invalid. Please check and try again.",
    // });
    const error = "URI Invalid. Please check and try again.";
    console.log({ error });
    const html = path.resolve(__dirname, "../views/error.html");
    response.sendFile(html);
  }
});

async function main(url) {
  try {
    const sasURL = Buffer.from(url, "base64").toString("utf-8");
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

    !fileSys.existsSync(downloadsPath) && fileSys.mkdirSync(downloadsPath);

    const newFileNameAndPath = path.join(downloadsPath, filename);
    await blobClient.downloadToFile(newFileNameAndPath);

    return newFileNameAndPath;
  } catch (error) {
    // console.log({ error });
    throw error;
  }
}

const createContainer = async () => {
  try {
    // console.log(newFileNameAndPath);
    const account = process.env.STORAGE_ACCOUNT;
    // console.log({ account });
    const accountKey = process.env.ACCOUNT_KEY;
    // console.log({ accountKey });
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
    await containerClient.createIfNotExists();
    return containerClient;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

async function uploadBlob(newFileNameAndPath, containerClient) {
  const blobName = path.basename(newFileNameAndPath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadFile(newFileNameAndPath.replaceAll("\\", "/"));
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
