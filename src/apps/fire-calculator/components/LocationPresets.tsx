import React from 'react';
import { MapPin } from 'lucide-react';

export interface LocationPreset {
  name: string;
  currencyCode: 'USD' | 'JPY' | 'CNY';
  symbol: string;
  inflation: number;
  taxDrag: number;
}

const PRESETS: LocationPreset[] = [
  { name: 'USA', currencyCode: 'USD', symbol: '$', inflation: 3.0, taxDrag: 15.0 },
  { name: 'Japan', currencyCode: 'JPY', symbol: '¥', inflation: 1.0, taxDrag: 20.315 },
  { name: 'China', currencyCode: 'CNY', symbol: '¥', inflation: 2.5, taxDrag: 20.0 },
];

interface Props {
  currentPreset: LocationPreset;
  multiplier: number;
  onUpdatePreset: (preset: LocationPreset) => void;
  onUpdateMultiplier: (m: number) => void;
}

const LocationPresets: React.FC<Props> = ({ currentPreset, multiplier, onUpdatePreset, onUpdateMultiplier }) => {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4 text-indigo-400 font-semibold">
        <MapPin className="w-5 h-5" />
        <h2>Geo-Context</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Location Preset</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => onUpdatePreset(preset)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${currentPreset.name === preset.name
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Inflation (%)</label>
            <input
              type="number"
              value={currentPreset.inflation}
              onChange={e => onUpdatePreset({ ...currentPreset, inflation: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tax Drag (%)</label>
            <input
              type="number"
              value={currentPreset.taxDrag}
              onChange={e => onUpdatePreset({ ...currentPreset, taxDrag: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-400">Geo-Arbitrage Multiplier</label>
            <span className="text-sm font-bold text-indigo-400">{multiplier.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={multiplier}
            onChange={e => onUpdateMultiplier(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[10px] text-slate-500 mt-2 leading-tight">
            How much cheaper (e.g. 0.7) or more expensive (e.g. 1.2) is your retirement location compared to your earning location?
          </p>
        </div>
      </div>
    </section>
  );
};

export default LocationPresets;
