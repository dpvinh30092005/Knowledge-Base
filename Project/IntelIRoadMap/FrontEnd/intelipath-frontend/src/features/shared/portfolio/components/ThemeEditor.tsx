import React from 'react';
import { Select } from "@/components";

interface ThemeEditorProps {
  primaryColor: string;
  titleColor: string;
  textColor: string;
  radius: string;
  headingFont: string;
  bodyFont: string;
  onChangeColor: (key: 'primaryColor' | 'titleColor' | 'textColor', color: string) => void;
  onChangeRadius: (radius: string) => void;
  onApplyPreset: (colors: { primaryColor: string; titleColor: string; textColor: string }) => void;
  onChangeFont: (key: 'heading' | 'body', font: string) => void;
}

const FONTS = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fira Code', value: "'Fira Code', monospace" }
];

const THEME_PRESETS = [
  { name: 'Midnight', colors: { primaryColor: '#a78bfa', titleColor: '#f8fafc', textColor: '#cbd5e1' } },
  { name: 'Ocean', colors: { primaryColor: '#38bdf8', titleColor: '#f0f9ff', textColor: '#bae6fd' } },
  { name: 'Forest', colors: { primaryColor: '#4ade80', titleColor: '#f0fdf4', textColor: '#bbf7d0' } }
];

const RADIUS_OPTIONS = [
  { label: 'Sharp', value: '0px' },
  { label: 'Rounded', value: '16px' },
  { label: 'Pill', value: '40px' }
];

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ 
  primaryColor, titleColor, textColor, radius, headingFont, bodyFont, onChangeColor, onChangeRadius, onApplyPreset, onChangeFont 
}) => {
  
  const ColorControl = ({ label, value, colorKey }: { label: string, value: string, colorKey: 'primaryColor'|'titleColor'|'textColor' }) => (
    <div className="mb-3">
      <label className="text-[11px] text-slate-500 block mb-1.5 uppercase tracking-wider font-semibold">{label}</label>
      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-1.5 border border-slate-200 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-900/5 transition">
        {/* Bigger, clearly clickable swatch; ring keeps near-white colors visible */}
        <label className="relative w-9 h-9 rounded-lg cursor-pointer shrink-0 ring-1 ring-inset ring-black/10 overflow-hidden" style={{ backgroundColor: value }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChangeColor(colorKey, e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeColor(colorKey, e.target.value)}
          className="bg-transparent text-sm font-mono text-slate-700 w-full min-w-0 outline-none px-1 uppercase"
        />
      </div>
    </div>
  );

  const FontControl = ({ label, value, fontKey }: { label: string, value: string, fontKey: 'heading'|'body' }) => (
    <div className="mb-3">
      <label className="text-[11px] text-slate-500 block mb-1.5 uppercase tracking-wider font-semibold">{label}</label>
      <Select
        value={value}
        onChange={(e) => onChangeFont(fontKey, e.target.value)}
        className="rounded-xl bg-slate-50"
      >
        {FONTS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="fixed bottom-8 right-8 bg-white/95 backdrop-blur-xl text-slate-800 p-5 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] z-50 border border-slate-200/80 w-72 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900"><i className="fas fa-paint-roller text-[var(--primary-color)]"></i> Theme Editor</h3>

      <div className="mb-6">
        <h4 className="text-sm font-bold border-b border-slate-200 pb-2 mb-3 text-slate-700">Color Presets</h4>
        <div className="flex gap-2">
          {THEME_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => onApplyPreset(preset.colors)}
              className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-xl py-2.5 flex flex-col items-center gap-1.5 transition-colors"
              title={preset.name}
            >
              <div className="flex gap-1">
                {[preset.colors.primaryColor, preset.colors.titleColor, preset.colors.textColor].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full ring-1 ring-inset ring-black/10" style={{ backgroundColor: c }}></div>
                ))}
              </div>
              <span className="text-[10px] uppercase font-semibold text-slate-500">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold border-b border-slate-200 pb-2 mb-3 text-slate-700">Custom Colors</h4>
        <ColorControl label="Primary Accent" value={primaryColor} colorKey="primaryColor" />
        <ColorControl label="Title Color" value={titleColor} colorKey="titleColor" />
        <ColorControl label="Text Color" value={textColor} colorKey="textColor" />
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold border-b border-slate-200 pb-2 mb-3 text-slate-700">Layout Style</h4>
        <label className="text-[11px] text-slate-500 block mb-2 uppercase tracking-wider font-semibold">Border Radius</label>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {RADIUS_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => onChangeRadius(opt.value)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors ${radius === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold border-b border-slate-200 pb-2 mb-3 text-slate-700">Typography</h4>
        <FontControl label="Heading Font" value={headingFont} fontKey="heading" />
        <FontControl label="Body Font" value={bodyFont} fontKey="body" />
      </div>
    </div>
  );
};
