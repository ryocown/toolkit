
import React, { useState, useEffect, useCallback } from 'react';
import { TaxCalculationResult } from './types';
import { calculateJapaneseTax } from './services/taxService';
import { formatCurrency } from './utils/formatters';
import RsuCalculator from './components/RsuCalculator';
import ResultsDisplay from './components/ResultsDisplay';
import SliderInput from './components/SliderInput';
import { yenToUsd } from './constants';

const App: React.FC = () => {
    const [baseSalary, setBaseSalary] = useState<number>(7000000);
    const [annualRsuValue, setAnnualRsuValue] = useState<number>(0);
    const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);

    const totalIncome = baseSalary + annualRsuValue;

    const recalculateTax = useCallback(() => {
        const result = calculateJapaneseTax(totalIncome);
        setTaxResult(result);
    }, [totalIncome]);

    useEffect(() => {
        recalculateTax();
    }, [recalculateTax]);

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
            <main className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Japan Income Tax & RSU Simulator
                    </h1>
                    <p className="mt-2 text-lg text-slate-400">
                        Estimate your take-home pay with salary and stock options.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Salary Card */}
                        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Annual Salary</h2>
                            <SliderInput
                                label="Base Salary (JPY)"
                                value={baseSalary}
                                min={1000000}
                                max={50000000}
                                step={100000}
                                onChange={setBaseSalary}
                                formatDisplayValue={(val) => `${formatCurrency(val, 'JPY')} / $${formatCurrency(val * yenToUsd, 'USD')}`}
                            />
                        </div>

                        {/* RSU Card */}
                        <RsuCalculator onRsuValueChange={setAnnualRsuValue} />
                    </div>

                    <div className="lg:col-span-3">
                        <ResultsDisplay
                            totalIncome={totalIncome}
                            baseSalary={baseSalary}
                            annualRsuValue={annualRsuValue}
                            taxResult={taxResult}
                        />
                    </div>
                </div>

                <footer className="text-center mt-12 text-slate-500 text-sm">
                    <p>
                        Disclaimer: This is a simplified estimation tool. It does not account for all deductions, credits, or residence tax.
                        Consult a professional tax advisor for accurate financial planning.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default App;
