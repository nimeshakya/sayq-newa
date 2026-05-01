"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const characterSets = {
  consonants: {
    title: "Consonants (व्यञ्जन)",
    description: "36 basic consonants",
    characters: [
      { dev: "क", roman: "ka", group: "कवर्ग" },
      { dev: "ख", roman: "kha", group: "कवर्ग" },
      { dev: "ग", roman: "ga", group: "कवर्ग" },
      { dev: "घ", roman: "gha", group: "कवर्ग" },
      { dev: "ङ", roman: "ṅa", group: "कवर्ग" },
      { dev: "च", roman: "cha", group: "चवर्ग" },
      { dev: "छ", roman: "chha", group: "चवर्ग" },
      { dev: "ज", roman: "ja", group: "चवर्ग" },
      { dev: "झ", roman: "jha", group: "चवर्ग" },
      { dev: "ञ", roman: "ña", group: "चवर्ग" },
      { dev: "ट", roman: "ṭa", group: "टवर्ग" },
      { dev: "ठ", roman: "ṭha", group: "टवर्ग" },
      { dev: "ड", roman: "ḍa", group: "टवर्ग" },
      { dev: "ढ", roman: "ḍha", group: "टवर्ग" },
      { dev: "ण", roman: "ṇa", group: "टवर्ग" },
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
      { dev: "व", roman: "va/wa", group: "अन्तःस्थ" },
      { dev: "श", roman: "śa", group: "ऊष्म" },
      { dev: "ष", roman: "ṣa", group: "ऊष्म" },
      { dev: "स", roman: "sa", group: "ऊष्म" },
      { dev: "ह", roman: "ha", group: "ऊष्म" },
    ],
  },
  vowels: {
    title: "Vowels (स्वर)",
    description: "13 vowels with independent and matra forms",
    characters: [
      { dev: "अ", matra: "", roman: "a" },
      { dev: "आ", matra: "ा", roman: "ā" },
      { dev: "इ", matra: "ि", roman: "i" },
      { dev: "ई", matra: "ी", roman: "ī" },
      { dev: "उ", matra: "ु", roman: "u" },
      { dev: "ऊ", matra: "ू", roman: "ū" },
      { dev: "ऋ", matra: "ृ", roman: "ṛ" },
      { dev: "ए", matra: "े", roman: "e" },
      { dev: "ऐ", matra: "ै", roman: "ai" },
      { dev: "ओ", matra: "ो", roman: "o" },
      { dev: "औ", matra: "ौ", roman: "au" },
      { dev: "अं", matra: "ं", roman: "aṃ" },
      { dev: "अः", matra: "ः", roman: "aḥ" },
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
      { dev: "ज्ञ", roman: "jña", meaning: "gya/jnya" },
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
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Character Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="consonants">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="consonants" className="text-xs">
              Consonants
            </TabsTrigger>
            <TabsTrigger value="vowels" className="text-xs">
              Vowels
            </TabsTrigger>
            <TabsTrigger value="numbers" className="text-xs">
              Numbers
            </TabsTrigger>
            <TabsTrigger value="conjuncts" className="text-xs">
              Conjuncts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consonants" className="mt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {characterSets.consonants.description}
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {characterSets.consonants.characters.map((char) => (
                <button
                  key={char.dev}
                  onClick={() => setSelectedChar(char.dev)}
                  className={`group relative p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all ${
                    selectedChar === char.dev ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="font-ranjana block text-2xl text-center">
                    {char.dev}
                  </span>
                  <span className="block text-[10px] text-muted-foreground text-center mt-1">
                    {char.roman}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vowels" className="mt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {characterSets.vowels.description}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {characterSets.vowels.characters.map((char) => (
                <button
                  key={char.dev}
                  onClick={() => setSelectedChar(char.dev)}
                  className={`group relative p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all ${
                    selectedChar === char.dev ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="font-ranjana block text-2xl text-center">
                    {char.dev}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {char.roman}
                    </span>
                    {char.matra && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1">
                        {char.matra || "—"}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="numbers" className="mt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {characterSets.numbers.description}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {characterSets.numbers.characters.map((char) => (
                <button
                  key={char.dev}
                  onClick={() => setSelectedChar(char.dev)}
                  className={`group relative p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all ${
                    selectedChar === char.dev ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="font-ranjana block text-3xl text-center">
                    {char.dev}
                  </span>
                  <span className="block text-sm text-muted-foreground text-center mt-1">
                    {char.arabic}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conjuncts" className="mt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {characterSets.conjuncts.description}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {characterSets.conjuncts.characters.map((char) => (
                <button
                  key={char.dev}
                  onClick={() => setSelectedChar(char.dev)}
                  className={`group relative p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all ${
                    selectedChar === char.dev ? "border-primary bg-accent" : ""
                  }`}
                >
                  <span className="font-ranjana block text-2xl text-center">
                    {char.dev}
                  </span>
                  <span className="block text-xs text-muted-foreground text-center mt-1">
                    {char.meaning}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
