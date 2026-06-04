'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const DEVA_MAP: Record<string, string> = {
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
  'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  's': 'श', 'sh': 'ष', 'S': 'स', 'h': 'ह',
  '*': '्',
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
};

const API_BASE = 'http://127.0.0.1:8002';

interface LigatureSlot {
  id: number;
  char: string;
}

export default function LigatureComponent() {
  const [slots, setSlots] = useState<LigatureSlot[]>([
    { id: 1, char: 'क' },
    { id: 2, char: 'र' },
  ]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rich character options
  const charOptions = Object.entries(DEVA_MAP)
    .filter(([k]) => k !== '*' && !/\d/.test(k))
    .sort((a, b) => a[1].localeCompare(b[1]));

  // Rich character options formatted for react-select
  const selectOptions = [
    ...charOptions.map(([key, char]) => ({ value: char, label: `${key} (${char})`, char })),
    { value: '्', label: 'halant (्)', char: '्' }
  ];

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      cursor: 'pointer',
      minHeight: 'auto',
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: 0,
      justifyContent: 'center',
    }),
    singleValue: (base: any) => ({
      ...base,
      fontSize: '2.5rem', // text-4xl
      fontFamily: 'serif',
      color: '#222',
      margin: 0,
      display: 'flex',
      justifyContent: 'center',
    }),
    placeholder: (base: any) => ({
      ...base,
      fontSize: '1.5rem',
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      display: 'none', 
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(139, 30, 63, 0.15)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      zIndex: 50,
      width: 'max-content',
      minWidth: '100%',
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '1.2rem',
      backgroundColor: state.isSelected 
        ? '#8b1e3f' 
        : state.isFocused 
          ? 'rgba(139, 30, 63, 0.05)' 
          : 'white',
      color: state.isSelected ? 'white' : '#222',
      cursor: 'pointer',
      padding: '8px 15px',
    }),
  };

  const addSlot = () => {
    setSlots([...slots, { id: Date.now(), char: '्' }]);
  };

  const removeSlot = (id: number) => {
    if (slots.length <= 1) return; // Keep at least one
    setSlots(slots.filter(s => s.id !== id));
  };

  const updateChar = (id: number, char: string) => {
    setSlots(slots.map(s => s.id === id ? { ...s, char } : s));
  };

  // Fetch Ligature Preview
  const fetchPreview = async () => {
    if (slots.length === 0) return;

    setIsLoading(true);
    try {
      const charsConfig = slots.map(slot => ({
        char: slot.char,
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
      }));

      const payload = {
        sequence: slots.map(s => s.char).join('+'),
        chars: charsConfig,
      };

      const res = await fetch(`${API_BASE}/ligatures/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Preview failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Ligature preview error:', error);
      setPreviewUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto preview when slots change
  useEffect(() => {
    const timeout = setTimeout(fetchPreview, 400);
    return () => clearTimeout(timeout);
  }, [slots]);

  const handleSave = async () => {
    if (slots.length < 2) {
      setStatus('✗ At least 2 characters needed for ligature');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    setStatus('Saving ligature rule...');
    try {
      const charsConfig = slots.map(slot => ({
        char: slot.char,
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
      }));

      const payload = {
        sequence: slots.map(s => s.char).join('+'),
        chars: charsConfig,
      };

      const res = await fetch(`${API_BASE}/ligatures/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus('✓ Ligature rule saved successfully!');
      } else {
        setStatus('✗ Failed to save ligature');
      }
    } catch (e) {
      setStatus('✗ Error connecting to server');
    }

    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Controls */}
      <div className="bg-white/95 border border-[#8b1e3f]/20 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(139,30,63,0.08)] backdrop-blur-sm transition-all hover:shadow-[0_12px_40px_rgba(139,30,63,0.12)]">
        <h2 className="text-2xl font-bold mb-2 text-[#222]">🔗 Ligature Studio</h2>
        <p className="text-gray-600 text-sm mb-8">Define custom joining rules for character combinations.</p>

        <div className="mb-8">
          <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-gray-400 mb-4">
            Character Sequence
          </label>
          
          <div className="flex flex-wrap gap-3">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className="bg-[#e8f9ff]/40 border border-[#8b1e3f]/15 rounded-xl p-2.5 relative group transition-all hover:border-[#8b1e3f]/40 min-w-[90px] shadow-sm flex flex-col justify-center items-center"
              >
                <div className="w-full">
                  <Select
                    value={selectOptions.find(opt => opt.value === slot.char)}
                    onChange={(opt: any) => updateChar(slot.id, opt.value)}
                    options={selectOptions}
                    styles={customStyles}
                    isSearchable={true}
                    placeholder=""
                    components={{
                      SingleValue: ({ children, ...props }: any) => (
                        <div {...props.innerProps} className="text-4xl font-serif">
                          {props.data.char}
                        </div>
                      ),
                      IndicatorSeparator: () => null,
                    }}
                    menuPlacement="auto"
                  />
                  <div className="pointer-events-none absolute bottom-2 right-2 text-[#8b1e3f]/30 group-hover:text-[#8b1e3f]/60 transition-colors">
                    <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => removeSlot(slot.id)}
                  className="absolute -top-2 -right-2 bg-[#e33629] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 z-20"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={addSlot}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-[#8b1e3f] border border-[#8b1e3f]/20 rounded-xl transition-all shadow-sm hover:-translate-y-0.5 font-medium"
            >
              ➕ Add Character
            </button>
            <button
              onClick={() => setSlots([{ id: Date.now(), char: 'क' }])}
              className="px-6 py-3 text-[#e33629] hover:bg-[#e33629]/5 border border-[#e33629]/20 rounded-xl transition-all shadow-sm hover:-translate-y-0.5 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-[#8b1e3f] to-[#e33629] hover:opacity-90 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_6px_20px_rgba(139,30,63,0.3)] hover:-translate-y-1 active:translate-y-0"
        >
          💾 Save Ligature Rule
        </button>

        {status && (
          <p className={`text-center mt-4 font-medium ${status.includes('✓') ? 'text-[#00a300]' : 'text-red-600'}`}>
            {status}
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white/95 border border-[#8b1e3f]/20 rounded-[24px] p-8 shadow-[0_8px_30px_rgba(139,30,63,0.08)] backdrop-blur-sm flex flex-col">
        <h3 className="text-xl font-bold mb-6 text-[#222]">🔍 Ligature Preview</h3>
        
        <div className="flex-1 bg-[#e8f9ff]/20 border-2 border-dashed border-[#8b1e3f]/10 rounded-3xl flex items-center justify-center relative overflow-hidden min-h-[380px] shadow-inner">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl z-10">
              <div className="text-white text-sm">Generating ligature preview...</div>
            </div>
          )}

          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Ligature Preview" 
              className="max-h-[85%] drop-shadow-2xl" 
            />
          ) : (
            <div className="text-gray-400 text-center space-y-3">
              <div className="text-6xl opacity-20">🔗</div>
              <p className="font-medium">Add characters to see preview</p>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6 italic">
          Advanced canvas editing (eraser, move, etc.) coming soon
        </p>
      </div>
    </div>
  );
}