import { Router } from "express";
import { addWord, getWordById } from "../controllers/word.controller";

export default (router: Router) => {
  router.post("/words", addWord);
  router.get("/words/:id", getWordById);
};
