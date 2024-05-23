import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, createCookieSessionStorage, redirect } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, json, useRouteError, isRouteErrorResponse, useLoaderData } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import "react";
import { BlobServiceClient } from "@azure/storage-blob";
import { importJWK, compactDecrypt, jwtVerify } from "jose";
import fs from "fs";
import path from "path";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  let prohibitOutOfOrderStreaming = isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;
  return prohibitOutOfOrderStreaming ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function isBotRequest(userAgent) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  if ("default" in isbotModule && typeof isbotModule.default === "function") {
    return isbotModule.default(userAgent);
  }
  return false;
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/tailwind-Cb79h418.css";
const links = () => [{ rel: "stylesheet", href: stylesheet }];
function App() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("link", { rel: "icon", href: "data:image/x-icon;base64,AA" }),
      /* @__PURE__ */ jsx("title", { children: "AIRabbit Upload" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const logo = "/assets/gsk-logo-t8h1DCiU.png";
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: "__session",
    secrets: ["FyhULmT3Sp9fStTA9ceAzQ"],
    // all of these are optional
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 3
    // domain: "remix.run",
  }
});
const loader$1 = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  if (session.has("userId")) {
    return redirect("/api/blob");
  }
  return true;
};
const action = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  const jwe = session.data.jwe;
  session.set("userId", true);
  return redirect("/api/blob?id=" + jwe, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
};
const login = () => {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-full flex-col px-6 py-12 lg:px-8 items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col px-6 py-12 sm:px-8 w-96 shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "sm:mx-auto sm:w-full sm:max-w-sm", children: /* @__PURE__ */ jsx("img", { className: "h-70 w-122", src: logo, alt: "gsk logo" }) }),
    /* @__PURE__ */ jsx("div", { className: "sm:mx-auto sm:w-full sm:max-w-sm", children: /* @__PURE__ */ jsxs("form", { className: "space-y-6", method: "post", children: [
      /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Username",
          id: "username",
          name: "username",
          type: "text",
          className: "px-3 h-14 md:text-lg block w-full border-2 rounded py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Password",
          id: "password",
          name: "password",
          type: "password",
          className: "px-3 h-14 md:text-lg block w-full border-2 rounded py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx("button", { className: "rounded-3xl flex justify-center bg-teal-800 px-8 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700", children: "SIGN IN" }) })
    ] }) })
  ] }) });
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: login,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const env = process.env;
const fnJweDecrypt = async (jwe) => {
  console.log("Decrypting JWE...");
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey
  });
  const { plaintext } = await compactDecrypt(jwe, jwk);
  const jwt = new TextDecoder().decode(plaintext);
  console.log("JWE decrypted.");
  return jwt;
};
const fnJwtVerify = async (jwt) => {
  console.log("Verifying JWT...");
  const secretKey = env.USER_SECRET;
  const jwk = await importJWK({
    kty: "oct",
    k: secretKey
  });
  const { payload } = await jwtVerify(jwt, jwk);
  console.log("JWT veryfied.");
  return payload.sasURL;
};
const donwloadToTemp = async (encSAS) => {
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
async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const jwe = url.searchParams.get("id");
    if (!jwe) {
      throw new Response("Page not Found", { status: 404 });
    }
    const session = await getSession(request.headers.get("cookie"));
    if (!session.has("userId")) {
      session.set("jwe", jwe);
      return redirect("/api/login", {
        headers: {
          "Set-Cookie": await commitSession(session)
        }
      });
    }
    const jwt = await fnJweDecrypt(jwe);
    const encSAS = await fnJwtVerify(jwt);
    const tempPath = await donwloadToTemp(encSAS);
    const blobName = await uploadBlob(tempPath);
    return json({ blobName });
  } catch (e) {
    console.log({ e });
    throw new Response(
      e.status && e.status === 404 ? "Page not found!" : "Oh no! Something went wrong!",
      {
        status: e.status || 500
      }
    );
  }
}
function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return /* @__PURE__ */ jsx("div", { style: { height: "100vh" }, children: /* @__PURE__ */ jsx("div", { className: " h-100 d-flex justify-content-center align-items-center", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-danger", children: error.status }),
      /* @__PURE__ */ jsxs("p", { children: [
        "⚠ ",
        error.data
      ] })
    ] }) }) });
  }
}
const blob = () => {
  const { blobName } = useLoaderData();
  return /* @__PURE__ */ jsx("div", { style: { height: "100vh" }, children: /* @__PURE__ */ jsx("div", { className: " h-100 d-flex justify-content-center align-items-center", children: /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-success", children: "Success!" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "✅",
      blobName,
      " was uploaded Successfully!"
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] }) }) });
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: blob,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BGSyL7nb.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-CNHexPVh.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-Ci_LlovJ.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-CNHexPVh.js"], "css": ["/assets/root-CoDpR7nl.css"] }, "routes/api.login": { "id": "routes/api.login", "parentId": "root", "path": "api/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.login-BHpRFkBz.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js"], "css": [] }, "routes/api.blob": { "id": "routes/api.blob", "parentId": "root", "path": "api/blob", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/api.blob-DOjLYLYx.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-CNHexPVh.js"], "css": [] } }, "url": "/assets/manifest-e0c864bb.js", "version": "e0c864bb" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": false, "v3_relativeSplatPath": false, "v3_throwAbortReason": false, "unstable_singleFetch": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/api.login": {
    id: "routes/api.login",
    parentId: "root",
    path: "api/login",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api.blob": {
    id: "routes/api.blob",
    parentId: "root",
    path: "api/blob",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
