import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";

const isElectron = window.navigator.userAgent.includes('Electron') || window.location.protocol === 'file:';
const RouterComponent = isElectron ? HashRouter : BrowserRouter;

const root = createRoot(document.getElementById("root"));
root.render(
  <RouterComponent>
    <App />
  </RouterComponent>
);
