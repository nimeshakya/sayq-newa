"use client";

import { useState, useEffect, useCallback } from "react";
import { convertToRanjana } from "../../lib/ranjana-converter";
import "./ranjana-converter.scss";

interface ConversionResult {
  input: string;
  output: string;
  inputType: "devanagari" | "roman";
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
