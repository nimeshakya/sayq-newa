import { Request, Response } from "express";
import {
  saveUserStatResult,
  UserResultProp,
} from "../utils/userResultStore.util";

export const saveUserResult = (
  req: Request<{}, {}, UserResultProp>,
  res: Response
) => {
  try {
    saveUserStatResult(req.body);
    res.status(201).json({ message: "userStat.json created" });
  } catch {
    res.status(500).json({ message: "Failed to create userStat.json" });
  }
};
