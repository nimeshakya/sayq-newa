import fs from "fs";
import path from "path";

export interface UserResultProp {
  id: number;
  questionID: string;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
  createdAt: string;
}

const FILE_PATH = path.resolve(process.cwd(), "..", "data", "userResult.json");

export const saveUserStatResult = (data: UserResultProp): void => {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  }
};
