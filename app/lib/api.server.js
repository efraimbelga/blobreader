import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { compactDecrypt, importJWK, jwtVerify } from "jose";

const env = process.env;
import fs from "fs";
import path from "path";

export const fnJweDecrypt = async (jwe) => {
  console.log("Decrypting JWE...");
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey,
  });
  const { plaintext } = await compactDecrypt(jwe, jwk);
  const jwt = new TextDecoder().decode(plaintext);
  console.log("JWE decrypted.");
  return jwt;
};

export const fnJwtVerify = async (jwt) => {
  console.log("Verifying JWT...");
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey,
  });

  const { payload } = await jwtVerify(jwt, jwk);
  console.log("JWT veryfied.");
  return payload.sasURL;
};

export const createContainer = async () => {
  console.log("Creating container...");
  const account = env.STORAGE_ACCOUNT;
  const accountKey = env.ACCOUNT_KEY;
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
  console.log("Client container created.");
  return containerClient;
};

export const donwloadToTemp = async (encSAS) => {
  console.log("Downloading file using encrypted SAS...");
  const sasURL = Buffer.from(encSAS, "base64").toString("utf-8");
  const uri = new URL(sasURL);
  const sasToken = new URLSearchParams(uri.search);

  const host = uri.host;

  const protocol = uri.protocol;
  const pathname = uri.pathname;
  const filename = path.basename(pathname);
  const [container] = path.dirname(pathname.replace(/^\/|\/$/g, "")).split("/");
  const blobServiceClient = new BlobServiceClient(
    `${protocol}//${host}?${sasToken}`
  );
  const containerClient = blobServiceClient.getContainerClient(container);
  const blobClient = containerClient.getBlobClient(filename);

  const downloadsPath = "/downloads";

  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath);
  }
  const tempPath = path.join(downloadsPath, filename);
  await blobClient.downloadToFile(tempPath);
  console.log(tempPath + " created");
  return tempPath;
};

export const uploadBlob = async (tempPath) => {
  console.log("Uploading to container...");
  const containerClient = await createContainer();
  const blobName = path.basename(tempPath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(tempPath.replaceAll("\\", "/"));
  fs.unlinkSync(tempPath);
  console.log("File saved to container.");
  return blobName;
};
