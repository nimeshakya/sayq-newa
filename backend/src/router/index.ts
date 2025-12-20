import express from "express";

import demoRouter from "./demo.router";
import authenticationRouter from "./authentication.router";
import sessioncheckRouter from "./sessioncheck.router";
import wordRouter from "./word.router";
import userRouter from "./userResultStore.route";
import questionRouter from "./question.router";

const router = express.Router();

export default (): express.Router => {
  // Define routes here
  authenticationRouter(router);
  sessioncheckRouter(router);

  demoRouter(router);
  wordRouter(router);

  userRouter(router);

  questionRouter(router);
  return router;
};
