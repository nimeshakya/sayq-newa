import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";

import { MONGO_URI, PORT } from "./constants";
import router from "./router";

const app = express();

/**
 * REQUIRED for Cloudflare Tunnel / Reverse Proxy
 */
app.set("trust proxy", 1);

/**
 * Security headers (Google OAuth compatible)
 */
app.use(
  helmet({
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups",
    },
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * CORS (Frontend + OAuth safe)
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://sayq-newa.sauravdhoju.com.np",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

/**
 * Performance & parsing
 */
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

/**
 * Routes
 */
app.use("/api", router());

/**
 * Server
 */
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

/**
 * MongoDB
 */
mongoose.Promise = Promise;
mongoose.connect(MONGO_URI || "");
mongoose.connection.on("error", (err: Error) => {
  console.error("❌ MongoDB connection error:", err);
});
