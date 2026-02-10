import { Router } from "express";
import {
  addWord,
  fetchLearningWords,
  fetchCategories,
  fetchDataWord,
  fetchExpertiseLevel,
  searchWords,
} from "../controllers/word.controller";
import { hasAuthenticationToken } from "../middlewares/authentication.middleware";

export default (router: Router) => {
  router.post("/words", hasAuthenticationToken, addWord);
  router.get("/words/learn", hasAuthenticationToken, fetchLearningWords);
  router.get("/words/categories", hasAuthenticationToken, fetchCategories);
  router.get(
    "/words/expertise-level",
    hasAuthenticationToken,
    fetchExpertiseLevel,
  );
  router.get("/words", hasAuthenticationToken, fetchDataWord);

  router.get("/words/search", searchWords);
};
