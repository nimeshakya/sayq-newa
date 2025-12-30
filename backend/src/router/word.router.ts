import { Router } from "express";
import {
  addWord,
  fetchAllWords,
  fetchCategories,
  fetchDataWord,
} from "../controllers/word.controller";
import { hasAuthenticationToken } from "../middlewares/authentication.middleware";

export default (router: Router) => {
  router.post("/words", addWord);
  router.get("/words/all", fetchAllWords);
  router.get("/words/categories", fetchCategories);
  router.get("/words", hasAuthenticationToken, fetchDataWord);
};
