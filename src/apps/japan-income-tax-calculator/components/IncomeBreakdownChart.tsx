import React from 'react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface IncomeBreakdownChartProps {
    grossIncome: number;
    incomeTax: number;
    residentTax: number;
    socialInsurance: number;
    netIncome: number;
}

const StackedChartBar: React.FC<{
    segments: { value: number; label: string; color: string }[];
    maxValue: number;
    label: string;
    currency: 'JPY';
}> = ({ segments, maxValue, label, currency }) => {
    const totalValue = segments.reduce((sum, s) => sum + s.value, 0);
    const percentageHeight = maxValue > 0 ? (totalValue / maxValue) * 100 : 0;
    const percentageOfTotal = maxValue > 0 ? totalValue / maxValue : 0;

    return (
        <div className="flex flex-col items-center h-full justify-end" style={{ height: '250px' }}>
            <div className="text-center text-xs mb-2">
                <p className="font-bold text-white">{formatCurrency(totalValue, currency)}</p>
                <p className="font-mono text-slate-400">{formatPercentage(percentageOfTotal)}</p>
            </div>
            <div
                className="w-12 sm:w-16 rounded-t-md transition-all duration-700 ease-out overflow-hidden flex flex-col-reverse"
                style={{ height: `${percentageHeight}%` }}
            >
                {segments.map((segment, idx) => {
                    const segmentHeight = totalValue > 0 ? (segment.value / totalValue) * 100 : 0;
                    return (
                        <div
                            key={idx}
                            className={`${segment.color} w-full transition-all duration-700`}
                            style={{ height: `${segmentHeight}%` }}
                            title={`${segment.label}: ${formatCurrency(segment.value, currency)}`}
                        />
                    );
                })}
            </div>
            <div className="mt-2 text-sm text-slate-300 font-semibold">{label}</div>
        </div>
    );
};

const IncomeBreakdownChart: React.FC<IncomeBreakdownChartProps> = ({
    grossIncome,
    incomeTax,
    residentTax,
    socialInsurance,
    netIncome
}) => {
    if (grossIncome <= 0) {
        return null;
    }

    return (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
            <h3 className="text-xl font-semibold mb-6 text-center text-slate-300">Income Breakdown Visualization</h3>
            <div className="flex justify-around items-end h-[320px] bg-slate-900/50 p-4 rounded-lg">
                <StackedChartBar
                    label="Gross"
                    segments={[{ value: grossIncome, label: 'Gross Income', color: 'bg-cyan-500' }]}
                    maxValue={grossIncome}
                    currency="JPY"
                />
                <StackedChartBar
                    label="Deductions"
                    segments={[
                        { value: socialInsurance, label: 'Social Insurance', color: 'bg-indigo-500' }
                    ]}
                    maxValue={grossIncome}
                    currency="JPY"
                />
                <StackedChartBar
                    label="Tax"
                    segments={[
                        { value: residentTax, label: 'Resident Tax', color: 'bg-orange-500' },
                        { value: incomeTax, label: 'Income Tax', color: 'bg-red-500' }
                    ]}
                    maxValue={grossIncome}
                    currency="JPY"
                />
                <StackedChartBar
                    label="Net"
                    segments={[{ value: netIncome, label: 'Net Income', color: 'bg-green-500' }]}
                    maxValue={grossIncome}
                    currency="JPY"
                />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div> Gross</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Shakai Hoken</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Income Tax</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Resident Tax</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Net Income</div>
            </div>
        </div>
    );
};

export default IncomeBreakdownChart;