import mongoose from "mongoose";

import UserWordProgressSchema, {
  UserWordProgressSchemaType,
} from "../db/userWordProgress.schema";

const UserWordProgressModel = mongoose.model<UserWordProgressSchemaType>(
  "UserWordProgress",
  UserWordProgressSchema
);

export default UserWordProgressModel;
