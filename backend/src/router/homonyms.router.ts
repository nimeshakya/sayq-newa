import { Router } from "express";
import {
  generateHomonyms,
  getHomonyms,
  getAllHomonymsList,
  getHomonymByWordName,
} from "../controllers/homonyms.controller";

export default (router: Router) => {
  // Generate/scan for homonyms
  router.post("/homonyms/generate", generateHomonyms);

  // Get all homonyms with details
  router.get("/homonyms", getHomonyms);

  // Get all homonyms (basic list)
  router.get("/homonyms/list", getAllHomonymsList);

  // Get homonym by word name
  router.get("/homonyms/:word", getHomonymByWordName);
};
