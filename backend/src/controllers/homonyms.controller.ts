import { Request, Response } from "express";
import { Homonym } from "../models/homonyms";
import {
  scanAndStoreHomonyms,
  getHomonymsWithDetails,
  getAllHomonyms,
  getHomonymByWord,
} from "../utils/identifyHomonyms.util";

/**
 * Generate homonyms - ensures Homonym collection exists in MongoDB and scans for homonyms
 */
export const generateHomonyms = async (req: Request, res: Response) => {
  try {
    console.log("Starting homonym generation process...");

    // Step 1: Ensure Homonym collection and schema exist in MongoDB
    try {
      // This will create the collection if it doesn't exist
      await Homonym.collection.createIndex({ newari_word: 1 });
      console.log("Homonym collection index ensured");
    } catch (indexError: any) {
      if (indexError.code !== 85) {
        // 85 = index already exists
        console.log("Index creation note:", indexError.message);
      }
    }

    // Step 2: Scan words and generate homonyms
    console.log("Scanning words for homonyms...");
    const result = await scanAndStoreHomonyms();

    res.status(200).json({
      success: true,
      message: "Homonyms generated successfully",
      count: result.length,
      data: result,
    });
  } catch (error: any) {
    console.error("Error generating homonyms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate homonyms",
      error: error.message,
    });
  }
};

/**
 * Get all homonyms with their associated word details
 */
export const getHomonyms = async (req: Request, res: Response) => {
  try {
    const homonyms = await getHomonymsWithDetails();

    res.status(200).json({
      success: true,
      count: homonyms.length,
      data: homonyms,
    });
  } catch (error: any) {
    console.error("Error fetching homonyms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homonyms",
      error: error.message,
    });
  }
};

/**
 * Get all homonyms (basic list without word details)
 */
export const getAllHomonymsList = async (req: Request, res: Response) => {
  try {
    const homonyms = await getAllHomonyms();

    res.status(200).json({
      success: true,
      count: homonyms.length,
      data: homonyms,
    });
  } catch (error: any) {
    console.error("Error fetching homonyms list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homonyms",
      error: error.message,
    });
  }
};

/**
 * Get homonym by word
 */
export const getHomonymByWordName = async (req: Request, res: Response) => {
  try {
    const word = typeof req.params.word === "string" ? req.params.word : "";

    if (!word) {
      return res.status(400).json({
        success: false,
        message: "Word parameter is required",
      });
    }

    const homonym = await getHomonymByWord(word);

    if (!homonym) {
      return res.status(404).json({
        success: false,
        message: `No homonym found for word: ${word}`,
      });
    }

    res.status(200).json({
      success: true,
      data: homonym,
    });
  } catch (error: any) {
    console.error("Error fetching homonym by word:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homonym",
      error: error.message,
    });
  }
};
