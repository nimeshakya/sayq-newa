import { Router } from "express";
import { addWord, fetchDataWord } from "../controllers/word.controller";

export default (router: Router) => {
  router.post("/words", addWord);
  router.get("/words", fetchDataWord);
};
