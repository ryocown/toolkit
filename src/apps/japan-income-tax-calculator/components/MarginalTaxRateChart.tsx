import React, { useMemo } from 'react';
import { JAPAN_TAX_BRACKETS, BASIC_DEDUCTION, SOCIAL_INSURANCE_DEDUCTION_RATE } from '../constants';
import { getMarginalRateForGrossIncome } from '../services/taxService';
import { formatPercentage } from '../utils/formatters';

interface MarginalTaxRateChartProps {
    currentGrossIncome: number;
}

const MarginalTaxRateChart: React.FC<MarginalTaxRateChartProps> = ({ currentGrossIncome }) => {
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 250;
    const PADDING = { top: 20, right: 20, bottom: 50, left: 50 };
    const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
    const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const MAX_INCOME = 50_000_000;
    const MAX_RATE = 0.5; // 50% to give some space above the 45% top rate

    const { points, currentRate } = useMemo(() => {
        // Function to find the gross income that corresponds to a taxable income threshold
        const grossIncomeForThreshold = (taxableThreshold: number): number => {
            if (taxableThreshold === 0) return 0;
            return (taxableThreshold + BASIC_DEDUCTION) / (1 - SOCIAL_INSURANCE_DEDUCTION_RATE);
        };

        const dataPoints: { x: number; y: number }[] = [];
        dataPoints.push({ x: 0, y: JAPAN_TAX_BRACKETS[0].rate });

        for (let i = 0; i < JAPAN_TAX_BRACKETS.length; i++) {
            const bracket = JAPAN_TAX_BRACKETS[i];
            const prevRate = i > 0 ? JAPAN_TAX_BRACKETS[i - 1].rate : bracket.rate;
            
            const grossX = grossIncomeForThreshold(bracket.threshold);
            if (grossX > 0 && grossX <= MAX_INCOME) {
                // Add point right before the jump
                dataPoints.push({ x: grossX - 1, y: prevRate });
                // Add point at the jump
                dataPoints.push({ x: grossX, y: bracket.rate });
            }
        }
        dataPoints.push({ x: MAX_INCOME, y: JAPAN_TAX_BRACKETS[JAPAN_TAX_BRACKETS.length - 1].rate });
        
        const xScale = (income: number) => PADDING.left + (income / MAX_INCOME) * CHART_WIDTH;
        const yScale = (rate: number) => PADDING.top + CHART_HEIGHT - (rate / MAX_RATE) * CHART_HEIGHT;

        const pointsString = dataPoints
            .filter(p => p.x <= MAX_INCOME)
            .map(p => `${xScale(p.x)},${yScale(p.y)}`)
            .join(' ');
            
        const { rate } = getMarginalRateForGrossIncome(currentGrossIncome);

        return { points: pointsString, currentRate: rate };

    }, [currentGrossIncome]);

    const xScale = (income: number) => PADDING.left + (income / MAX_INCOME) * CHART_WIDTH;
    const yScale = (rate: number) => PADDING.top + CHART_HEIGHT - (rate / MAX_RATE) * CHART_HEIGHT;

    const markerX = xScale(Math.min(currentGrossIncome, MAX_INCOME));
    const markerY = yScale(currentRate);

    const yAxisLabels = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    const xAxisLabels = [0, 10, 20, 30, 40, 50];


    return (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
             <h3 className="text-xl font-semibold mb-4 text-center text-slate-300">Marginal Tax Rate (Rate of Change)</h3>
            <div className="bg-slate-900/50 p-4 rounded-lg flex justify-center">
                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="Marginal Tax Rate Chart">
                    <title>A line graph showing the marginal tax rate increases as gross income increases.</title>
                    {/* Y-Axis */}
                    <g className="text-slate-400 text-xs" fill="currentColor">
                        {yAxisLabels.map(rate => (
                            <g key={`y-label-${rate}`}>
                               <text x={PADDING.left - 8} y={yScale(rate) + 4} textAnchor="end">{formatPercentage(rate)}</text>
                               <line x1={PADDING.left} x2={PADDING.left + CHART_WIDTH} y1={yScale(rate)} y2={yScale(rate)} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
                            </g>
                        ))}
                        <text transform={`translate(15, ${SVG_HEIGHT / 2}) rotate(-90)`} textAnchor="middle" className="fill-current text-sm text-slate-400">
                           Marginal Rate
                        </text>
                    </g>
                    
                    {/* X-Axis */}
                    <g className="text-slate-400 text-xs" fill="currentColor">
                        {xAxisLabels.map(incomeM => (
                             <g key={`x-label-${incomeM}`}>
                                <text x={xScale(incomeM * 1_000_000)} y={SVG_HEIGHT - PADDING.bottom + 16} textAnchor="middle">
                                    {incomeM}M
                                </text>
                             </g>
                        ))}
                         <text x={SVG_WIDTH/2} y={SVG_HEIGHT - 5} textAnchor="middle" className="fill-current text-sm text-slate-400">
                           Gross Income (JPY)
                        </text>
                    </g>
                    
                    {/* Line Graph */}
                    <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" />

                    {/* Current Position Marker */}
                    {currentGrossIncome > 0 && (
                        <g>
                            <line
                                x1={markerX}
                                y1={yScale(0)}
                                x2={markerX}
                                y2={PADDING.top}
                                stroke="#f87171"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                            />
                            <circle cx={markerX} cy={markerY} r="4" fill="#22d3ee" stroke="#164e63" strokeWidth="2" />
                             <g transform={`translate(${markerX > CHART_WIDTH / 2 ? markerX - 10 : markerX + 10}, ${markerY - 10})`}>
                                <rect x="-35" y="-15" width="70" height="20" rx="4" fill="rgba(15, 23, 42, 0.8)" />
                                <text
                                    textAnchor="middle"
                                    fill="#f87171"
                                    className="text-xs font-bold"
                                >
                                    {formatPercentage(currentRate)}
                                </text>
                            </g>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default MarginalTaxRateChart;
