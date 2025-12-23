import express from "express";
import {
  saveUserResult,
  pullResultsFromMongoToJSON,
} from "../controllers/userResultStore.controller";

export default (router: express.Router): void => {
  router.post("/user-stat", saveUserResult);
  router.get("/user-stat/sync", pullResultsFromMongoToJSON);
};
