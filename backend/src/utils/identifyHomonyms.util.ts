import { Word } from "../models/word.model";
import { Homonym } from "../models/homonyms";

/**
 * Scan words and identify homonyms (same newari_word with different meanings)
 * Store them in the Homonym collection
 */
export async function scanAndStoreHomonyms() {
  try {
    // Group words by newari_word and get unique meanings
    const groupedWords = await Word.aggregate([
      {
        $group: {
          _id: "$newari_word",
          wordIds: { $push: "$_id" }, // collect all word IDs
          meanings: { $addToSet: "$nepali_meaning" }, // unique meanings
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // only words appearing more than once
          "meanings.1": { $exists: true }, // only if more than 1 unique meaning
        },
      },
    ]);

    // Clear existing homonyms and insert new ones
    await Homonym.deleteMany({});

    for (const group of groupedWords) {
      await Homonym.updateOne(
        { newari_word: group._id },
        {
          newari_word: group._id,
          wordIds: group.wordIds,
          meanings: group.meanings,
        },
        { upsert: true },
      );
    }

    console.log(`Found and stored ${groupedWords.length} homonyms`);
    return groupedWords;
  } catch (error) {
    console.error("Error scanning homonyms:", error);
    throw error;
  }
}

/**
 * Get all homonyms with their associated word details
 */
export async function getHomonymsWithDetails() {
  try {
    return await Homonym.aggregate([
      {
        $lookup: {
          from: "words",
          localField: "wordIds",
          foreignField: "_id",
          as: "wordDetails",
        },
      },
      {
        $sort: { newari_word: 1 },
      },
    ]);
  } catch (error) {
    console.error("Error fetching homonyms with details:", error);
    throw error;
  }
}

/**
 * Get homonym for a specific newari word
 */
export async function getHomonymByWord(newari_word: string) {
  try {
    return await Homonym.findOne({ newari_word }).populate({
      path: "wordIds",
      model: "Word",
    });
  } catch (error) {
    console.error(`Error fetching homonym for word "${newari_word}":`, error);
    throw error;
  }
}

/**
 * Get all homonyms (basic list)
 */
export async function getAllHomonyms() {
  try {
    return await Homonym.find().sort({ newari_word: 1 });
  } catch (error) {
    console.error("Error fetching all homonyms:", error);
    throw error;
  }
}
