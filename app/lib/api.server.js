import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { compactDecrypt, importJWK, jwtVerify } from "jose";

const env = process.env;
import fs from "fs";
import path from "path";

export const fnJweDecrypt = async (jwe) => {
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey,
  });
  const { plaintext } = await compactDecrypt(jwe, jwk);
  const jwt = new TextDecoder().decode(plaintext);
  return jwt;
};

export const fnJwtVerify = async (jwt) => {
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey,
  });

  const { payload } = await jwtVerify(jwt, jwk);
  return payload.sasURL;
};

export const createContainer = async () => {
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
  return containerClient;
};

export const donwloadToTemp = async (encSAS) => {
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
  console.log({ tempPath });
  await blobClient.downloadToFile(tempPath);

  return tempPath;
};

export const uploadBlob = async (tempPath) => {
  const containerClient = await createContainer();
  const blobName = path.basename(tempPath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(tempPath.replaceAll("\\", "/"));
  fs.unlinkSync(tempPath);
  return blobName;
};
