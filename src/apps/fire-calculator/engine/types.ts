export interface MarketDataPoint {
  year: number;
  return: number;
  cpi: number;
}

export interface LifeEvent {
  id: string;
  name: string;
  amount: number; // Annual cost (positive for expense, negative for income/pension)
  startYear: number;
  endYear: number;
}

export interface SimulationInput {
  initialPortfolio: number;
  annualSpending: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  locationPreset: {
    name: string;
    currencyCode: 'USD' | 'JPY' | 'CNY';
    symbol: string;
    inflation: number;
    taxDrag: number;
  };
  fxRates: {
    USDJPY: number;
    USDCNY: number;
  };
  geoArbitrageMultiplier: number; // Applied to spending in retirement
  lifeEvents: LifeEvent[];
  simulationMode: 'deterministic' | 'historical' | 'monte-carlo';
  deterministicReturn: number;
  panicMode: boolean; // Simulate market crash at retirement
}

export interface YearResult {
  year: number;
  age: number;
  portfolioStart: number;
  portfolioEnd: number;
  spending: number;
  return: number;
  inflation: number;
  isRetirement: boolean;
}

export interface SimulationResult {
  path: YearResult[];
  isSuccess: boolean;
}

export interface AggregateResult {
  percentile10: YearResult[];
  percentile50: YearResult[];
  percentile90: YearResult[];
  successRate: number;
  allPaths?: YearResult[][]; // For "spaghetti" view
}
