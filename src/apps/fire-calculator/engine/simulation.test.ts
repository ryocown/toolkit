import { runSimulation } from './simulation';
import { SimulationInput } from './types';

// Mock market data is not needed as we use the real one for simplicity in this sandbox
// But we can test the deterministic mode easily.

const mockInput: SimulationInput = {
  initialPortfolio: 1000000,
  annualSpending: 40000,
  currentAge: 30,
  retirementAge: 40,
  lifeExpectancy: 50,
  locationPreset: {
    name: 'USA',
    currencyCode: 'USD',
    symbol: '$',
    inflation: 0,
    taxDrag: 0
  },
  fxRates: {
    USDJPY: 156,
    USDCNY: 7
  },
  geoArbitrageMultiplier: 1.0,
  lifeEvents: [],
  simulationMode: 'deterministic',
  deterministicReturn: 0,
  panicMode: false
};

function testDeterministic() {
  console.log('Running Deterministic Test...');
  const results = runSimulation(mockInput);
  const finalPortfolio = results.percentile50[results.percentile50.length - 1].portfolioEnd;

  // 20 years total (30 to 50)
  // 40k spending per year
  // 1M start
  // 0% return, 0% inflation
  // Expected: 1M - (21 years * 40k) = 1M - 840k = 160k
  // Wait, the loop is for i=0 to duration (50-30=20). So 21 iterations.

  console.log(`Final Portfolio: ${finalPortfolio}`);
  if (finalPortfolio === 160000) {
    console.log('✅ Deterministic Test Passed');
  } else {
    console.log('❌ Deterministic Test Failed');
  }
}

// Run tests if this script is executed directly
// Since we are in a browser environment, we'll just export it or run it in a node-like environment if possible.
// For this sandbox, we'll just keep it as a reference or run it via a simple command if the environment allows.
testDeterministic();
