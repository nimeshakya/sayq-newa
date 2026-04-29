"use client";

import { useState } from "react";
import "./character-map.scss";

const characterSets = {
  consonants: {
    title: "Consonants (व्यञ्जन)",
    description: "36 basic consonants",
    characters: [
      { dev: "क", roman: "ka", group: "कवर्ग" },
      { dev: "ख", roman: "kha", group: "कवर्ग" },
      { dev: "ग", roman: "ga", group: "कवर्ग" },
      { dev: "घ", roman: "gha", group: "कवर्ग" },
      { dev: "ङ", roman: "ng", group: "कवर्ग" },
      { dev: "च", roman: "cha", group: "चवर्ग" },
      { dev: "छ", roman: "chha", group: "चवर्ग" },
      { dev: "ज", roman: "ja", group: "चवर्ग" },
      { dev: "झ", roman: "jha", group: "चवर्ग" },
      { dev: "ञ", roman: "nj'a", group: "चवर्ग" },
      { dev: "ट", roman: "t'a", group: "टवर्ग" },
      { dev: "ठ", roman: "t'ha", group: "टवर्ग" },
      { dev: "ड", roman: "d'a", group: "टवर्ग" },
      { dev: "ढ", roman: "d'ha", group: "टवर्ग" },
      { dev: "ण", roman: "n'a", group: "टवर्ग" },
      { dev: "त", roman: "ta", group: "तवर्ग" },
      { dev: "थ", roman: "tha", group: "तवर्ग" },
      { dev: "द", roman: "da", group: "तवर्ग" },
      { dev: "ध", roman: "dha", group: "तवर्ग" },
      { dev: "न", roman: "na", group: "तवर्ग" },
      { dev: "प", roman: "pa", group: "पवर्ग" },
      { dev: "फ", roman: "pha", group: "पवर्ग" },
      { dev: "ब", roman: "ba", group: "पवर्ग" },
      { dev: "भ", roman: "bha", group: "पवर्ग" },
      { dev: "म", roman: "ma", group: "पवर्ग" },
      { dev: "य", roman: "ya", group: "अन्तःस्थ" },
      { dev: "र", roman: "ra", group: "अन्तःस्थ" },
      { dev: "ल", roman: "la", group: "अन्तःस्थ" },
      { dev: "व", roman: "wa", group: "अन्तःस्थ" },
      { dev: "श", roman: "sha", group: "ऊष्म" },
      { dev: "ष", roman: "shha", group: "ऊष्म" },
      { dev: "स", roman: "sa", group: "ऊष्म" },
      { dev: "ह", roman: "ha", group: "ऊष्म" },
    ],
  },
  vowels: {
    title: "Vowels (स्वर)",
    description: "13 vowels with independent and matra forms",
    characters: [
      { dev: "अ", matra: "", roman: "a" },
      { dev: "आ", matra: "ा", roman: "aa" },
      { dev: "इ", matra: "ि", roman: "i" },
      { dev: "ई", matra: "ी", roman: "ii" },
      { dev: "उ", matra: "ु", roman: "u" },
      { dev: "ऊ", matra: "ू", roman: "uu" },
      { dev: "ऋ", matra: "ृ", roman: "ri" },
      { dev: "ए", matra: "े", roman: "e" },
      { dev: "ऐ", matra: "ै", roman: "ai" },
      { dev: "ओ", matra: "ो", roman: "o" },
      { dev: "औ", matra: "ौ", roman: "ao" },
      { dev: "अं", matra: "ं", roman: "am" },
      { dev: "अः", matra: "ः", roman: "a:" },
    ],
  },
  numbers: {
    title: "Numbers (अंक)",
    description: "Nepali numerals 0-9",
    characters: [
      { dev: "०", arabic: "0" },
      { dev: "१", arabic: "1" },
      { dev: "२", arabic: "2" },
      { dev: "३", arabic: "3" },
      { dev: "४", arabic: "4" },
      { dev: "५", arabic: "5" },
      { dev: "६", arabic: "6" },
      { dev: "७", arabic: "7" },
      { dev: "८", arabic: "8" },
      { dev: "९", arabic: "9" },
    ],
  },
  conjuncts: {
    title: "Common Conjuncts (संयुक्त)",
    description: "Frequently used ligatures",
    characters: [
      { dev: "क्ष", roman: "kṣa", meaning: "ksha" },
      { dev: "त्र", roman: "tra", meaning: "tra" },
      { dev: "ज्ञ", roman: "jña", meaning: "gya" },
      { dev: "श्र", roman: "śra", meaning: "shra" },
      { dev: "द्व", roman: "dva", meaning: "dwa" },
      { dev: "द्य", roman: "dya", meaning: "dya" },
      { dev: "न्य", roman: "nya", meaning: "nya" },
      { dev: "प्र", roman: "pra", meaning: "pra" },
      { dev: "स्त", roman: "sta", meaning: "sta" },
      { dev: "स्थ", roman: "stha", meaning: "stha" },
      { dev: "ष्ट", roman: "ṣṭa", meaning: "shta" },
      { dev: "ण्ड", roman: "ṇḍa", meaning: "nda" },
    ],
  },
};

export function CharacterMap() {
  const [selectedTab, setSelectedTab] = useState("consonants");
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const currentSet =
    characterSets[selectedTab as keyof typeof characterSets];

  return (
    <div className="character-map">
      <div className="tabs-container">
        <div className="tabs-list">
          {Object.keys(characterSets).map((tab) => (
            <button
              key={tab}
              className={`tab-trigger ${selectedTab === tab ? "active" : ""}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="tabs-content">
        <div className="content-header">
          <h3 className="content-title">{currentSet.title}</h3>
          <p className="content-description">{currentSet.description}</p>
        </div>

        <div className={`characters-grid grid-${selectedTab}`}>
          {currentSet.characters.map((char, index) => (
            <button
              key={`${char.dev}-${index}`}
              onClick={() => setSelectedChar(char.dev)}
              className={`character-button ${
                selectedChar === char.dev ? "selected" : ""
              }`}
            >
              <span className="character-main">{char.dev}</span>
              <div className="character-info">
                {(char as any).roman && (
                  <span className="info-text">{(char as any).roman}</span>
                )}
                {(char as any).meaning && (
                  <span className="info-text">{(char as any).meaning}</span>
                )}
                {(char as any).arabic && (
                  <span className="info-text">{(char as any).arabic}</span>
                )}
                {(char as any).matra && (
                  <span className="info-badge">
                    {(char as any).matra || "—"}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
