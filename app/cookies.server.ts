// session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session", // Set your desired cookie name
    maxAge: 60 * 1, // 1 minutes (adjust as needed)
    // Additional cookie options can be set here
  },
});
