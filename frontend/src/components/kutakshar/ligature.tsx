"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { Link2, Search, Plus, Save } from "lucide-react";
import { MONOGRAM_API } from "@/constants";

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
};

const API_BASE = MONOGRAM_API;

interface LigatureSlot {
  id: number;
  char: string;
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

export default function LigatureComponent() {
  const [slots, setSlots] = useState<LigatureSlot[]>([
    {
      id: 1,
      char: "क",
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
    },
    {
      id: 2,
      char: "र",
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
    },
  ]);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const charOptions = Object.entries(DEVA_MAP)
    .filter(([k]) => !/\d/.test(k))
    .sort((a, b) => a[1].localeCompare(b[1]));

  const selectOptions = [
    ...charOptions.map(([key, char]) => ({
      value: char,
      label: `${key} (${char})`,
    })),
    { value: "्", label: "halant (्)" },
  ];

  const customStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
      minHeight: "auto",
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: 0,
      justifyContent: "center",
    }),
    singleValue: (base: any) => ({
      ...base,
      fontSize: "2.75rem",
      fontFamily: "serif",
      color: "#222",
      margin: 0,
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "12px",
      border: "1px solid rgba(139, 30, 63, 0.15)",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: "1.25rem",
      backgroundColor: state.isSelected
        ? "#8b1e3f"
        : state.isFocused
          ? "rgba(139,30,63,0.08)"
          : "white",
      color: state.isSelected ? "white" : "#222",
      padding: "10px 16px",
    }),
  };

  const addSlot = () => {
    const newSlot: LigatureSlot = {
      id: Date.now(),
      char: "्",
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
    };
    setSlots([...slots, newSlot]);
  };

  const removeSlot = (id: number) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((s) => s.id !== id));
  };

  const updateSlot = (id: number, updates: Partial<LigatureSlot>) => {
    setSlots(
      slots.map((slot) => (slot.id === id ? { ...slot, ...updates } : slot)),
    );
  };

  const fetchPreview = async () => {
    if (slots.length === 0) return;
    setIsLoading(true);
    try {
      const payload = {
        sequence: slots.map((s) => s.char).join("+"),
        chars: slots.map((slot) => ({ ...slot })),
      };

      const res = await fetch(`${API_BASE}/ligatures/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchPreview, 450);
    return () => clearTimeout(timeout);
  }, [slots]);

  const handleSave = async () => {
    if (slots.length < 2) {
      setStatus("✗ At least 2 characters needed for ligature");
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    setStatus("Saving ligature rule...");
    try {
      const payload = {
        sequence: slots.map((s) => s.char).join("+"),
        chars: slots.map((slot) => ({ ...slot })),
      };

      const res = await fetch(`${API_BASE}/ligatures/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setStatus(
        res.ok ? "✓ Ligature rule saved successfully!" : "✗ Failed to save",
      );
    } catch (e) {
      setStatus("✗ Error connecting to server");
    }
    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="w-6 h-6 text-[#8b1e3f]" />
          <h2 className="text-2xl font-bold text-[#222]">Ligature Studio</h2>
        </div>
        <p className="text-gray-500 text-sm mb-10">
          Define custom joining rules with fine-tuned positioning.
        </p>

        <div className="space-y-8">
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              className="border border-gray-100 rounded-3xl p-6 bg-[#f8fbff]"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="font-semibold">Character {index + 1}</div>
                <button
                  onClick={() => removeSlot(slot.id)}
                  className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-xl text-sm"
                >
                  Remove
                </button>
              </div>

              {/* Character Selector */}
              <div className="mb-6">
                <Select
                  value={selectOptions.find((opt) => opt.value === slot.char)}
                  onChange={(opt: any) =>
                    updateSlot(slot.id, { char: opt.value })
                  }
                  options={selectOptions}
                  styles={customStyles}
                  isSearchable
                />
              </div>

              {/* All Configuration Sliders */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
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
                    min: -80,
                    max: 80,
                    step: 1,
                    unit: "px",
                  },
                  {
                    label: "Y-Offset",
                    key: "y_offset" as const,
                    min: -80,
                    max: 80,
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
                    max: 150,
                    step: 1,
                    unit: "px",
                  },
                  {
                    label: "Crop Bottom",
                    key: "crop_bottom" as const,
                    min: 0,
                    max: 150,
                    step: 1,
                    unit: "px",
                  },
                  {
                    label: "Crop Left",
                    key: "crop_left" as const,
                    min: 0,
                    max: 150,
                    step: 1,
                    unit: "px",
                  },
                  {
                    label: "Crop Right",
                    key: "crop_right" as const,
                    min: 0,
                    max: 150,
                    step: 1,
                    unit: "px",
                  },
                ].map(({ label, key, min, max, step, unit }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600">
                      <span>{label}</span>
                      <span className="font-mono text-[#8b1e3f]">
                        {(slot as any)[key]}
                        {unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={(slot as any)[key]}
                      onChange={(e) =>
                        updateSlot(slot.id, {
                          [key]: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#8b1e3f]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={addSlot}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-[#8b1e3f]/20 rounded-2xl hover:bg-gray-50 font-medium"
          >
            <Plus className="w-5 h-5" /> Add Character
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-[#8b1e3f] to-[#e33629] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition"
          >
            <Save className="w-5 h-5" /> Save Ligature Rule
          </button>
        </div>

        {status && (
          <p
            className={`text-center mt-6 font-medium ${status.includes("✓") ? "text-green-600" : "text-red-600"}`}
          >
            {status}
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Search className="w-6 h-6 text-[#8b1e3f]" />
          <h3 className="text-xl font-bold text-[#222]">Ligature Preview</h3>
        </div>

        <div className="flex-1 bg-white border-2 border-dashed border-gray-100 rounded-[32px] flex items-center justify-center relative overflow-hidden min-h-[420px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-3xl z-10">
              <div className="text-[#8b1e3f] font-bold text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#8b1e3f] border-t-transparent rounded-full animate-spin"></div>
                Generating preview...
              </div>
            </div>
          )}

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Ligature Preview"
              className="max-h-[75%] drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
            />
          ) : (
            <div className="text-gray-300 text-center space-y-4">
              <div className="text-8xl opacity-10 font-serif">🔗</div>
              <p className="font-bold text-lg text-gray-400">
                Add characters to see preview
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8 font-medium italic">
          Advanced canvas editing (eraser, move, etc.) coming soon
        </p>
      </div>
    </div>
  );
}
