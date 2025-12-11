import React from 'react';
import { TaxCalculationResult } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import IncomeBreakdownChart from './IncomeBreakdownChart';
import MarginalTaxRateChart from './MarginalTaxRateChart';
import NetIncomeChart from './NetIncomeChart';

interface ResultsDisplayProps {
    totalIncome: number;
    baseSalary: number;
    annualRsuValue: number;
    taxResult: TaxCalculationResult | null;
    fxRate: number;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ totalIncome, baseSalary, annualRsuValue, taxResult, fxRate }) => {
    if (!taxResult) {
        return (
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <p>Enter your income details to see the tax calculation.</p>
            </div>
        );
    }

    const ResultRow: React.FC<{ label: string; value: string; isPrimary?: boolean; subValue?: string }> = ({ label, value, isPrimary = false, subValue }) => (
        <div className={`flex justify-between items-center py-3 border-b border-slate-700/50 ${isPrimary ? 'text-lg' : ''}`}>
            <span className="text-slate-300">{label}</span>
            <div className="text-right">
                <span className={`${isPrimary ? 'font-bold text-cyan-300' : 'font-medium text-white'}`}>{value}</span>
                {subValue && <span className="block text-xs text-slate-400 font-mono">{subValue}</span>}
            </div>
        </div>
    );

    return (
        <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 h-full">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">Tax Estimation</h2>

            <div className="space-y-2 mb-8">
                <ResultRow
                    label="Gross Annual Income"
                    value={formatCurrency(totalIncome, 'JPY')}
                    subValue={`$${formatCurrency(totalIncome / fxRate, 'USD')}`}
                    isPrimary
                />
                <div className="pl-4 text-sm text-slate-400">
                    <p>Base Salary: {formatCurrency(baseSalary, 'JPY')}</p>
                    <p>Annual RSU Value: {formatCurrency(annualRsuValue, 'JPY')}</p>
                </div>

                <ResultRow label="Estimated Deductions" value={`- ${formatCurrency(taxResult.totalDeductions, 'JPY')}`} />
                <div className="pl-4 text-sm text-slate-400 space-y-1">
                    {taxResult.deductionsBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span>{item.label}</span>
                            <span>{formatCurrency(item.amount, 'JPY')}</span>
                        </div>
                    ))}
                </div>

                <ResultRow label="Taxable Income" value={formatCurrency(taxResult.taxableIncome, 'JPY')} />
            </div>

            <div className="bg-slate-900/50 p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                    <div className="text-slate-300">
                        <p className="text-lg font-semibold">Total Tax</p>
                        <p className="text-xs text-slate-400">Income Tax + Resident Tax</p>
                    </div>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(taxResult.totalTax, 'JPY')}</p>
                </div>

                <div className="border-t border-slate-700 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Income Tax (National)</span>
                        <span className="text-white font-medium">{formatCurrency(taxResult.incomeTax, 'JPY')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Resident Tax (Local)</span>
                        <span className="text-white font-medium">{formatCurrency(taxResult.residentTax, 'JPY')}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                    <p className="text-sm text-green-300">Net Take-Home Pay</p>
                    <p className="text-2xl font-bold text-green-300">{formatCurrency(taxResult.netIncome, 'JPY')}</p>
                    <p className="text-xs text-slate-400 font-mono">${formatCurrency(taxResult.netIncome / fxRate, 'USD')}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                    <p className="text-sm text-yellow-300">Effective Tax Rate</p>
                    <p className="text-2xl font-bold text-yellow-300">{formatPercentage(taxResult.effectiveRate)}</p>
                    <p className="text-xs text-slate-400"> (Tax + Shakai Hoken / Gross)</p>
                </div>
            </div>

            <IncomeBreakdownChart
                grossIncome={totalIncome}
                incomeTax={taxResult.incomeTax}
                residentTax={taxResult.residentTax}
                socialInsurance={taxResult.socialInsurance}
                netIncome={taxResult.netIncome}
            />

            <MarginalTaxRateChart currentGrossIncome={totalIncome} />

            <NetIncomeChart
                currentGrossIncome={totalIncome}
                currentNetIncome={taxResult.netIncome}
            />
        </div>
    );
};

export default ResultsDisplay;