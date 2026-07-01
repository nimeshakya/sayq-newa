// @ts-ignore
import { chain } from "stream-chain";
// @ts-ignore
import { parser } from "stream-json";
// @ts-ignore
import { streamArray } from "stream-json/streamers/StreamArray";

import fs from "fs";
import mongoose from "mongoose";
import { Word } from "../models/word.model";

import { MONGO_URI } from "../constants";
const BATCH_SIZE = 1000; // Insert 1000 words at a time

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const pipeline = chain([
      fs.createReadStream("./words.json"), // path to your JSON
      parser(),
      streamArray(),
    ]);

    let batch: any[] = [];
    let count = 0;

    pipeline.on("data", async (data: any) => {
      batch.push(data.value); // `value` contains each object

      if (batch.length >= BATCH_SIZE) {
        pipeline.pause(); // pause stream while inserting
        try {
          await Word.insertMany(batch, { ordered: false });
          count += batch.length;
          console.log(`Inserted ${count} words`);
        } catch (err) {
          console.error("Error inserting batch:", err);
        }
        batch = [];
        pipeline.resume(); // resume stream
      }
    });

    pipeline.on("end", async () => {
      if (batch.length > 0) {
        try {
          await Word.insertMany(batch, { ordered: false });
          count += batch.length;
          console.log(`Inserted final ${batch.length} words`);
        } catch (err) {
          console.error("Error inserting final batch:", err);
        }
      }
      console.log(`🎉 All words inserted! Total: ${count}`);
      await mongoose.disconnect();
    });

    pipeline.on("error", (err: any) => {
      console.error("Stream error:", err);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
})();
