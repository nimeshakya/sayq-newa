import { Router } from "express";
import { addWord, getWordById, getWords } from "../controllers/word.controller";

export default (router: Router) => {
  router.post("/words", addWord);
  router.get("/words", getWords);
  router.get("/words/:id", getWordById);
};
