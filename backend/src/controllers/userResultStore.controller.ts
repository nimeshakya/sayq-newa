import { Request, Response } from "express";
import {
  saveUserStatResult,
  UserResultProp,
} from "../utils/userResultStore.util";

export const saveUserResult = (
  req: Request<{}, {}, UserResultProp[]>,
  res: Response
) => {
  try {
    saveUserStatResult(req.body);
    res.status(201).json({ message: "User results saved successfully" });
  } catch (error: any) {
    console.error("Error saving user results:", error);
    res.status(500).json({ message: "Failed to save user results" });
  }
};
