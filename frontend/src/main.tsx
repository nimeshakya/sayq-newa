import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./constants";
import BackendAPIProvider from "./context/backendAPI.context";

import "./index.scss";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BackendAPIProvider>
        <App />
      </BackendAPIProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
