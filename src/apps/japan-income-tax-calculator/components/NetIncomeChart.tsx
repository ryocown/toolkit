import React, { useMemo } from 'react';
import { calculateJapaneseTax, getMarginalRateForGrossIncome } from '../services/taxService';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface NetIncomeChartProps {
    currentGrossIncome: number;
    currentNetIncome: number;
}

const NetIncomeChart: React.FC<NetIncomeChartProps> = ({ currentGrossIncome, currentNetIncome }) => {
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 500;
    const PADDING = { top: 20, right: 60, bottom: 50, left: 60 };
    const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
    const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const MAX_INCOME = 50_000_000;
    const MAX_RATE = 1.0; // For the slope/derivative axis

    const { netIncomePoints, slopeAreaPoints } = useMemo(() => {
        const netDataPoints: { x: number; y: number }[] = [];
        const slopeDataPoints: { x: number; y: number }[] = [];
        const steps = 200; 

        const xScale = (income: number) => PADDING.left + (income / MAX_INCOME) * CHART_WIDTH;
        const yNetScale = (income: number) => PADDING.top + CHART_HEIGHT - (income / MAX_INCOME) * CHART_HEIGHT;
        const ySlopeScale = (rate: number) => PADDING.top + CHART_HEIGHT - (rate / MAX_RATE) * CHART_HEIGHT;

        let lastRate = -1;

        for (let i = 0; i <= steps; i++) {
            const gross = (i / steps) * MAX_INCOME;
            const { netIncome } = calculateJapaneseTax(gross);
            netDataPoints.push({ x: gross, y: netIncome });

            const { rate } = getMarginalRateForGrossIncome(gross);
            const takeHomeRate = 1 - rate;

            if (lastRate !== -1 && lastRate.toFixed(3) !== takeHomeRate.toFixed(3)) {
                slopeDataPoints.push({ x: gross - 1, y: lastRate });
            }
            slopeDataPoints.push({ x: gross, y: takeHomeRate });
            lastRate = takeHomeRate;
        }

        const netIncomePointsStr = netDataPoints.map(p => `${xScale(p.x)},${yNetScale(p.y)}`).join(' ');
        
        const firstPoint = slopeDataPoints[0];
        const lastPoint = slopeDataPoints[slopeDataPoints.length - 1];
        
        const slopePath = 'M' + slopeDataPoints.map(p => `${xScale(p.x)},${ySlopeScale(p.y)}`).join(' L')
                         + ` L${xScale(lastPoint.x)},${ySlopeScale(0)} L${xScale(firstPoint.x)},${ySlopeScale(0)} Z`;

        return { netIncomePoints: netIncomePointsStr, slopeAreaPoints: slopePath };

    }, []);

    const xScale = (income: number) => PADDING.left + (income / MAX_INCOME) * CHART_WIDTH;
    const yNetScale = (income: number) => PADDING.top + CHART_HEIGHT - (income / MAX_INCOME) * CHART_HEIGHT;
    const ySlopeScale = (rate: number) => PADDING.top + CHART_HEIGHT - (rate / MAX_RATE) * CHART_HEIGHT;

    const markerX = xScale(Math.min(currentGrossIncome, MAX_INCOME));
    const markerY = yNetScale(currentNetIncome);
    
    const yNetAxisLabels = [0, 10, 20, 30, 40, 50];
    const xAxisLabels = [0, 10, 20, 30, 40, 50];
    const ySlopeAxisLabels = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

    return (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
             <h3 className="text-xl font-semibold mb-4 text-center text-slate-300">Gross vs. Take-Home Income</h3>
            <div className="bg-slate-900/50 p-4 rounded-lg flex justify-center">
                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="A line graph showing take-home pay vs. gross income, with an underlay showing the rate of increase.">
                    
                    {/* Y-Axis (Net Income) */}
                    <g className="text-slate-400 text-xs" fill="currentColor">
                        {yNetAxisLabels.map(incomeM => (
                            <g key={`y-net-label-${incomeM}`}>
                               <text x={PADDING.left - 8} y={yNetScale(incomeM * 1_000_000) + 4} textAnchor="end">{incomeM}M</text>
                               <line x1={PADDING.left} x2={SVG_WIDTH - PADDING.right} y1={yNetScale(incomeM * 1_000_000)} y2={yNetScale(incomeM * 1_000_000)} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
                            </g>
                        ))}
                        <text transform={`translate(20, ${SVG_HEIGHT / 2}) rotate(-90)`} textAnchor="middle" className="fill-current text-sm text-slate-400">
                           Take-Home Pay (JPY)
                        </text>
                    </g>
                    
                     {/* Y-Axis (Slope/Take-Home Rate) */}
                    <g className="text-slate-400 text-xs" fill="currentColor">
                        {ySlopeAxisLabels.map(rate => (
                            <g key={`y-slope-label-${rate}`}>
                               <text x={SVG_WIDTH - PADDING.right + 8} y={ySlopeScale(rate) + 4} textAnchor="start">{formatPercentage(rate)}</text>
                            </g>
                        ))}
                        <text transform={`translate(${SVG_WIDTH - 15}, ${SVG_HEIGHT / 2}) rotate(-90)`} textAnchor="middle" className="fill-current text-sm text-slate-400">
                           Take-Home Rate of Next Yen
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
                    
                    {/* Slope Area Graph */}
                    <path d={slopeAreaPoints} fill="#38bdf8" fillOpacity="0.2" />

                    {/* Net Income Line Graph */}
                    <polyline points={netIncomePoints} fill="none" stroke="#22c55e" strokeWidth="2.5" />

                    {/* Current Position Marker */}
                    {currentGrossIncome > 0 && (
                        <g>
                            <circle cx={markerX} cy={markerY} r="5" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
                            <g transform={`translate(${markerX > CHART_WIDTH * 0.7 ? markerX - 10 : markerX + 10}, ${markerY - 10})`}>
                                <rect x="-45" y="-15" width="90" height="20" rx="4" fill="rgba(15, 23, 42, 0.8)" />
                                <text
                                    x={markerX > CHART_WIDTH * 0.7 ? -40 : 40}
                                    textAnchor={markerX > CHART_WIDTH * 0.7 ? "start" : "end"}
                                    fill="#6ee7b7"
                                    className="text-xs font-bold"
                                    transform={`translate(${markerX > CHART_WIDTH * 0.7 ? -80 : 0})`}
                                >
                                    Net: {formatCurrency(currentNetIncome, 'JPY')}
                                </text>
                            </g>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default NetIncomeChart;
