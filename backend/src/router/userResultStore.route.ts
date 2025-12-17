import express from "express";
import { saveUserResult } from "../controllers/userResultStore.controller";

export default (router: express.Router): void => {
  router.post("/user-stat", saveUserResult);
};
