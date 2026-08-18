declare module "react/jsx-runtime";

import React, { Fragment } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <Fragment>
      <RouterProvider router={router} />
      <Toaster />
    </Fragment>
  );
}
