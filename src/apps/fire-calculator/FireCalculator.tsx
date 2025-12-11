import React, { useState, useMemo } from 'react';
import { SimulationInput, LifeEvent } from './engine/types';
import { runSimulation } from './engine/simulation';
import LocationPresets, { LocationPreset } from './components/LocationPresets';
import LifeCycleInputs from './components/LifeCycleInputs';
import PortfolioChart from './components/PortfolioChart';
import { Calculator, Calendar, TrendingUp, AlertTriangle, Globe } from 'lucide-react';

const DEFAULT_INPUT: SimulationInput = {
  initialPortfolio: 500000,
  annualSpending: 40000,
  currentAge: 30,
  retirementAge: 45,
  lifeExpectancy: 90,
  locationPreset: {
    name: 'USA',
    currencyCode: 'USD',
    symbol: '$',
    inflation: 3.0,
    taxDrag: 15.0
  },
  fxRates: {
    USDJPY: 156,
    USDCNY: 7
  },
  geoArbitrageMultiplier: 1.0,
  lifeEvents: [],
  simulationMode: 'historical',
  deterministicReturn: 7.0,
  panicMode: false
};

const convertValue = (value: number, from: string, to: string, rates: { USDJPY: number, USDCNY: number }) => {
  if (from === to) return value;
  let usdValue = value;
  if (from === 'JPY') usdValue = value / rates.USDJPY;
  else if (from === 'CNY') usdValue = value / rates.USDCNY;

  if (to === 'USD') return usdValue;
  if (to === 'JPY') return usdValue * rates.USDJPY;
  if (to === 'CNY') return usdValue * rates.USDCNY;
  return value;
};

const FireCalculator: React.FC = () => {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT);

  const results = useMemo(() => runSimulation(input), [input]);

  const updateInput = (updates: Partial<SimulationInput>) => {
    setInput(prev => ({ ...prev, ...updates }));
  };

  const handleUpdatePreset = (newPreset: LocationPreset) => {
    const oldCode = input.locationPreset.currencyCode;
    const newCode = newPreset.currencyCode;

    setInput(prev => ({
      ...prev,
      locationPreset: newPreset,
      initialPortfolio: convertValue(prev.initialPortfolio, oldCode, newCode, prev.fxRates),
      annualSpending: convertValue(prev.annualSpending, oldCode, newCode, prev.fxRates),
      lifeEvents: prev.lifeEvents.map(e => ({
        ...e,
        amount: convertValue(e.amount, oldCode, newCode, prev.fxRates)
      }))
    }));
  };

  const addLifeEvent = (event: LifeEvent) => {
    setInput(prev => ({ ...prev, lifeEvents: [...prev.lifeEvents, event] }));
  };

  const removeLifeEvent = (id: string) => {
    setInput(prev => ({ ...prev, lifeEvents: prev.lifeEvents.filter(e => e.id !== id) }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">FIRE Sandbox</h1>
            <p className="text-slate-400">Visualize your path to financial independence</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar / Inputs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Core Parameters */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <h2>Core Parameters</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Initial Portfolio ({input.locationPreset.symbol})</label>
                  <input
                    type="number"
                    value={input.initialPortfolio}
                    onChange={e => updateInput({ initialPortfolio: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Annual Spending ({input.locationPreset.symbol})</label>
                  <input
                    type="number"
                    value={input.annualSpending}
                    onChange={e => updateInput({ annualSpending: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Current Age</label>
                    <input
                      type="number"
                      value={input.currentAge}
                      onChange={e => updateInput({ currentAge: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Retire Age</label>
                    <input
                      type="number"
                      value={input.retirementAge}
                      onChange={e => updateInput({ retirementAge: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Geo-Context */}
            <LocationPresets
              currentPreset={input.locationPreset}
              multiplier={input.geoArbitrageMultiplier}
              onUpdatePreset={handleUpdatePreset}
              onUpdateMultiplier={m => updateInput({ geoArbitrageMultiplier: m })}
            />

            {/* FX Rates */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-semibold">
                <Globe className="w-5 h-5" />
                <h2>Exchange Rates</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">USD/JPY</label>
                  <input
                    type="number"
                    value={input.fxRates.USDJPY}
                    onChange={e => updateInput({ fxRates: { ...input.fxRates, USDJPY: Number(e.target.value) } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">USD/CNY</label>
                  <input
                    type="number"
                    value={input.fxRates.USDCNY}
                    onChange={e => updateInput({ fxRates: { ...input.fxRates, USDCNY: Number(e.target.value) } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Simulation Mode */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-semibold">
                <Calendar className="w-5 h-5" />
                <h2>Simulation Mode</h2>
              </div>
              <div className="flex p-1 bg-slate-800 rounded-xl mb-4">
                {(['deterministic', 'historical', 'monte-carlo'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateInput({ simulationMode: mode })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${input.simulationMode === mode
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {mode.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                  </button>
                ))}
              </div>

              {input.simulationMode === 'deterministic' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Expected Return (%)</label>
                  <input
                    type="number"
                    value={input.deterministicReturn}
                    onChange={e => updateInput({ deterministicReturn: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-bold">Panic Mode</span>
                </div>
                <button
                  onClick={() => updateInput({ panicMode: !input.panicMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${input.panicMode ? 'bg-red-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${input.panicMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </section>
          </div>

          {/* Main Content / Visualization */}
          <div className="lg:col-span-8 space-y-6">
            {/* Chart Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Portfolio Projection</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-slate-400">90th (Lucky)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                    <span className="text-slate-400">50th (Median)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-slate-400">10th (Bad Luck)</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative">
                <PortfolioChart results={results} currency={input.locationPreset.symbol} />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Success Rate</p>
                  <p className={`text-2xl font-black ${results.successRate > 80 ? 'text-green-400' : results.successRate > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {results.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Median Final</p>
                  <p className="text-2xl font-black text-white">
                    {input.locationPreset.symbol}{(results.percentile50[results.percentile50.length - 1].portfolioEnd / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Retirement Year</p>
                  <p className="text-2xl font-black text-indigo-400">
                    {new Date().getFullYear() + (input.retirementAge - input.currentAge)}
                  </p>
                </div>
              </div>
            </section>

            {/* Life Events */}
            <LifeCycleInputs
              events={input.lifeEvents}
              onAdd={addLifeEvent}
              onRemove={removeLifeEvent}
              currency={input.locationPreset.symbol}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireCalculator;
