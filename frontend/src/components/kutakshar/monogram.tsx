import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { MONOGRAM_API_BASE } from "@/constants";

export type MonogramShowProps = {
  className?: string;
};

type GuideRow = {
  keys: string;
  glyphs: string;
};

const guideRows: GuideRow[] = [
  { keys: "k, kh, g, gh", glyphs: "क ख ग घ" },
  { keys: "c, ch, j, jh", glyphs: "च छ ज झ" },
  { keys: "t, th, d, dh", glyphs: "त थ द ध" },
  { keys: "T, Th, D, Dh", glyphs: "ट ठ ड ढ" },
  { keys: "s, sh, S", glyphs: "श ष स" },
  { keys: "* (asterisk)", glyphs: "् (Halant)" },
  { keys: "a, aa, i, ii", glyphs: "अ आ इ ई" },
  { keys: "u, uu, e, ai", glyphs: "उ ऊ ए ऐ" },
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
  if (/[\u0900-\u097F]/.test(text)) {
    return text;
  }

  const vowelKeys = Object.keys(translitVowels).sort(
    (left, right) => right.length - left.length,
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

export function monogramShow({
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
  const [statusMessage, setStatusMessage] = useState(
    "Enter text above and click Generate.",
  );
  const [galleryItems, setGalleryItems] = useState<string[]>([]);
  const [showDownload, setShowDownload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [monogramStatus, setMonogramStatus] = useState<string>(
    "Connecting to monogram backend...",
  );

  // Use refs for config hash tracking to avoid unnecessary re-renders
  const configHashRef = useRef<string>("");
  const lastAutoRefreshRef = useRef<number>(0);

  const activeBackground = transparent ? "transparent" : bgColor;
  const hasText = useMemo(() => text.trim().length > 0, [text]);
  const devanagariText = useMemo(() => toDevanagari(text.trim()), [text]);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const hasValue = nextValue.trim().length > 0;

    setText(nextValue);
    setShowDetectBadge(hasValue);
    setConvertedText(hasValue ? toDevanagari(nextValue.trim()) : "");
  };

  const handleSyncBgState = (checked: boolean) => {
    setTransparent(checked);
    if (checked) {
      setBgColor("#ffffff");
    }
  };

  // Generate monogram with given settings
  const generateMonogram = async (
    textToUse: string,
    fontSizeToUse: number,
    fgColorToUse: string,
    bgColorToUse: string,
    transparentToUse: boolean,
    paddingToUse: number,
    verticalToUse: boolean,
    showStatus = true,
    addToGallery = false,
  ) => {
    if (textToUse.trim().length === 0) {
      return;
    }

    if (showStatus) {
      setStatusMessage("Generating monogram...");
    }
    setShowDownload(false);

    const payload = {
      text: textToUse.trim(),
      font_size: fontSizeToUse,
      fg_color: fgColorToUse,
      bg_color: transparentToUse ? "transparent" : bgColorToUse,
      padding: paddingToUse,
      line_spacing: 0,
      vertical: verticalToUse,
      use_overrides: true,
    };

    try {
      const response = await fetch(`${MONOGRAM_API_BASE}/monogram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Monogram generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return url;
      });
      setShowDownload(true);
      if (addToGallery) {
        setGalleryItems((items) => [textToUse.trim(), ...items].slice(0, 6));
      }
      if (showStatus) {
        setStatusMessage("Monogram generated successfully.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown monogram error";
      if (showStatus) {
        setStatusMessage(`Error: ${message}`);
      }
      setShowDownload(false);
    }
  };

  const handleGenerate = () => {
    if (!hasText) {
      setStatusMessage("Enter text above before generating.");
      return;
    }

    generateMonogram(
      text,
      fontSize,
      fgColor,
      bgColor,
      transparent,
      padding,
      vertical,
      true,
      true,
    );
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

  const handleReset = () => {
    setText("");
    setFontSize(80);
    setPadding(40);
    setFgColor("#2d1b69");
    setBgColor("#ffffff");
    setTransparent(false);
    setVertical(true);
    setShowDetectBadge(false);
    setConvertedText("");
    setStatusMessage("Enter text above and click Generate.");
    setGalleryItems([]);
    setShowDownload(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetch(`${MONOGRAM_API_BASE}/status`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) {
          return;
        }

        setMonogramStatus(
          Boolean(data?.font_exists)
            ? "Monogram backend ready."
            : "Monogram backend started, but font/config is missing.",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setMonogramStatus("Monogram backend unavailable on port 8001.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-refresh monogram when glyph or ligature configs change (optimized to preserve user state)
  useEffect(() => {
    if (!hasText) {
      // Only auto-refresh if user has entered text
      return;
    }

    let cancelled = false;

    const checkAndRefresh = async () => {
      try {
        const [glyphRes, ligRes] = await Promise.all([
          fetch(`${MONOGRAM_API_BASE}/glyphs`),
          fetch(`${MONOGRAM_API_BASE}/ligatures`),
        ]);

        if (!glyphRes.ok || !ligRes.ok || cancelled) return;

        const glyphData = await glyphRes.json();
        const ligData = await ligRes.json();

        // Create a hash of the configs
        const newHash = JSON.stringify({ glyphData, ligData });

        // If hash changed, regenerate with CURRENT user settings (don't reset anything)
        if (configHashRef.current && configHashRef.current !== newHash) {
          console.log("Config detected change, auto-refreshing preview...");

          const now = Date.now();
          if (now - lastAutoRefreshRef.current > 2000) {
            // Only allow refresh every 2 seconds to avoid spam
            lastAutoRefreshRef.current = now;

            // Generate monogram with CURRENT state (text, fontSize, colors, etc all preserved)
            const payload = {
              text: text.trim(),
              font_size: fontSize,
              fg_color: fgColor,
              bg_color: transparent ? "transparent" : bgColor,
              padding,
              line_spacing: 0,
              vertical,
              use_overrides: true,
            };

            try {
              const response = await fetch(`${MONOGRAM_API_BASE}/monogram`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                console.warn("Auto-refresh failed");
                return;
              }

              const blob = await response.blob();
              if (cancelled) return;

              const url = URL.createObjectURL(blob);
              setPreviewUrl((current) => {
                if (current) {
                  URL.revokeObjectURL(current);
                }
                return url;
              });
            } catch (error) {
              console.warn("Auto-refresh error:", error);
            }
          }
        }

        // Update hash ref for next comparison
        configHashRef.current = newHash;
      } catch (error) {
        console.warn("Failed to check config updates:", error);
      }
    };

    // Check immediately on mount, then every 3 seconds
    checkAndRefresh();
    const pollInterval = setInterval(checkAndRefresh, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [
    text,
    fontSize,
    fgColor,
    bgColor,
    transparent,
    padding,
    vertical,
    hasText,
  ]);

  // Auto-generate monogram when text or settings change (debounced)
  useEffect(() => {
    if (!text.trim().length) {
      setPreviewUrl("");
      setShowDownload(false);
      return;
    }

    // Debounce generation to avoid too many requests while typing
    const timeoutId = setTimeout(() => {
      generateMonogram(
        text,
        fontSize,
        fgColor,
        bgColor,
        transparent,
        padding,
        vertical,
        false,
      );
    }, 500); // Wait 500ms after user stops typing before generating

    return () => clearTimeout(timeoutId);
  }, [text, fontSize, fgColor, bgColor, transparent, padding, vertical]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={className}>
      <div
        className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur sm:p-6"
        id="panelMonogram"
      >
        <div className="flex flex-col gap-6 xl:flex-row">
          <section className="flex w-full flex-col gap-5 rounded-2xl border border-border/70 bg-background/60 p-5 xl:max-w-105 xl:flex-[0_0_420px]">
            <div className="space-y-2">
              <div className="text-lg font-semibold tracking-tight text-foreground">
                Monogram Generator
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Type in romanized transliteration or Devanagari. The input is
                converted before rendering with the NithyaRanjana font.
              </p>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                htmlFor="monoInput"
              >
                Text
              </label>
              <textarea
                className="min-h-28 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                id="monoInput"
                placeholder="e.g. namaskar or नमस्कार"
                rows={4}
                onChange={handleTextChange}
                value={text}
              />
            </div>

            <div
              className={`flex flex-col gap-3 rounded-2xl border border-border bg-background/70 p-4 ${showDetectBadge ? "flex" : "hidden"}`}
              id="monoDetect"
            >
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Devanagari Preview
              </div>
              <div
                className="rounded-xl border border-border bg-muted/70 px-3 py-3 text-base leading-7 text-foreground"
                id="monoConverted"
              >
                {convertedText}
              </div>
            </div>
            <details className="group rounded-2xl border border-border bg-background/70 p-4">
              <summary className="cursor-pointer list-item text-sm font-medium text-foreground">
                Transliteration Guide
              </summary>
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {guideRows.map((row) => (
                        <tr
                          key={row.keys}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="py-2 pr-4 font-medium text-primary">
                            {row.keys}
                          </td>
                          <td className="py-2">{row.glyphs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 italic text-muted-foreground">
                  Tip: Use * for half-letters, for example "k*ra".
                </p>
              </div>
            </details>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Font Size <span id="lblFontSize">{fontSize}</span>px
                </label>
                <input
                  type="range"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                  id="monoFontSize"
                  min="30"
                  max="200"
                  value={fontSize}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFontSize(Number(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Padding <span id="lblPadding">{padding}</span>px
                </label>
                <input
                  type="range"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                  id="monoPadding"
                  min="10"
                  max="100"
                  value={padding}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setPadding(Number(event.target.value))
                  }
                />
              </div>
            </div>

            {/* message box */}
            <div
              className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              id="monoStatus"
              hidden
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="leading-6">
                {statusMessage} {monogramStatus ? `(${monogramStatus})` : ""}
              </span>
            </div>

            {/* button group */}
            <div className="flex ml-auto flex-wrap gap-3 pt-1">
              <button
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/60"
                id="btnMonoGen"
                onClick={handleGenerate}
                title="Auto-generates as you type. Click to manually refresh."
              >
                ↻ Refresh
              </button>
              <button
                className={`${showDownload ? "inline-flex" : "hidden"} items-center justify-center rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/80`}
                id="btnMonoDl"
                onClick={handleDownload}
                hidden
              >
                ⬇️ Download PNG
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary/60"
                onClick={handleReset}
              >
                ✕ Reset
              </button>
            </div>
          </section>

          {/* right side  */}
          <section className="flex min-w-0 flex-1 flex-col gap-5">
            {/* preview box */}
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold tracking-tight text-foreground">
                  Preview
                </div>
                {text.trim().length > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-full font-medium">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    Auto-sync on
                  </div>
                )}
              </div>
              <div
                className="flex min-h-75 items-center justify-center rounded-2xl border border-dashed border-border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)] p-4"
                id="monoPreviewWrap"
              >
                {previewUrl ? (
                  <img
                    id="monoImg"
                    src={previewUrl}
                    alt="Monogram"
                    className="max-h-90 max-w-full rounded-2xl object-contain shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                  />
                ) : (
                  <div
                    className={`flex flex-col items-center gap-3 text-center text-muted-foreground ${showDetectBadge ? "hidden" : "flex"}`}
                    id="monoPlaceholder"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl"></div>
                    <div className="text-sm leading-6">
                      Your Ranjana monogram
                      <br />
                      will appear here
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* session gallery */}
            <div
              className="rounded-2xl border border-border bg-background/70 p-5"
              id="monoGalleryCard"
              hidden
            >
              <div className="text-lg font-semibold tracking-tight text-foreground">
                Session Gallery
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recently generated monograms in this session.
              </p>
              <div
                className="mt-4 flex min-h-25 gap-4 overflow-x-auto pb-2"
                id="monoGallery"
              >
                {galleryItems.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No history yet.
                  </span>
                ) : (
                  galleryItems.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="min-w-30 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground shadow-sm"
                    >
                      <span className="block truncate">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* color background option */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* font color */}
              <div className=" flex flex-col justify-center space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Ink Colour
                </label>
                <input
                  type="color"
                  className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-background p-1"
                  id="monoFg"
                  value={fgColor}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFgColor(event.target.value)
                  }
                />
              </div>

              {/* background customization */}
              <div className="flex flex-col justify-center space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Background Colour
                </label>
                <div className="flex flex-row gap-3">
                  <input
                    type="color"
                    className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-60"
                    id="monoBg"
                    value={activeBackground}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setBgColor(event.target.value)
                    }
                    disabled={transparent}
                  />

                  <div className=" flex gap-3 flex-col">
                    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        id="monoTransparent"
                        checked={transparent}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleSyncBgState(event.target.checked)
                        }
                      />
                      Transparent
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        id="monoVertical"
                        checked={vertical}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setVertical(event.target.checked)
                        }
                      />
                      Vertical Stack
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export const MonogramShow = monogramShow;
export default monogramShow;
