import express from "express";

import demoRouter from "./demo.router";
import authenticationRouter from "./authentication.router";
import wordRouter from "./word.router";

const router = express.Router();

export default (): express.Router => {
  // Define routes here
  authenticationRouter(router);

  demoRouter(router);
  wordRouter(router);
  return router;
};
