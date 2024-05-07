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
const jose = require("jose");

const fnJweDecrypt = async (jwe) => {
  try {
    const secretKey = process.env.USER_SECRET;
    // Import the secret key as JWK
    const jwk = await jose.importJWK({
      kty: "oct",
      k: secretKey,
      // alg: "A128KW",
    });

    const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, jwk);

    // Convert the Uint8Array plaintext to a string
    const decryptedPayload = new TextDecoder().decode(plaintext);
    // console.log("Protected Header:", protectedHeader);
    // console.log("Decrypted Payload:", decryptedPayload);

    return decryptedPayload;
  } catch (error) {
    throw error;
    // console.log({ error });
  }
};

const verifyAndDecodeJwt = async (jwt) => {
  try {
    const secretKey = process.env.USER_SECRET;
    // Import the secret key as JWK
    const jwk = await jose.importJWK({
      kty: "oct",
      k: secretKey,
      // alg: "HS256",
    });

    const { payload, protectedHeader } = await jose.jwtVerify(jwt, jwk);
    // console.log("Protected Header:", protectedHeader);
    // console.log("Decoded Payload:", payload);
    return payload.sasURL;
  } catch (error) {
    throw error;
  }
};

router.get("/createsas", (request, response) => {
  const url = "";
  const encoded = Buffer.from(url, "utf-8").toString("base64");
  console.log({ encoded });
});

router.get("/login", (request, response) => {
  const { error } = request.query;
  response.render("login", { error });
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
  // params.delete("error");
  // console.log({ params });
  // return;

  // // if (error) {
  // res.redirect(`/api/login?error=Username or password invalid&${params}`);
  // //   return;
  // // }
  res.redirect(`/api/blob?${params}`);
});

router.get("/blob", function (request, response) {
  const { id } = request.query;
  if (id) {
    const user = request.cookies.user;
    if (!user) {
      response.redirect(`/api/login?id=${id}`);
      return;
    }
    const jwe = id;
    fnJweDecrypt(jwe)
      .then((jwt) => {
        verifyAndDecodeJwt(jwt)
          .then((sasURL) => {
            main(sasURL)
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

                    uploadBlob(newFileNameAndPath, containerClient).then(
                      (newFileNameAndPath) => {
                        const result = `${path.basename(
                          newFileNameAndPath
                        )} was uploaded successfully!`;
                        console.log({ result });

                        deleteFile(newFileNameAndPath);

                        response.render("index", {
                          title: "Success!",
                          message: result,
                        });
                        return;
                      }
                    );
                  })
                  .catch((error) =>
                    response.render("index", {
                      title: error.name,
                      message: error.message || error.details.errorCode,
                    })
                  );
              })
              .catch((error) =>
                response.render("index", {
                  title: error.name,
                  message: error.message || error.details.errorCode,
                })
              );
          })
          .catch((error) => {
            console.log({ error });
          });
      })
      .catch((error) => {
        console.log({ error });
        response.render("index", {
          title: error.name,
          message: error.message || error.details.errorCode,
        });
      });
  } else {
    response.render("index", {
      title: "Invalid",
      message: "URI Invalid. Please check and try again.",
    });
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
    // console.log({ error });
    throw error;
  }
};

async function uploadBlob(newFileNameAndPath, containerClient) {
  try {
    const blobName = path.basename(newFileNameAndPath);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const result = await blockBlobClient.uploadFile(
      newFileNameAndPath.replaceAll("\\", "/")
    );
    if (result) return newFileNameAndPath;
    else return false;
  } catch (error) {
    throw error;
  }
}

const deleteFile = (filePath) => {
  try {
    const result = fileSys.unlinkSync(filePath);
    console.log("File deleted successfully.");
  } catch (err) {
    console.error("Error deleting file:", err);
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

// const jwe =
//   "eyJlbmMiOiJBMTI4R0NNIiwiYWxnIjoiQTEyOEtXIn0.lXpcmOTNNkrL6k211JmDYpb99FxGO0WX.58Uv7e7TDbGXqnyY.ClLFNh6PG0-c6SHflut_XfvBRqc_dzkum3xYDPjNZi0kxOWrE51a_pkfWurPr8ztUki1FD-YJfy6NTtleyt8-FSmKbW5toRF0CIZ1KFCZ2o0ruhglOL0l1BDz-7y_EeE1AR28cawSn5TuXOasgmW6RhqEhTO5eBTAEbfSlJuuTQxqbsaUAXF95pKm79htErjS2QtfayToqNqp0NmdN0yI3tK4UThn3NnifA25eKXzulhR1Hv36rf1wkAfXN2HaDPzF4kXgLRb4ClpPW0GMzSI94udZD8DiBTmVF1VycHVyhxJrlTxBC9syQpHfkkyVRcl77akJbgBpKXiS8Knb513VI1qiqlxjTdLCz_6ECFyN4NLqGfUubO5VWiFe16Cutf99IetgWOnt0ygzcntJZav3DvvgN-i6Iyi8h3zAIcUPHJ4KRdwR6Tu6-CORuXkgpRz0b29X3KiXwyBXlxxc_pay6kWyIxNYz1hTUZp7qrDjGsBBJS5WuR5A2ARGWVa0tdmJRBpKPhxrqDtQN9ZM04MqdjJxyJLz3Oy8pp13MKA0Z4YxCvInbrpl0gAz9RtbpqR8n_0ZqbOdYXE6Y7GwCy-8HG1LHh_8L8MXT9JAfGrJIm8H_fOQ.P3KfPZPFDsnVOQp3A8CrJA";
// fnJweDecrypt(jwe)
//   .then((jwt) => {
//     verifyAndDecodeJwt(jwt)
//       .then((sasURL) => {
//         console.log({ sasURL });
//       })
//       .catch((error) => {
//         console.log({ error });
//       });
//   })
//   .catch((error) => {
//     console.log({ error });
//   });

module.exports = router;
