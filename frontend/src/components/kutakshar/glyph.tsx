"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Settings2, Search, Save } from "lucide-react";
import { MONOGRAM_API } from "@/constants";

interface GlyphConfig {
  scale: number;
  x_offset: number;
  y_offset: number;
  rotation: number;
  skew_x: number;
  skew_y: number;
  crop_top: number;
  crop_bottom: number;
  crop_left: number;
  crop_right: number;
}

const DEVA_MAP: Record<string, string> = {
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
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
  ".": "।",
  ",": ",",
  "(": "(",
  ")": ")",
  "-": "-",
  "?": "?",
};

const API_BASE = MONOGRAM_API;

export default function GlyphComponent() {
  const [selectedChar, setSelectedChar] = useState("क");
  const [editingMode, setEditingMode] = useState<
    "full" | "half" | "first" | "middle" | "last"
  >("full");
  const [config, setConfig] = useState<GlyphConfig>({
    scale: 1.0,
    x_offset: 0,
    y_offset: 0,
    rotation: 0,
    skew_x: 0,
    skew_y: 0,
    crop_top: 0,
    crop_bottom: 0,
    crop_left: 0,
    crop_right: 0,
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allConfigs, setAllConfigs] = useState<Record<string, any>>({});

  // Fetch all glyph configs on component mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch(`${API_BASE}/glyphs`);
        if (res.ok) {
          const data = await res.json();
          setAllConfigs(data);
        }
      } catch (error) {
        console.warn("Failed to fetch glyph configs:", error);
      }
    };
    fetchConfigs();
  }, []);

  const charOptions = Object.entries(DEVA_MAP)
    .filter(([k]) => k !== "*" && !/\d/.test(k))
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([key, char]) => ({ value: char, label: `${key} (${char})`, char }));

  const modeOptions = [
    { value: "full", label: "Full Letter (Default)" },
    { value: "half", label: "Half Letter (Conjunct)" },
    { value: "first", label: "Top Position (First)" },
    { value: "middle", label: "Middle Position" },
    { value: "last", label: "Bottom Position (Last)" },
  ];

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "rgba(232, 249, 255, 0.3)", // #e8f9ff/30
      border: state.isFocused
        ? "1px solid #8b1e3f"
        : "1px solid rgba(139, 30, 63, 0.15)",
      borderRadius: "12px",
      padding: "2px 8px",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#8b1e3f",
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "4px 0",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#222",
      fontFamily: "serif",
      fontSize: "1rem",
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid rgba(139, 30, 63, 0.15)",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      zIndex: 50,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#8b1e3f"
        : state.isFocused
          ? "rgba(139, 30, 63, 0.05)"
          : "white",
      color: state.isSelected ? "white" : "#222",
      cursor: "pointer",
      padding: "10px 15px",
      "&:active": {
        backgroundColor: "#8b1e3f",
      },
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "rgba(139, 30, 63, 0.5)",
      "&:hover": {
        color: "#8b1e3f",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  const updateConfig = (key: keyof GlyphConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Load saved config when character or editing mode changes
  useEffect(() => {
    if (allConfigs[selectedChar]?.[editingMode]) {
      const savedConfig = allConfigs[selectedChar][editingMode];
      setConfig((prev) => ({
        ...prev,
        ...savedConfig,
      }));
      console.log(
        `Loaded config for ${selectedChar} (${editingMode}):`,
        savedConfig,
      );
    } else {
      // Reset to defaults if no saved config
      setConfig({
        scale: 1.0,
        x_offset: 0,
        y_offset: 0,
        rotation: 0,
        skew_x: 0,
        skew_y: 0,
        crop_top: 0,
        crop_bottom: 0,
        crop_left: 0,
        crop_right: 0,
      });
      console.log(
        `No saved config for ${selectedChar} (${editingMode}), using defaults`,
      );
    }
  }, [selectedChar, editingMode, allConfigs]);

  const fetchPreview = async (configToUse?: GlyphConfig) => {
    setIsLoading(true);
    try {
      const payload = {
        char: selectedChar,
        type: editingMode,
        ...(configToUse || config),
      };

      const res = await fetch(`${API_BASE}/glyphs/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Preview error: HTTP ${res.status}`, errorText);
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Revoke old URL to prevent memory leak
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Preview fetch error:", errorMsg);
      setPreviewUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  // Shorter debounce for snappier feedback (150ms for crop, 100ms for others)
  useEffect(() => {
    const timeoutId = setTimeout(fetchPreview, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedChar, editingMode, config]);

  const handleSave = async () => {
    setStatus("Saving...");
    try {
      const payload = {
        char: selectedChar,
        type: editingMode,
        ...config,
      };

      const res = await fetch(`${API_BASE}/glyphs/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus("✓ Configuration saved successfully!");
        console.log("Saved:", data);

        // Refresh the configs from server
        const configRes = await fetch(`${API_BASE}/glyphs`);
        if (configRes.ok) {
          const newConfigs = await configRes.json();
          setAllConfigs(newConfigs);
          console.log("Configs refreshed");
        }
      } else {
        const errorText = await res.text();
        console.error("Save failed:", res.status, errorText);
        setStatus(`✗ Failed to save (HTTP ${res.status})`);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Save error:", errorMsg);
      setStatus(`✗ Connection error: ${errorMsg}`);
    }

    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">
        <div className="flex items-center gap-3 mb-2">
          <Settings2 className="w-6 h-6 text-[#8b1e3f]" />
          <h2 className="text-2xl font-bold text-[#222]">Glyph Studio</h2>
        </div>
        <p className="text-gray-500 text-sm mb-10">
          Fine-tune individual characters for perfect monogram stacks.
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] font-bold text-gray-300 mb-2 ml-1">
                Base Character
              </label>
              <Select
                value={charOptions.find((opt) => opt.value === selectedChar)}
                onChange={(opt: any) => setSelectedChar(opt.value)}
                options={charOptions}
                styles={customStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable={true}
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] font-bold text-gray-300 mb-2 ml-1">
                Editing Mode
              </label>
              <Select
                value={modeOptions.find((opt) => opt.value === editingMode)}
                onChange={(opt: any) => setEditingMode(opt.value as any)}
                options={modeOptions}
                styles={customStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable={false}
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {[
              {
                label: "Scale",
                key: "scale" as const,
                min: 0.5,
                max: 2.0,
                step: 0.05,
                unit: "x",
              },
              {
                label: "X-Offset",
                key: "x_offset" as const,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
              },
              {
                label: "Y-Offset",
                key: "y_offset" as const,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
              },
              {
                label: "Rotation",
                key: "rotation" as const,
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
              },
              {
                label: "Skew X",
                key: "skew_x" as const,
                min: -1,
                max: 1,
                step: 0.05,
              },
              {
                label: "Skew Y",
                key: "skew_y" as const,
                min: -1,
                max: 1,
                step: 0.05,
              },
              {
                label: "Crop Top",
                key: "crop_top" as const,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
              },
              {
                label: "Crop Bottom",
                key: "crop_bottom" as const,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
              },
              {
                label: "Crop Left",
                key: "crop_left" as const,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
              },
              {
                label: "Crop Right",
                key: "crop_right" as const,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
              },
            ].map(({ label, key, min, max, step, unit = "" }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold mb-0.5 px-1">
                  <span className="text-gray-400 uppercase tracking-widest">
                    {label}
                  </span>
                  <span className="font-mono text-[#8b1e3f] bg-[#8b1e3f]/5 px-1.5 py-0.5 rounded-md">
                    {config[key]}
                    {unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={config[key]}
                  onChange={(e) =>
                    updateConfig(key, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer accent-[#8b1e3f] slider-thumb transition-shadow hover:shadow-[0_0_12px_rgba(139,30,63,0.3)] active:shadow-[0_0_16px_rgba(139,30,63,0.5)]"
                  style={
                    {
                      WebkitAppearance: "none",
                      appearance: "none",
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>

          {/* Config Status & Buttons */}
          <div className="space-y-3">
            {allConfigs[selectedChar]?.[editingMode] && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">
                  Saved configuration loaded for this character
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 relative overflow-hidden group bg-gradient-to-r from-[#8b1e3f] to-[#e33629] text-white py-5 rounded-[22px] font-bold text-lg transition-all shadow-[0_15px_35px_rgba(139,30,63,0.25)] hover:shadow-[0_20px_45px_rgba(139,30,63,0.35)] hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3"
              >
                <Save className="w-6 h-6" /> Save
              </button>

              <button
                onClick={() => {
                  setConfig({
                    scale: 1.0,
                    x_offset: 0,
                    y_offset: 0,
                    rotation: 0,
                    skew_x: 0,
                    skew_y: 0,
                    crop_top: 0,
                    crop_bottom: 0,
                    crop_left: 0,
                    crop_right: 0,
                  });
                  setStatus("↻ Reset to defaults");
                  setTimeout(() => setStatus(""), 2000);
                }}
                className="px-6 py-5 rounded-[22px] font-bold text-lg transition-all border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </div>

          {status && (
            <p className="text-center text-[#00a300] font-medium text-sm mt-4">
              {status}
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-6 h-6 text-[#8b1e3f]" />
          <h3 className="text-xl font-bold text-[#222]">Glyph Preview</h3>
        </div>

        <div className="flex-1 bg-white border-2 border-dashed border-gray-100 rounded-[32px] flex items-center justify-center relative overflow-hidden min-h-[420px] group">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl z-10">
              <div className="text-white text-sm">Generating preview...</div>
            </div>
          )}

          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Glyph Preview"
                className="max-h-[85%] drop-shadow-2xl transition-opacity duration-200"
              />

              {/* Crop boundary visualization - shows in real-time */}
              {(config.crop_top > 0 ||
                config.crop_bottom > 0 ||
                config.crop_left > 0 ||
                config.crop_right > 0) && (
                <div
                  className="absolute inset-0 pointer-events-none border-2 border-orange-400/60 rounded-sm transition-all duration-75"
                  style={{
                    top: `${(config.crop_top / 200) * 100}%`,
                    bottom: `${(config.crop_bottom / 200) * 100}%`,
                    left: `${(config.crop_left / 200) * 100}%`,
                    right: `${(config.crop_right / 200) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs text-orange-600 font-bold whitespace-nowrap bg-orange-50 px-2 py-1 rounded">
                    Crop: {config.crop_top}|{config.crop_bottom}|
                    {config.crop_left}|{config.crop_right}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-center space-y-4">
              <div className="text-7xl opacity-20">🪷</div>
              <p className="font-medium text-lg">Preview will appear here</p>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6 italic">
          This preview shows how the character will appear in the stack. Adjust
          crop values for precise cropping.
        </p>
      </div>
    </div>
  );
}
