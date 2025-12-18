import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TaxRoadmap from './apps/tax-roadmap/TaxRoadmap';
import JapanTaxCalculator from './apps/japan-income-tax-calculator/TaxCalculator';
import FireCalculator from './apps/fire-calculator/FireCalculator';
import SynodPanel from './apps/ai-panel/SynodPanel';
import MacroDashboard from './apps/macro-dashboard';
import LandingPage from './LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tax-roadmap" element={<TaxRoadmap />} />
        <Route path="/japan-tax-calculator" element={<JapanTaxCalculator />} />
        <Route path="/fire-calculator" element={<FireCalculator />} />
        <Route path="/synod-ai" element={<SynodPanel />} />
        <Route path="/macro-dashboard" element={<MacroDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
