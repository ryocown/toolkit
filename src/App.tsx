import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TaxRoadmap from './apps/tax-roadmap/TaxRoadmap';
import JapanTaxCalculator from './apps/japan-income-tax-calculator/TaxCalculator';
import LandingPage from './LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tax-roadmap" element={<TaxRoadmap />} />
        <Route path="/japan-tax-calculator" element={<JapanTaxCalculator />} />
      </Routes>
    </Router>
  );
}

export default App;
