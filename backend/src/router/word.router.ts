import { Router } from "express";
import { addWord, fetchDataWord } from "../controllers/word.controller";
import { hasAuthenticationToken } from "../middlewares/authentication.middleware";

export default (router: Router) => {
  router.post("/words", addWord);
  router.get("/words", hasAuthenticationToken, fetchDataWord);
};
