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

export const saveUserStatResult = (data: UserResultProp[]): void => {
  let existingData: UserResultProp[] = [];

  if (fs.existsSync(FILE_PATH)) {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    try {
      existingData = JSON.parse(raw);
      if (!Array.isArray(existingData)) {
        existingData = [];
      }
    } catch {
      existingData = [];
    }
  }

  const updatedData = [...existingData, ...data];
  fs.writeFileSync(FILE_PATH, JSON.stringify(updatedData, null, 2));
};
