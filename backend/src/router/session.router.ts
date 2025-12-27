import { Router } from "express";
import { getSessionQuestions } from "../controllers/session.controller";
import { hasAuthenticationToken } from "../middlewares/authentication.middleware";

export default (router: Router) => {
  router.get("/session-questions", hasAuthenticationToken, getSessionQuestions);
};
