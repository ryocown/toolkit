import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface IncomeBreakdownChartProps {
    grossIncome: number;
    totalTax: number;
    netIncome: number;
}

const ChartBar: React.FC<{
    value: number;
    maxValue: number;
    label: string;
    color: string;
    currency: 'JPY';
}> = ({ value, maxValue, label, color, currency }) => {
    const percentageHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const percentageOfTotal = maxValue > 0 ? value / maxValue : 0;

    return (
        <div className="flex flex-col items-center h-full justify-end" style={{ height: '250px' }}>
            <div className="text-center text-xs mb-2">
                <p className="font-bold text-white">{formatCurrency(value, currency)}</p>
                <p className="font-mono text-slate-400">{formatPercentage(percentageOfTotal)}</p>
            </div>
            <div
                className={`w-12 sm:w-16 rounded-t-md transition-all duration-700 ease-out ${color}`}
                style={{ height: `${percentageHeight}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-label={label}
            >
                <span className="sr-only">{label}: {formatCurrency(value, currency)}</span>
            </div>
            <div className="mt-2 text-sm text-slate-300 font-semibold">{label}</div>
        </div>
    );
};

const IncomeBreakdownChart: React.FC<IncomeBreakdownChartProps> = ({ grossIncome, totalTax, netIncome }) => {
    if (grossIncome <= 0) {
        return null;
    }

    return (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
            <h3 className="text-xl font-semibold mb-6 text-center text-slate-300">Income Breakdown Visualization</h3>
            <div className="flex justify-around items-end h-[320px] bg-slate-900/50 p-4 rounded-lg">
                <ChartBar
                    label="Gross"
                    value={grossIncome}
                    maxValue={grossIncome}
                    color="bg-cyan-500"
                    currency="JPY"
                />
                <ChartBar
                    label="Tax"
                    value={totalTax}
                    maxValue={grossIncome}
                    color="bg-red-500"
                    currency="JPY"
                />
                <ChartBar
                    label="Net"
                    value={netIncome}
                    maxValue={grossIncome}
                    color="bg-green-500"
                    currency="JPY"
                />
            </div>
        </div>
    );
};

export default IncomeBreakdownChart;