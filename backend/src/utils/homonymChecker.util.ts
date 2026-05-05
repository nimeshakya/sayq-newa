import { Homonym } from "../models/homonyms";

/**
 * Check if a word is a homonym and get all its meanings/categories
 */
export async function checkAndGetHomonymData(newari_word: string) {
  try {
    const homonym = await Homonym.findOne({ newari_word }).populate({
      path: "wordIds",
      model: "Word",
    });

    if (!homonym) {
      return {
        isHomonym: false,
        homonymData: null,
      };
    }

    return {
      isHomonym: true,
      homonymData: {
        meanings: homonym.meanings,
        wordIds: homonym.wordIds,
        wordDetails: homonym.wordIds, // populated word details
      },
    };
  } catch (error) {
    console.error("Error checking homonym status:", error);
    return {
      isHomonym: false,
      homonymData: null,
    };
  }
}

/**
 * Enhance word data with homonym status
 */
export async function enrichWordWithHomonymStatus(word: any) {
  const homonymInfo = await checkAndGetHomonymData(word.newari_word);

  return {
    ...word,
    isHomonym: homonymInfo.isHomonym,
    homonymData: homonymInfo.homonymData,
  };
}

/**
 * Enrich multiple words with homonym status
 */
export async function enrichWordsWithHomonymStatus(words: any[]) {
  return Promise.all(
    words.map((word) => enrichWordWithHomonymStatus(word)),
  );
}
