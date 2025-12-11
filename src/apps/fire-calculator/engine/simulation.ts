import { MarketDataPoint, SimulationInput, YearResult, AggregateResult } from './types';
import marketDataRaw from '../data/market_data.json';

const marketData: MarketDataPoint[] = marketDataRaw;

export function runSimulation(input: SimulationInput): AggregateResult {
  switch (input.simulationMode) {
    case 'deterministic':
      return runDeterministic(input);
    case 'historical':
      return runHistorical(input);
    case 'monte-carlo':
      return runMonteCarlo(input);
    default:
      return runDeterministic(input);
  }
}

function runDeterministic(input: SimulationInput): AggregateResult {
  const path = simulatePath(input, () => ({
    return: input.deterministicReturn / 100,
    inflation: input.locationPreset.inflation / 100
  }));

  return {
    percentile10: path,
    percentile50: path,
    percentile90: path,
    successRate: path[path.length - 1].portfolioEnd > 0 ? 100 : 0
  };
}

function runHistorical(input: SimulationInput): AggregateResult {
  const paths: YearResult[][] = [];

  // Generate a path starting from each year in our historical data
  // If the simulation duration is longer than our data, we wrap around.
  for (let i = 0; i < marketData.length; i++) {
    let currentIdx = i;
    const path = simulatePath(input, () => {
      const data = marketData[currentIdx % marketData.length];
      currentIdx++;
      return {
        return: data.return,
        inflation: data.cpi
      };
    });
    paths.push(path);
  }

  return aggregatePaths(paths);
}

function runMonteCarlo(input: SimulationInput, iterations: number = 1000): AggregateResult {
  const paths: YearResult[][] = [];

  // Calculate mean and std dev from historical data
  const returns = marketData.map(d => d.return);
  const cpis = marketData.map(d => d.cpi);

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDevReturn = Math.sqrt(returns.map(x => Math.pow(x - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);

  const meanCpi = cpis.reduce((a, b) => a + b, 0) / cpis.length;
  const stdDevCpi = Math.sqrt(cpis.map(x => Math.pow(x - meanCpi, 2)).reduce((a, b) => a + b, 0) / cpis.length);

  for (let i = 0; i < iterations; i++) {
    const path = simulatePath(input, () => ({
      return: normalRandom(meanReturn, stdDevReturn),
      inflation: normalRandom(meanCpi, stdDevCpi)
    }));
    paths.push(path);
  }

  return aggregatePaths(paths);
}

function simulatePath(
  input: SimulationInput,
  getNextMarket: (yearIdx: number) => { return: number; inflation: number }
): YearResult[] {
  const path: YearResult[] = [];
  let currentPortfolio = input.initialPortfolio;
  let currentSpending = input.annualSpending;
  const startYear = new Date().getFullYear();
  const duration = input.lifeExpectancy - input.currentAge;

  for (let i = 0; i <= duration; i++) {
    const age = input.currentAge + i;
    const year = startYear + i;
    const isRetirement = age >= input.retirementAge;

    const market = getNextMarket(i);
    let annualReturn = market.return;
    let annualInflation = market.inflation;

    // Panic Mode: Sequence of Returns Risk
    if (input.panicMode && age >= input.retirementAge && age < input.retirementAge + 3) {
      const panicReturns = [-0.15, -0.20, -0.10];
      annualReturn = panicReturns[age - input.retirementAge];
    }

    // Apply tax drag
    const effectiveReturn = annualReturn * (1 - input.locationPreset.taxDrag / 100);

    // Calculate spending for this year
    let spendingThisYear = currentSpending;
    if (isRetirement) {
      spendingThisYear = (currentSpending / input.geoArbitrageMultiplier);
    }

    // Add life events
    const activeEvents = input.lifeEvents.filter(e => year >= e.startYear && year <= e.endYear);
    const eventsTotal = activeEvents.reduce((sum, e) => sum + e.amount, 0);
    spendingThisYear += eventsTotal;

    const portfolioStart = currentPortfolio;

    // Simple logic: return happens, then spending happens at end of year
    // Or spending happens, then return on remaining. Let's do: return on start, then subtract spending.
    currentPortfolio = currentPortfolio * (1 + effectiveReturn) - spendingThisYear;

    if (currentPortfolio < 0) currentPortfolio = 0;

    path.push({
      year,
      age,
      portfolioStart,
      portfolioEnd: currentPortfolio,
      spending: spendingThisYear,
      return: annualReturn,
      inflation: annualInflation,
      isRetirement
    });

    // Update spending for next year based on inflation
    currentSpending = currentSpending * (1 + annualInflation);
  }

  return path;
}

function aggregatePaths(paths: YearResult[][]): AggregateResult {
  if (paths.length === 0) {
    return {
      percentile10: [],
      percentile50: [],
      percentile90: [],
      successRate: 0
    };
  }
  const numPaths = paths.length;
  const duration = paths[0].length;
  const successCount = paths.filter(p => p[p.length - 1].portfolioEnd > 0).length;

  const getPercentilePath = (percentile: number): YearResult[] => {
    const resultPath: YearResult[] = [];
    for (let t = 0; t < duration; t++) {
      const valuesAtT = paths.map(p => p[t].portfolioEnd).sort((a, b) => a - b);
      const index = Math.floor(percentile * (numPaths - 1));
      const portfolioEnd = valuesAtT[index];

      // Find a path that is close to this value to get representative market data
      // For simplicity, we'll just take the average market data or similar
      // But for the chart, the portfolio value is what matters most.
      resultPath.push({
        ...paths[0][t], // Copy metadata from first path
        portfolioEnd
      });
    }
    return resultPath;
  };

  return {
    percentile10: getPercentilePath(0.1),
    percentile50: getPercentilePath(0.5),
    percentile90: getPercentilePath(0.9),
    successRate: (successCount / numPaths) * 100,
    allPaths: paths.length <= 100 ? paths : undefined // Only include all paths if small enough
  };
}

// Box-Muller transform for normal distribution
function normalRandom(mean: number, stdDev: number): number {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}
