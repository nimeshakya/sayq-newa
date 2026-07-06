import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { MONOGRAM_API } from "@/constants";

const MONOGRAM_API_BASE = MONOGRAM_API;

export type MonogramShowProps = {
  className?: string;
};

// --- PRESETS & CONFIGS ---
const THEMES = [
  {
    name: "Classic",
    fg: "#2d1b69",
    bg: "#ffffff",
    transparent: false,
    padding: 40,
  },
  {
    name: "Royal Gold",
    fg: "#d4af37",
    bg: "#18181b",
    transparent: false,
    padding: 50,
  },
  {
    name: "Rose Quartz",
    fg: "#9f1239",
    bg: "#fff1f2",
    transparent: false,
    padding: 45,
  },
  {
    name: "Midnight",
    fg: "#ffffff",
    bg: "#0f172a",
    transparent: false,
    padding: 60,
  },
  {
    name: "Minimal",
    fg: "#171717",
    bg: "#ffffff",
    transparent: true,
    padding: 30,
  },
];

const translitConsonants: Record<string, string> = {
  k: "क",
  kh: "ख",
  g: "ग",
  gh: "घ",
  ng: "ङ",
  c: "च",
  ch: "छ",
  j: "ज",
  jh: "झ",
  ny: "ञ",
  T: "ट",
  Th: "ठ",
  D: "ड",
  Dh: "ढ",
  N: "ण",
  t: "त",
  th: "थ",
  d: "द",
  dh: "ध",
  n: "न",
  p: "प",
  ph: "फ",
  b: "ब",
  bh: "भ",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  v: "व",
  w: "व",
  s: "श",
  sh: "ष",
  S: "स",
  h: "ह",
  "*": "्",
};

const translitVowels: Record<string, string> = {
  a: "अ",
  aa: "आ",
  i: "इ",
  ii: "ई",
  u: "उ",
  uu: "ऊ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",
};

const translitMatras: Record<string, string> = {
  a: "",
  aa: "ा",
  i: "ि",
  ii: "ी",
  u: "ु",
  uu: "ू",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ",
};

const transliterationKeys = Object.keys({
  ...translitConsonants,
  ...translitVowels,
  0: "०",
  1: "१",
  2: "२",
  3: "३",
  4: "४",
  5: "५",
  6: "६",
  7: "७",
  8: "८",
  9: "९",
  ".": "।",
  ",": ",",
  "(": "(",
  ")": ")",
  "-": "-",
  "?": "?",
}).sort((left, right) => right.length - left.length);

