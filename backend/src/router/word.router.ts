import { Router } from "express";
import { addWord } from "../controllers/word.controller";

export default (router: Router) => {
  router.post("/words", addWord);
};
