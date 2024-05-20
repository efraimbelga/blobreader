import React from "react";
import { createCookieSessionStorage, json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "../sessions";
import logo from "../images/gsk-logo.png";

export const loader = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  if (session.has("userId")) {
    return redirect("/api/blob");
  }
  return true;
};

export const action = async ({ request }) => {
  const session = await getSession(request.headers.get("cookie"));
  const jwe = session.data.jwe;
  session.set("userId", true);
  return redirect("/api/blob?id=" + jwe, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });

  // const session = await storage.getSession();
  // session.set("firstName", "Efraim");
  // const commit = await storage.commitSession(session);
};

const login = () => {
  return (
    <div className="flex min-h-full flex-col px-6 py-12 lg:px-8 items-center justify-center">
      <div className="flex flex-col px-6 py-12 sm:px-8 w-96 shadow-2xl">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="h-70 w-122" src={logo} alt="gsk logo" />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" method="post">
            <div className="mt-2">
              <input
                placeholder="Username"
                id="username"
                name="username"
                type="text"
                className="px-3 h-14 md:text-lg block w-full border-2 rounded py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600"
              />
            </div>
            <div className="mt-2">
              <input
                placeholder="Password"
                id="password"
                name="password"
                type="password"
                className="px-3 h-14 md:text-lg block w-full border-2 rounded py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600"
              />
            </div>
            {/* <div className="flex items-center justify-center">
              <p>
              error here
              </p>
            </div> */}
            <div className="flex items-center justify-center">
              <button className="rounded-3xl flex justify-center bg-teal-800 px-8 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                SIGN IN
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default login;