function toDevanagari(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return text;
  const vowelKeys = Object.keys(translitVowels).sort(
    (l, r) => r.length - l.length,
  );
  let converted = "";
  let index = 0;
  let lastWasConsonant = false;

  while (index < text.length) {
    let matched = false;
    if (lastWasConsonant) {
      for (const vowelKey of vowelKeys) {
        if (text.slice(index, index + vowelKey.length) === vowelKey) {
          converted += translitMatras[vowelKey] ?? translitVowels[vowelKey];
          index += vowelKey.length;
          matched = true;
          lastWasConsonant = false;
          break;
        }
      }
    }
    if (!matched) {
      for (const key of transliterationKeys) {
        if (text.slice(index, index + key.length) === key) {
          if (key in translitConsonants) {
            converted += translitConsonants[key];
            lastWasConsonant = key !== "*";
          } else if (key in translitVowels) {
            converted += translitVowels[key];
            lastWasConsonant = false;
          } else {
            converted += key;
            lastWasConsonant = false;
          }
          index += key.length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      converted += text[index];
      index += 1;
      lastWasConsonant = false;
    }
  }
  return converted;
}

export function MonogramShow({
  className,
}: MonogramShowProps = {}): ReactElement {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(80);
  const [padding, setPadding] = useState(40);
  const [fgColor, setFgColor] = useState("#2d1b69");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [vertical, setVertical] = useState(true);

  const [showDetectBadge, setShowDetectBadge] = useState(false);
  const [convertedText, setConvertedText] = useState("");
  const [statusMessage, setStatusMessage] = useState("Awaiting input...");
  const [showDownload, setShowDownload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [activeTheme, setActiveTheme] = useState("Classic");

  const activeBackground = transparent ? "transparent" : bgColor;
  const hasText = useMemo(() => text.trim().length > 0, [text]);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const hasValue = nextValue.trim().length > 0;
    setText(nextValue);
    setShowDetectBadge(hasValue);
    setConvertedText(hasValue ? toDevanagari(nextValue.trim()) : "");
    if (!hasValue) {
      setPreviewUrl("");
      setShowDownload(false);
      setStatusMessage("Awaiting input...");
    }
  };

  const applyTheme = (theme: (typeof THEMES)[0]) => {
    setActiveTheme(theme.name);
    setFgColor(theme.fg);
    setBgColor(theme.bg);
    setTransparent(theme.transparent);
    setPadding(theme.padding);
  };

  const handleCopyConverted = async () => {
    if (!convertedText) return;
    try {
      await navigator.clipboard.writeText(convertedText);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch {
      setCopyLabel("Failed");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) {
      setStatusMessage("Generate a monogram first.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = "ranjana_monogram.png";
    anchor.click();
  };

  const generateMonogram = useCallback(
    async (showStatus = true) => {
      if (text.trim().length === 0) return;

      if (showStatus) {
        setStatusMessage("Crafting your monogram...");
        setIsGenerating(true);
      }

      const payload = {
        text: text.trim(),
        font_size: fontSize,
        fg_color: fgColor,
        bg_color: transparent ? "transparent" : bgColor,
        padding: padding,
        line_spacing: 0,
        vertical: vertical,
        use_overrides: true,
      };

      try {
        const response = await fetch(`${MONOGRAM_API_BASE}/monogram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Generation failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Artificial slight delay to make the loading state feel deliberate and premium
        setTimeout(() => {
          setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return url;
          });
          setShowDownload(true);
          if (showStatus) setStatusMessage("Ready to download");
          setIsGenerating(false);
        }, 300);
      } catch {
        if (showStatus) {
          setStatusMessage("Couldn't generate design");
          setIsGenerating(false);
        }
        setShowDownload(false);
      }
    },
    [text, fontSize, fgColor, bgColor, transparent, padding, vertical],
  );

  // Debounced auto-generation
  useEffect(() => {
    if (!text.trim().length) return;
    setIsGenerating(true);
    const timeoutId = setTimeout(() => {
      generateMonogram(true);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [generateMonogram, text]);

  return (
    <div
      className={`min-h-screen bg-[#fafafa] flex justify-center p-4 sm:p-8 font-sans ${className || ""}`}
    >
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-8">
        {/* --- LEFT COLUMN: CONTROLS --- */}
        <div className="w-full lg:w-[440px] shrink-0 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Studio
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Design your NithyaRanjana monogram. Type in romanized
              transliteration or Devanagari.
            </p>
          </div>

          {/* Text Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label
                htmlFor="monoInput"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"
              >
                Text content
              </label>
              <span
                className={`text-[10px] font-medium transition-opacity ${isGenerating ? "opacity-100 text-amber-500" : "opacity-0"}`}
              >
                Syncing...
              </span>
            </div>
            <textarea
              id="monoInput"
              className="w-full min-h-[120px] resize-none border border-gray-200 rounded-[20px] p-5 text-gray-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all placeholder:text-gray-300 text-lg shadow-inner shadow-gray-50/50"
              placeholder="e.g. namaskar or नमस्कार"
              value={text}
              onChange={handleTextChange}
            />
          </div>

          {/* Premium Themes Picker */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Curated Themes
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => applyTheme(theme)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${
                    activeTheme === theme.name
                      ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-[24px] border border-gray-100">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Size
                </label>
                <span className="text-[11px] font-mono text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {fontSize}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                value={fontSize}
                onChange={(e) => {
                  setFontSize(Number(e.target.value));
                  setActiveTheme("Custom");
                }}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-gray-700 transition-all"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Padding
                </label>
                <span className="text-[11px] font-mono text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {padding}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={padding}
                onChange={(e) => {
                  setPadding(Number(e.target.value));
                  setActiveTheme("Custom");
                }}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Colors & Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Ink
              </label>
              <div className="relative overflow-hidden rounded-[16px] border border-gray-200 hover:border-gray-300 transition-colors">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => {
                    setFgColor(e.target.value);
                    setActiveTheme("Custom");
                  }}
                  className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                />
                <div className="relative pointer-events-none h-10 w-full bg-white flex items-center px-3 gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: fgColor }}
                  />
                  <span className="text-xs font-mono text-gray-600 uppercase">
                    {fgColor}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Canvas
              </label>
              <div
                className={`relative overflow-hidden rounded-[16px] border transition-colors ${transparent ? "border-gray-100 opacity-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <input
                  type="color"
                  value={
                    activeBackground === "transparent"
                      ? "#ffffff"
                      : activeBackground
                  }
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    setActiveTheme("Custom");
                  }}
                  disabled={transparent}
                  className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="relative pointer-events-none h-10 w-full bg-white flex items-center px-3 gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                    style={{
                      backgroundColor:
                        activeBackground === "transparent"
                          ? "#ffffff"
                          : activeBackground,
                    }}
                  />
                  <span className="text-xs font-mono text-gray-600 uppercase">
                    {transparent ? "NONE" : activeBackground}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3">
            <label className="flex-1 group">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={transparent}
                onChange={(e) => {
                  setTransparent(e.target.checked);
                  setActiveTheme("Custom");
                }}
              />
              <div className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-[16px] text-xs font-semibold text-gray-700 cursor-pointer transition-all peer-checked:bg-gray-900 peer-checked:text-white hover:bg-gray-50 peer-checked:hover:bg-gray-800">
                Transparent
              </div>
            </label>

            <label className="flex-1 group">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={vertical}
                onChange={(e) => setVertical(e.target.checked)}
              />
              <div className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-[16px] text-xs font-semibold text-gray-700 cursor-pointer transition-all peer-checked:bg-gray-900 peer-checked:text-white hover:bg-gray-50 peer-checked:hover:bg-gray-800">
                Vertical Stack
              </div>
            </label>
          </div>
        </div>

        {/* --- RIGHT COLUMN: PREVIEW --- */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-full p-2 pr-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-full px-4 py-2 flex items-center gap-2 border border-gray-100">
                <span
                  className={`h-2 w-2 rounded-full ${isGenerating ? "bg-amber-400 animate-pulse" : hasText ? "bg-emerald-400" : "bg-gray-300"}`}
                />
                <span className="text-xs font-medium text-gray-600">
                  {statusMessage}
                </span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!showDownload || isGenerating}
              className="flex items-center gap-2 bg-gray-900 text-white text-xs font-bold py-2 px-5 rounded-full hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export High-Res
            </button>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 w-full rounded-[32px] border border-gray-200 bg-white shadow-sm flex items-center justify-center p-8 relative overflow-hidden min-h-[500px]"
            style={
              transparent
                ? {
                    backgroundImage:
                      "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                    backgroundSize: "24px 24px",
                    backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                  }
                : undefined
            }
          >
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-48 bg-gray-100 rounded-2xl animate-pulse shadow-inner" />
                <p className="text-sm font-medium text-gray-400 animate-pulse">
                  Rendering Glyphs...
                </p>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Monogram Preview"
                className="max-h-full max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              />
            ) : (
              <div className="text-center text-gray-400 max-w-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-600">
                  The canvas is blank
                </p>
                <p className="text-sm mt-1 leading-relaxed">
                  Type any word in the left panel to instantly generate your
                  custom typography art.
                </p>
              </div>
            )}
          </div>

          {/* Helper Footer */}
          {showDetectBadge && (
            <div className="flex justify-between items-center bg-gray-900 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Interpreted As
                </span>
                <span className="text-lg font-medium">{convertedText}</span>
              </div>
              <button
                onClick={handleCopyConverted}
                className="text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full"
              >
                {copyLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonogramShow;
