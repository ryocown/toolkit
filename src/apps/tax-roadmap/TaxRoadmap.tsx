import React, { useState, useEffect } from 'react';
import {
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plane,
  Landmark,
  FileText,
  Info,
  Calendar
} from 'lucide-react';

// --- Helper Functions ---

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const getDiffYears = (d1: Date, d2: Date) => {
  return (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

// Timeline boundaries for Gantt Chart (Fixed window for visualization stability)
const TIMELINE_START = new Date('2025-01-01');
const TIMELINE_END = new Date('2033-01-01');
const TIMELINE_TOTAL_MS = TIMELINE_END.getTime() - TIMELINE_START.getTime();

const getPositionPercentage = (date: Date) => {
  const ms = date.getTime() - TIMELINE_START.getTime();
  return Math.max(0, Math.min(100, (ms / TIMELINE_TOTAL_MS) * 100));
};



interface TimelineState {
  currentDate: Date;
  immigrationStatus: 'HSP (Table 1)' | 'PR (Table 2)';
  incomeTaxStatus: 'NPR (Non-Permanent)' | 'Permanent Resident (Global Tax)';
  inheritanceStatus: 'Limited Taxpayer' | 'Unlimited Taxpayer';
  exitTaxClock: number; // Years accumulated
  exitTaxStatus: 'Exempt' | 'Liable';
}

// --- Main Component ---

export default function TaxRoadmap() {
  // --- User Inputs ---
  // Defaulting to User's specific profile
  const [entryDate, setEntryDate] = useState(new Date('2025-03-01'));
  const [prApprovalDate, setPrApprovalDate] = useState(new Date('2027-12-01'));

  // Derived Dates
  const nprEndDate = addMonths(entryDate, 60); // 5 years from entry
  const exitTaxDangerDate = addMonths(prApprovalDate, 60); // 5 years from PR Approval

  // State for the simulation slider (months since entry)
  const [monthsSinceEntry, setMonthsSinceEntry] = useState(0);
  const [simulatedDate, setSimulatedDate] = useState(entryDate);

  // Sync simulated date with slider
  useEffect(() => {
    const newDate = addMonths(entryDate, monthsSinceEntry);
    setSimulatedDate(newDate);
  }, [monthsSinceEntry, entryDate]);

  // --- Logic Engine ---

  const calculateState = (date: Date): TimelineState => {
    // PR Status logic: triggers on APPROVAL, not application
    const isPR = date >= prApprovalDate;

    // NPR Status logic: strictly 5 years from ENTRY, regardless of visa status
    const isNPR = date < nprEndDate;

    // Inheritance Tax: 
    // While on Table 1 (HSP), you are Limited (if <10 yrs).
    // Moment you get Table 2 (PR), you become Unlimited (since you are a resident).
    const inheritanceStatus = isPR ? 'Unlimited Taxpayer' : 'Limited Taxpayer';

    // Exit Tax: 
    // Clock starts ONLY when you hold Table 2 (PR).
    // HSP time does not count.
    let exitTaxClock = 0;
    if (isPR) {
      exitTaxClock = getDiffYears(date, prApprovalDate);
    }
    const exitTaxStatus = exitTaxClock >= 5 ? 'Liable' : 'Exempt';

    return {
      currentDate: date,
      immigrationStatus: isPR ? 'PR (Table 2)' : 'HSP (Table 1)',
      incomeTaxStatus: isNPR ? 'NPR (Non-Permanent)' : 'Permanent Resident (Global Tax)',
      inheritanceStatus,
      exitTaxClock,
      exitTaxStatus
    };
  };

  const state = calculateState(simulatedDate);
  const currentPos = getPositionPercentage(simulatedDate);

  // --- Render Helpers ---

  const handleEntryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime())) setEntryDate(d);
  };

  const handlePrDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime())) setPrApprovalDate(d);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-800">

      {/* Header & Controls */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Tax Roadmap</h1>
            <p className="text-slate-500">Strategic Compliance & Asset Defense Dashboard</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Simulated Date</div>
              <div className="text-lg font-mono font-bold text-indigo-900">{formatDate(simulatedDate)}</div>
            </div>
          </div>
        </div>

        {/* Date Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date of Entry (HSP)
            </label>
            <input
              type="date"
              value={formatDateForInput(entryDate)}
              onChange={handleEntryDateChange}
              className="p-2 border border-slate-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
              <CheckCircle className="w-3 h-3" /> PR Approval Date (Table 2)
            </label>
            <input
              type="date"
              value={formatDateForInput(prApprovalDate)}
              onChange={handlePrDateChange}
              className="p-2 border border-slate-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-[10px] text-slate-400">Est. 12-18 months after application</span>
          </div>
        </div>
      </div>

      {/* Simulation Slider */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-4 flex justify-between">
          <span>Timeline Simulation</span>
          <span className="text-indigo-600 font-semibold">Drag to travel through time</span>
        </label>
        <input
          type="range"
          min="0"
          max="96" // 8 years (up to 2033)
          value={monthsSinceEntry}
          onChange={(e) => setMonthsSinceEntry(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
          <span>Entry ({formatDate(entryDate)})</span>
          <span>PR Approval ({formatDate(prApprovalDate)})</span>
          <span>NPR End ({formatDate(nprEndDate)})</span>
        </div>
      </div>

      {/* The Three Clocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Clock 1: Immigration & Inheritance */}
        <div className={`rounded-xl p-5 border-2 transition-all ${state.immigrationStatus === 'PR (Table 2)' ? 'bg-white border-indigo-100 ring-4 ring-indigo-50/50' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clock 1</span>
          </div>
          <h3 className="text-lg font-bold mb-1">Inheritance Shield</h3>
          <div className="text-sm text-slate-500 mb-4">Asset Transfer Strategy</div>

          <div className={`mb-4 p-3 rounded-lg border text-sm font-bold flex justify-between items-center ${state.inheritanceStatus === 'Limited Taxpayer'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
            <span>{state.inheritanceStatus}</span>
            {state.inheritanceStatus === 'Limited Taxpayer' ? <Shield className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Visa Status:</span>
              <span className="font-medium">{state.immigrationStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">China Asset Tax:</span>
              <span className={`font-medium ${state.inheritanceStatus === 'Unlimited Taxpayer' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {state.inheritanceStatus === 'Unlimited Taxpayer' ? '~55% (Global)' : '0% (Foreign)'}
              </span>
            </div>
          </div>
        </div>

        {/* Clock 2: Income Tax (NPR) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clock 2</span>
          </div>
          <h3 className="text-lg font-bold mb-1">Income Tax Shield</h3>
          <div className="text-sm text-slate-500 mb-4">Remittance Strategy</div>

          <div className={`mb-4 p-3 rounded-lg border text-sm font-bold flex justify-between items-center ${state.incomeTaxStatus.includes('NPR')
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-orange-50 text-orange-700 border-orange-100'
            }`}>
            <span>{state.incomeTaxStatus.split(' ')[0]} Status</span>
            {state.incomeTaxStatus.includes('NPR') ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full ${state.incomeTaxStatus.includes('NPR') ? 'bg-purple-500' : 'bg-slate-400'}`}
              style={{ width: `${Math.min(((simulatedDate.getTime() - entryDate.getTime()) / (nprEndDate.getTime() - entryDate.getTime())) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 text-right mb-3">
            {state.incomeTaxStatus.includes('NPR') ? 'Cliff: March 2030' : 'Shield Expired'}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Foreign Gains:</span>
              <span className="font-medium">
                {state.incomeTaxStatus.includes('NPR') ? 'Tax-Free (If kept offshore)' : 'Taxable (Global)'}
              </span>
            </div>
          </div>
        </div>

        {/* Clock 3: Exit Tax */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Plane className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clock 3</span>
          </div>
          <h3 className="text-lg font-bold mb-1">Exit Tax Trap</h3>
          <div className="text-sm text-slate-500 mb-4">100M+ JPY Assets</div>

          <div className={`mb-4 p-3 rounded-lg border text-sm font-bold flex justify-between items-center ${state.exitTaxStatus === 'Exempt'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
            <span>{state.exitTaxStatus}</span>
            <span className="text-xs font-normal opacity-80">
              {state.exitTaxStatus === 'Exempt' ? 'Table 1 Visa' : 'Table 2 (PR) > 5y'}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 relative">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${state.exitTaxStatus === 'Liable' ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min((state.exitTaxClock / 5) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 text-right mb-3">
            {state.exitTaxClock > 0 ? `${state.exitTaxClock.toFixed(1)} / 5.0 Years on PR` : 'Clock Paused (HSP)'}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Unrealized Gains:</span>
              <span className="font-medium">
                {state.exitTaxStatus === 'Exempt' ? '0% Tax' : '15.315% Tax upon Departure'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Action Items Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Current Tactical Imperatives</h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-1 rounded">
            {formatDate(simulatedDate)} Context
          </span>
        </div>
        <div className="p-6">

          {/* Scenario 1: Pre-PR Approval */}
          {!state.immigrationStatus.includes('PR') && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div></div>
                <div>
                  <h4 className="font-bold text-rose-700">CRITICAL: Execute China Asset Transfer</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    You are waiting for PR Approval (est. {formatDate(prApprovalDate)}). You must complete the title transfer of the inheritance <strong>BEFORE</strong> approval.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div></div>
                <div>
                  <h4 className="font-bold text-indigo-700">Reporting Status</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    You are currently exempt from Exit Tax. Monitor your income for the "Property & Debt Report" trigger.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scenario 2: Post-PR, Pre-NPR End (The Golden Window) */}
          {state.immigrationStatus.includes('PR') && state.incomeTaxStatus.includes('NPR') && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div></div>
                <div>
                  <h4 className="font-bold text-emerald-800">LIQUIDATION WINDOW OPEN</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    You have PR (Secure immigration) but remain an NPR Taxpayer until {formatDate(nprEndDate)}.
                    <strong> Sell the China Property NOW.</strong> Do not remit proceeds.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div></div>
                <div>
                  <h4 className="font-bold text-amber-700">Exit Tax Accumulation Started</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Your Exit Tax clock started on {formatDate(prApprovalDate)}. You are safe to leave Japan tax-free until approx <strong>{formatDate(exitTaxDangerDate)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scenario 3: Post-NPR End */}
          {!state.incomeTaxStatus.includes('NPR') && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div></div>
                <div>
                  <h4 className="font-bold text-rose-700">Global Tax Dragnet Active</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Your NPR status expired on {formatDate(nprEndDate)}. All global capital gains are now fully taxable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gantt Chart Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-6">Strategic Timeline View</h3>

        <div className="relative min-w-[600px] h-64 select-none">

          {/* Overlay Container: Matches the LEFT position of the bars (ml-24) */}
          <div className="absolute top-0 bottom-0 right-0 left-24">
            {/* Vertical Current Time Indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              style={{ left: `${currentPos}%` }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                YOU
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute top-0 w-full flex justify-between text-xs text-slate-400 font-mono">
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032].map(year => (
                <span key={year} style={{ left: `${getPositionPercentage(new Date(`${year}-01-01`))}%`, position: 'absolute' }}>{year}</span>
              ))}
            </div>

            {/* Key Markers */}
            <div className="absolute top-6 bottom-0 w-px border-l border-dashed border-slate-300 z-10" style={{ left: `${getPositionPercentage(prApprovalDate)}%` }}>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 bg-white px-1">PR</div>
            </div>
            <div className="absolute top-6 bottom-0 w-px border-l border-dashed border-slate-300 z-10" style={{ left: `${getPositionPercentage(nprEndDate)}%` }}>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-600 bg-white px-1">NPR End</div>
            </div>
          </div>

          {/* Rows */}
          <div className="mt-6 space-y-6">

            {/* Immigration Track */}
            <div className="relative h-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 w-24">Visa Status</div>
              <div className="ml-24 h-6 relative bg-slate-100 rounded-md overflow-hidden flex text-[10px] font-bold text-white uppercase tracking-wider">
                <div
                  className="bg-blue-400 flex items-center justify-center border-r border-white/20"
                  style={{ width: `${getPositionPercentage(prApprovalDate)}%` }}
                >
                  HSP (Table 1)
                </div>
                <div
                  className="bg-indigo-600 flex items-center justify-center"
                  style={{ width: `${100 - getPositionPercentage(prApprovalDate)}%` }}
                >
                  Permanent Res (Table 2)
                </div>
              </div>
            </div>

            {/* Inheritance Track */}
            <div className="relative h-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 w-24">Inheritance</div>
              <div className="ml-24 h-6 relative bg-slate-100 rounded-md overflow-hidden flex text-[10px] font-bold text-white uppercase tracking-wider">
                <div
                  className="bg-emerald-500 flex items-center justify-center border-r border-white/20"
                  style={{ width: `${getPositionPercentage(prApprovalDate)}%` }}
                >
                  Limited (Safe)
                </div>
                <div
                  className="bg-rose-500 flex items-center justify-center"
                  style={{ width: `${100 - getPositionPercentage(prApprovalDate)}%` }}
                >
                  Unlimited (Global Tax)
                </div>
              </div>
            </div>

            {/* Income Tax Track */}
            <div className="relative h-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 w-24">Income Tax</div>
              <div className="ml-24 h-6 relative bg-slate-100 rounded-md overflow-hidden flex text-[10px] font-bold text-white uppercase tracking-wider">
                <div
                  className="bg-emerald-500 flex items-center justify-center border-r border-white/20"
                  style={{ width: `${getPositionPercentage(nprEndDate)}%` }}
                >
                  NPR (Remittance Only)
                </div>
                <div
                  className="bg-rose-500 flex items-center justify-center"
                  style={{ width: `${100 - getPositionPercentage(nprEndDate)}%` }}
                >
                  Global Tax
                </div>
              </div>
            </div>

            {/* Exit Tax Track */}
            <div className="relative h-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 w-24">Exit Tax</div>
              <div className="ml-24 h-6 relative bg-slate-100 rounded-md overflow-hidden flex text-[10px] font-bold text-white uppercase tracking-wider">
                <div
                  className="bg-emerald-500 flex items-center justify-center border-r border-white/20"
                  style={{ width: `${getPositionPercentage(prApprovalDate)}%` }}
                >
                  Exempt
                </div>
                <div
                  className="bg-amber-400 flex items-center justify-center border-r border-white/20 text-amber-900"
                  style={{ width: `${getPositionPercentage(exitTaxDangerDate) - getPositionPercentage(prApprovalDate)}%` }}
                >
                  Accumulating
                </div>
                <div
                  className="bg-rose-500 flex items-center justify-center"
                  style={{ width: `${100 - getPositionPercentage(exitTaxDangerDate)}%` }}
                >
                  Liable
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}