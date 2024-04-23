var express = require("express");
var cookieParser = require("cookie-parser");

var router = express.Router();
router.use(express.urlencoded({ extended: true }));

router.use(cookieParser());
const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

const CONTAINER = "mobile";

router.get("/login/", (request, response) => {
  response.render("login");
});

router.get("/logout/", (request, response) => {
  response.clearCookie("user");
  response.end();
});

router.post("/login", function (req, res) {
  const user = {
    account: req.body.account,
    key: req.body.key,
  };
  res.cookie("user", user, { maxAge: 180000 });
  const referer = req.headers.referer;
  const params = referer.split("?")[1];
  res.redirect("/api/blob/?" + params);
});

router.get("/blob/", function (request, response) {
  console.log(request.query);
  const { url, token } = request.query;

  if (url && token) {
    sasURL = url;
    sasToken = token;

    const user = request.cookies.user;
    if (!user) {
      response.redirect(
        `/api/login/?url=${encodeURIComponent(
          sasURL
        )}&token=${encodeURIComponent(sasToken)}`
      );
      return;
    }

    main(sasURL, sasToken, user.account)
      .then((data) => response.send(data))
      .catch((error) =>
        //  response.send(error)
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

async function main(sasURL, sasToken, account) {
  try {
    const ACCOUNT = "genaistorageaccount02";
    const filename = new URL(sasURL).pathname.split("/").pop();
    const blobServiceClient = new BlobServiceClient(
      `https://${ACCOUNT}.blob.core.windows.net?${sasToken}`
    );

    const containerClient = blobServiceClient.getContainerClient(CONTAINER);
    const blobClient = containerClient.getBlobClient(filename);
    const newFileNameAndPath = path.join(__dirname, filename);
    await blobClient.downloadToFile(newFileNameAndPath);
    return `<h1>${filename} downloaded successfully!</h1><p>Please check <b>${newFileNameAndPath}</b></p>`;
  } catch (error) {
    throw error;
  }
}

module.exports = router;
