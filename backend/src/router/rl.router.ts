import { Router } from "express";
import {
  recommendWords,
  recommendWordsDQN,
} from "../controllers/rl.controller";

export default (router: Router) => {
  router.get("/rl/recommend", recommendWords);
  router.get("/rl/dqn-recommend", recommendWordsDQN);
};
