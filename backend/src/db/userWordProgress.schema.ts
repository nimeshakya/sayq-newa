import mongoose, { Schema, Document } from "mongoose";

export interface UserWordProgressSchemaType extends Document {
  userId: mongoose.Types.ObjectId;
  wordId: string;
  boxLevel: number;
  mastery: number;
  attempts: number;
  correct: number;
  avgResponseTime: number;
  nextReviewAt: Date;
  lastReviewedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserWordProgressSchema = new Schema<UserWordProgressSchemaType>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    wordId: {
      type: String,
      required: true,
    },

    boxLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    mastery: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    correct: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgResponseTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    nextReviewAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastReviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create compound index for efficient queries
UserWordProgressSchema.index({ userId: 1, wordId: 1 }, { unique: true });
UserWordProgressSchema.index({ userId: 1, nextReviewAt: 1 });
UserWordProgressSchema.index({ userId: 1, boxLevel: 1 });

export default UserWordProgressSchema;
