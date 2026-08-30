import React, { useState } from 'react';

const COMMON_ICONS = [
  'fa-solid fa-code', 'fa-solid fa-laptop-code', 'fa-solid fa-server', 'fa-solid fa-database', 
  'fa-solid fa-cloud', 'fa-solid fa-mobile-screen', 'fa-solid fa-robot', 'fa-solid fa-microchip',
  'fa-solid fa-network-wired', 'fa-solid fa-shield-halved', 'fa-solid fa-chart-line', 'fa-solid fa-chart-pie',
  'fa-solid fa-lightbulb', 'fa-solid fa-rocket', 'fa-solid fa-globe', 'fa-solid fa-gamepad',
  'fa-solid fa-brain', 'fa-solid fa-vr-cardboard', 'fa-solid fa-camera', 'fa-solid fa-music',
  'fa-solid fa-video', 'fa-solid fa-palette', 'fa-solid fa-pen-nib', 'fa-solid fa-layer-group',
  'fa-brands fa-react', 'fa-brands fa-vuejs', 'fa-brands fa-angular', 'fa-brands fa-node-js',
  'fa-brands fa-python', 'fa-brands fa-java', 'fa-brands fa-html5', 'fa-brands fa-css3-alt',
  'fa-brands fa-js', 'fa-brands fa-aws', 'fa-brands fa-docker', 'fa-brands fa-github'
];

interface IconPickerProps {
  currentIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ currentIcon, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = COMMON_ICONS.filter(icon => icon.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md p-6 transform transition-all">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h4 className="text-white text-lg font-bold flex items-center gap-2"><i className="fas fa-icons text-primary-500"></i> Select Icon</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700"><i className="fas fa-times"></i></button>
        </div>
        
        <input 
          type="text" 
          placeholder="Search icons (e.g. react, code)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white mb-4 outline-none focus:border-primary-500 transition-colors"
        />
        
        <div className="grid grid-cols-6 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-4">
          {filteredIcons.map(icon => (
            <button
              key={icon}
              onClick={() => onSelect(icon)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110 ${currentIcon === icon ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:text-white'}`}
              title={icon}
            >
              <i className={icon}></i>
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <div className="col-span-6 text-center py-4 text-slate-500 text-sm">No icons found.</div>
          )}
        </div>
        
        <div className="pt-4 border-t border-slate-700">
          <label className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">Or enter custom class</label>
          <input 
            type="text" 
            placeholder="e.g. fas fa-star"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSelect(e.currentTarget.value);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
