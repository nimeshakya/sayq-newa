"use client";

import { useState, useEffect, useCallback } from "react";
import "./ranjana-converter.scss";

interface ConversionResult {
  input: string;
  output: string;
  inputType: "devanagari" | "roman";
}

// Simple conversion mapping (you can replace this with actual conversion logic)
const NEPALI_TO_RANJANA_MAP: Record<string, string> = {
  // Consonants
  क: "𑑋",
  ख: "𑑌",
  ग: "𑑍",
  घ: "𑑎",
  ङ: "𑑏",
  च: "𑑐",
  छ: "𑑑",
  ज: "𑑒",
  झ: "𑑓",
  ञ: "𑑔",
  ट: "𑑕",
  ठ: "𑑖",
  ड: "𑑗",
  ढ: "𑑘",
  ण: "𑑙",
  त: "𑑚",
  थ: "𑑛",
  द: "𑑜",
  ध: "𑑝",
  न: "𑑞",
  प: "𑑟",
  फ: "𑑠",
  ब: "𑑡",
  भ: "𑑢",
  म: "𑑣",
  य: "𑑤",
  र: "𑑥",
  ल: "𑑦",
  व: "𑑧",
  श: "𑑨",
  ष: "𑑩",
  स: "𑑪",
  ह: "𑑫",
  // Vowels
  अ: "𑑀",
  आ: "𑑁",
  इ: "𑑂",
  ई: "𑑃",
  उ: "𑑄",
  ऊ: "𑑅",
  ऋ: "𑑆",
  ए: "𑑇",
  ऐ: "𑑈",
  ओ: "𑑉",
};

const ROMAN_TO_NEPALI_MAP: Record<string, string> = {
  ka: "क",
  kha: "ख",
  ga: "ग",
  gha: "घ",
  ng: "ङ",
  cha: "च",
  chha: "छ",
  ja: "ज",
  jha: "झ",
  nj: "ञ",
  ta: "ट",
  tha: "ठ",
  da: "ड",
  dha: "ढ",
  na: "ण",
  ta: "त",
  tha: "थ",
  da: "द",
  dha: "ध",
  na: "न",
  pa: "प",
  pha: "फ",
  ba: "ब",
  bha: "भ",
  ma: "म",
  ya: "य",
  ra: "र",
  la: "ल",
  wa: "व",
  sha: "श",
  shha: "ष",
  sa: "स",
  ha: "ह",
  a: "अ",
  aa: "आ",
  i: "इ",
  ii: "ई",
  u: "उ",
  uu: "ऊ",
};

function convertToRanjana(text: string): ConversionResult {
  // Detect input type
  let inputType: "devanagari" | "roman" = "roman";
  if (/[\u0900-\u097F]/.test(text)) {
    inputType = "devanagari";
  }

  let nepaliText = text;

  // If input is Roman, convert to Nepali first
  if (inputType === "roman") {
    let result = text.toLowerCase();
    Object.entries(ROMAN_TO_NEPALI_MAP).forEach(([roman, nepali]) => {
      result = result.replace(new RegExp(roman, "g"), nepali);
    });
    nepaliText = result;
  }

  // Convert Nepali to Ranjana
  let output = nepaliText;
  Object.entries(NEPALI_TO_RANJANA_MAP).forEach(([nepali, ranjana]) => {
    output = output.replace(new RegExp(nepali, "g"), ranjana);
  });

  return {
    input: text,
    output,
    inputType,
  };
}

export function RanjanaConverter() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<"nepali" | "roman">("nepali");
  const [outputMode, setOutputMode] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  const convertText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = convertToRanjana(text);
      setResult(data);
    } catch (error) {
      console.error("Conversion error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced live conversion
  useEffect(() => {
    const timer = setTimeout(() => {
      convertText(inputText);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText, convertText]);

  const handleCopy = async () => {
    if (result?.output) {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
  };

  const getVerticalUnits = (text: string) => {
    if (!text) return [];
    return Array.from(text).filter((unit) => !/^\s+$/.test(unit));
  };

  const exampleTexts = {
    nepali: ["नेपाल", "नमस्ते", "काठमाडौं", "बुद्ध", "हिमालय"],
    roman: ["Nepal", "Namaste", "Kathmandu", "Buddha", "Himalaya"],
  };

  return (
    <div className="ranjana-converter">
      <div className="converter-grid">
        {/* Input Section */}
        <div className="converter-card input-card">
          <div className="card-header">
            <h3 className="card-title">Input Text</h3>
            <div className="mode-tabs">
              <button
                className={`tab-btn ${inputMode === "nepali" ? "active" : ""}`}
                onClick={() => setInputMode("nepali")}
              >
                Nepali
              </button>
              <button
                className={`tab-btn ${inputMode === "roman" ? "active" : ""}`}
                onClick={() => setInputMode("roman")}
              >
                Roman
              </button>
            </div>
          </div>

          <div className="card-content">
            <textarea
              placeholder={
                inputMode === "nepali"
                  ? "टाइप गर्नुहोस् (e.g., नेपाल)"
                  : "Type here (e.g., Nepal)"
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-textarea"
            />

            <div className="button-group">
              <div className="example-buttons">
                {exampleTexts[inputMode].slice(0, 3).map((example) => (
                  <button
                    key={example}
                    className="example-btn"
                    onClick={() => setInputText(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
              <button className="clear-btn" onClick={handleClear}>
                Clear
              </button>
            </div>

            {result && (
              <div className="input-badge">
                <span className="badge-text">
                  {result.inputType === "devanagari" ? "Devanagari" : "Romanized"}
                </span>
                <span className="badge-label">detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="converter-card output-card">
          <div className="card-header">
            <h3 className="card-title">Ranjana Script</h3>
            <div className="output-controls">
              <div className="mode-tabs">
                <button
                  className={`tab-btn ${outputMode === "horizontal" ? "active" : ""}`}
                  onClick={() => setOutputMode("horizontal")}
                >
                  Horizontal
                </button>
                <button
                  className={`tab-btn ${outputMode === "vertical" ? "active" : ""}`}
                  onClick={() => setOutputMode("vertical")}
                >
                  Vertical
                </button>
              </div>

              {result?.output && (
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              )}
            </div>
          </div>

          <div className="card-content">
            <div className={`output-display ${isLoading ? "loading" : ""}`}>
              {result?.output ? (
                outputMode === "vertical" ? (
                  <div className="vertical-output">
                    {getVerticalUnits(result.output).map((unit, index) => (
                      <div key={`${unit}-${index}`} className="vertical-unit">
                        {unit}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="horizontal-output">{result.output}</p>
                )
              ) : (
                <p className="placeholder-text">
                  {isLoading ? (
                    <span className="loading-text">
                      <span className="spinner"></span>
                      Converting...
                    </span>
                  ) : (
                    "Your Ranjana script will appear here"
                  )}
                </p>
              )}
            </div>

            {result?.output && (
              <div className="unicode-output">
                <p className="unicode-label">Unicode Output:</p>
                <code className="unicode-code">{result.output}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
