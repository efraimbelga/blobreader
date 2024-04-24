var express = require("express");
var cookieParser = require("cookie-parser");

var router = express.Router();
router.use(cookieParser());

var fileSys = require("fs");
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

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
      .then((data) => response.send(data))
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
    // console.log(blobClient.getProperties());
    // return (await blobClient.getProperties()).contentType;

    const ext = path.extname(filename);
    if (!ext) {
      throw new Error("Unknown file type");
    }

    const dirname = __dirname.split("\\");
    var downloadsPath =
      dirname.slice(0, dirname.length - 1).join("\\") + "\\downloads";

    !fileSys.existsSync(downloadsPath) && fs.mkdirSync(downloadsPath);

    const newFileNameAndPath = path.join(downloadsPath, filename);
    await blobClient.downloadToFile(newFileNameAndPath);
    return `<h1>${filename} downloaded successfully!</h1><p>Please check <b>${newFileNameAndPath}</b></p>`;
  } catch (error) {
    throw error;
  }
}

module.exports = router;
