import { Router } from "express";
import { generateQuestion } from "../controllers/question.controller";

export default (router: Router) => {
  router.get("/questions", generateQuestion);
};
