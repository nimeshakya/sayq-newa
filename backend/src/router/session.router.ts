import { Router } from "express";
import { getSessionQuestions } from "../controllers/session.controller";

export default (router: Router) => {
  router.get("/session-questions", getSessionQuestions);
};
