import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, RefreshCw, Activity, TrendingUp, TrendingDown, Scale, BarChart3 } from 'lucide-react';
import { AlphaVantageService } from './services/AlphaVantageService';

export const API_CONFIG = {
  alphaVantage: 'https://www.alphavantage.co/query',
  alphaVantageKey: 'IKRSNGLSBFQBWNNV' // yes i know, and no i dont care, its a free key bro
};

// --- TYPES ---
interface MetricState {
  value: number;
  change?: number;
  trend: 'up' | 'down' | 'flat';
  history?: any[];
  isReal: boolean;
  symbol?: string;
  note?: string;
  status?: 'good' | 'warning' | 'danger';
}

// --- COMPONENT ---

export default function MacroDashboard() {
  const [loading, setLoading] = useState(true);
  const [fetchStatus, setFetchStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Dashboard State
  const [metrics, setMetrics] = useState<{
    spy: MetricState;
    yield10y: MetricState;
    yield2y: MetricState;
    unemployment: MetricState;
    inflation: MetricState;
  }>({
    spy: { value: 0, trend: 'flat', isReal: false, symbol: 'SPY' },
    yield10y: { value: 0, trend: 'flat', isReal: false },
    yield2y: { value: 0, trend: 'flat', isReal: false },
    unemployment: { value: 0, trend: 'flat', isReal: false },
    inflation: { value: 0, trend: 'flat', isReal: false }
  });

  const hasFetched = useRef(false);

  // Load Data Effect
  useEffect(() => {
    const loadData = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      setLoading(true);

      try {
        const apiKey = API_CONFIG.alphaVantageKey;

        // 1. Fetch Stock Data
        const stockSeries = await AlphaVantageService.getDailySeries('SPY', apiKey, setFetchStatus);
        const stockPoints = Object.entries(stockSeries).map(([date, values]: [string, any]) => ({
          time: date.substring(5),
          value: parseFloat(values["4. close"])
        })).reverse().slice(-50); // Get last 50 days for MA calc

        const currentSpy = stockPoints[stockPoints.length - 1].value;
        const prevSpy = stockPoints[stockPoints.length - 2].value;
        const ma50 = stockPoints.reduce((sum, p) => sum + p.value, 0) / stockPoints.length;

        // 2. Fetch Yields (Sequentially)
        const yield10yData = await AlphaVantageService.getTreasuryYield('10year', apiKey, setFetchStatus);
        const yield2yData = await AlphaVantageService.getTreasuryYield('2year', apiKey, setFetchStatus);

        const current10y = parseFloat(yield10yData[0].value);
        const current2y = parseFloat(yield2yData[0].value);

        // 3. Fetch Econ Data (Sequentially)
        const unempData = await AlphaVantageService.getEconomicIndicator('UNEMPLOYMENT', apiKey, setFetchStatus);
        const cpiData = await AlphaVantageService.getEconomicIndicator('CPI', apiKey, setFetchStatus);

        const currentUnemp = parseFloat(unempData[0].value);
        // Sahm Rule: Current 3-month avg vs lowest 3-month avg in last 12 months
        // Simplified Proxy: Current vs Min of last 12 months
        const last12Unemp = unempData.slice(0, 12).map((d: any) => parseFloat(d.value));
        const minUnemp = Math.min(...last12Unemp);
        const sahmIndicator = currentUnemp - minUnemp;

        const currentCpi = parseFloat(cpiData[0].value);
        // Calculate YoY Inflation roughly if not provided directly, but CPI is usually Index
        // If CPI is index, we need % change. Alpha Vantage CPI is usually the index value.
        // Let's assume we need to calculate % change if it's an index, or it might be pre-calculated.
        // Checking docs: CPI is usually the index. We need YoY % change.
        // Actually, let's look at 12 months ago.
        const cpi12MonthsAgo = parseFloat(cpiData[12]?.value || cpiData[cpiData.length - 1].value);
        const inflationRate = ((currentCpi - cpi12MonthsAgo) / cpi12MonthsAgo) * 100;

        setMetrics({
          spy: {
            value: currentSpy,
            change: ((currentSpy - prevSpy) / prevSpy) * 100,
            trend: currentSpy > ma50 ? 'up' : 'down',
            history: stockPoints.slice(-20), // Show last 20 on chart
            isReal: true,
            symbol: 'SPY',
            note: currentSpy > ma50 ? 'Above 50d MA' : 'Below 50d MA'
          },
          yield10y: { value: current10y, trend: 'flat', isReal: true },
          yield2y: { value: current2y, trend: 'flat', isReal: true },
          unemployment: {
            value: currentUnemp,
            trend: sahmIndicator >= 0.5 ? 'up' : 'flat',
            isReal: true,
            note: `Sahm Proxy: +${sahmIndicator.toFixed(1)}%`,
            status: sahmIndicator >= 0.5 ? 'danger' : 'good'
          },
          inflation: {
            value: inflationRate,
            trend: inflationRate > 3 ? 'up' : 'down',
            isReal: true,
            note: `CPI Index: ${currentCpi}`,
            status: inflationRate > 3 ? 'warning' : 'good'
          }
        });
        setFetchStatus('All data up to date');
      } catch (error) {
        console.error("Dashboard Data Error:", error);
        setFetchStatus('Error updating data');
      } finally {
        setLoading(false);
        setLastUpdated(new Date());
      }
    };

    loadData();
    // Refresh interval (cache will handle rate limits)
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- SCENARIO LOGIC ---
  const determineScenario = () => {
    const { yield10y, yield2y, unemployment, inflation, spy } = metrics;

    // 1. Yield Curve Inversion
    const yieldCurve = yield10y.value - yield2y.value;
    const isInverted = yieldCurve < 0;

    // 2. Sahm Rule (Recession Indicator)
    const isRecession = unemployment.status === 'danger';

    // 3. Inflation
    const isHighInflation = inflation.value > 3.5;

    // 4. Market Trend
    const isBearMarket = spy.trend === 'down';

    if (isRecession && isHighInflation) return { name: 'STAGFLATION', color: 'text-purple-500', desc: 'High inflation + rising unemployment. Worst case scenario.' };
    if (isRecession) return { name: 'RECESSION', color: 'text-red-500', desc: 'Sahm rule triggered. Economic contraction likely.' };
    if (isInverted) return { name: 'WARNING', color: 'text-orange-500', desc: 'Yield curve inverted. Recession signal flashing.' };
    if (isHighInflation) return { name: 'OVERHEATING', color: 'text-yellow-500', desc: 'Inflation remains sticky. Rates may stay high.' };
    if (isBearMarket) return { name: 'CORRECTION', color: 'text-blue-400', desc: 'Market trend is negative, but fundamentals are okay.' };

    return { name: 'EXPANSION', color: 'text-green-500', desc: 'Goldilocks zone. Growth intact with stable inflation.' };
  };

  const scenario = determineScenario();
  const yieldCurveValue = metrics.yield10y.value - metrics.yield2y.value;

  // --- SUB-COMPONENTS ---

  const MetricCard = ({ title, value, subtext, trend, prefix = '', suffix = '', status = 'good' }: {
    title: string;
    value: number;
    subtext?: string;
    trend: 'up' | 'down' | 'flat';
    prefix?: string;
    suffix?: string;
    status?: 'good' | 'warning' | 'danger';
  }) => {
    const TrendIcon = trend === 'up' ? TrendingUp : (trend === 'down' ? TrendingDown : Activity);
    const statusColors = {
      good: 'border-slate-200 bg-white',
      warning: 'border-yellow-400 bg-yellow-50',
      danger: 'border-red-500 bg-red-50'
    };
    const trendColors = {
      good: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };

    return (
      <div className={`p-4 rounded-xl border ${statusColors[status]} shadow-sm transition-all hover:shadow-md`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          {status === 'danger' && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold text-slate-800">
            {prefix}{value.toFixed(2)}{suffix}
          </h2>
          <span className={`text-xs font-medium flex items-center ${trendColors[status]}`}>
            <TrendIcon className="w-3 h-3 mr-1" />
            {subtext}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Macro Outlook</h1>
            <p className="text-slate-500 mt-1">Real-time economic regime detection</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium text-slate-600">
              {fetchStatus || (metrics.spy.isReal ? 'Live Data (Alpha Vantage)' : 'Connecting...')}
            </span>
            <span className="text-xs text-slate-400">| Last: {lastUpdated.toLocaleTimeString()}</span>
            <button onClick={() => window.location.reload()} className="p-1 hover:bg-slate-100 rounded-full">
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* TOP LEVEL STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SCENARIO INDICATOR */}
          <div className="md:col-span-2 bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="z-10">
              <h3 className="text-indigo-200 font-medium mb-1">Detected Regime</h3>
              <div className="flex items-center gap-3">
                <span className={`text-3xl md:text-5xl font-bold ${scenario.color}`}>{scenario.name}</span>
              </div>
              <p className="text-slate-400 mt-2 max-w-md">{scenario.desc}</p>
            </div>
            <div className="hidden md:block z-10 text-right">
              <div className="text-2xl font-mono">{metrics.spy.value.toFixed(2)}</div>
              <div className={`text-sm ${metrics.spy.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.spy.note}
              </div>
            </div>
          </div>

          {/* SPY MINI CHART */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> {metrics.spy.symbol}
              </span>
              <span className={metrics.spy.trend === 'up' ? 'text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold' : 'text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold'}>
                {metrics.spy.change ? (metrics.spy.change > 0 ? '+' : '') + metrics.spy.change.toFixed(2) : '0.00'}%
              </span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.spy.history}>
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ display: 'none' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* METRIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Yield Curve (10Y-2Y)"
            value={yieldCurveValue}
            prefix=""
            suffix="%"
            subtext={yieldCurveValue < 0 ? "Inverted (Recession Risk)" : "Normal"}
            trend={yieldCurveValue < 0 ? 'down' : 'up'}
            status={yieldCurveValue < 0 ? 'danger' : 'good'}
          />
          <MetricCard
            title="10-Year Yield"
            value={metrics.yield10y.value}
            prefix=""
            suffix="%"
            subtext="Risk Free Rate"
            trend="flat"
          />
          <MetricCard
            title="Unemployment"
            value={metrics.unemployment.value}
            prefix=""
            suffix="%"
            subtext={metrics.unemployment.note}
            trend={metrics.unemployment.trend}
            status={metrics.unemployment.status}
          />
          <MetricCard
            title="Inflation (YoY)"
            value={metrics.inflation.value}
            prefix=""
            suffix="%"
            subtext={metrics.inflation.note}
            trend={metrics.inflation.trend}
            status={metrics.inflation.status}
          />
        </div>

        {/* ANALYSIS PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-slate-500" />
              Fundamental Analysis
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span>Sahm Rule Status</span>
                <span className={`font-bold ${metrics.unemployment.status === 'danger' ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.unemployment.status === 'danger' ? 'TRIGGERED' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span>Yield Curve Signal</span>
                <span className={`font-bold ${yieldCurveValue < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {yieldCurveValue < 0 ? 'RECESSION WARNING' : 'Expansionary'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span>Inflation Trend</span>
                <span className={`font-bold ${metrics.inflation.value > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {metrics.inflation.value > 3 ? 'Elevated' : 'Controlled'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Context
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              The dashboard combines leading indicators (Yield Curve, Stock Market) with lagging indicators (Unemployment, Inflation) to assess the current economic regime.
            </p>
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100">
              <strong>Note:</strong> Data is cached for 1 hour to preserve API limits. If data seems stale, wait or clear local storage.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}