import React, { useMemo } from 'react';
import { AggregateResult, YearResult } from '../engine/types';

interface Props {
  results: AggregateResult;
  currency: string;
}

const PortfolioChart: React.FC<Props> = ({ results, currency }) => {
  const { percentile10, percentile50, percentile90 } = results;

  const width = 800;
  const height = 400;
  const padding = 40;

  const maxPortfolio = useMemo(() => {
    const allValues = [
      ...percentile10.map(d => d.portfolioEnd),
      ...percentile50.map(d => d.portfolioEnd),
      ...percentile90.map(d => d.portfolioEnd)
    ];
    return Math.max(...allValues, 1000000); // Min 1M for scale
  }, [percentile10, percentile50, percentile90]);

  const numYears = percentile50.length;

  const getX = (index: number) => padding + (index / (numYears - 1)) * (width - 2 * padding);
  const getY = (value: number) => height - padding - (value / maxPortfolio) * (height - 2 * padding);

  const createPath = (data: YearResult[]) => {
    if (data.length === 0) return '';
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.portfolioEnd)}`).join(' ');
  };

  const createAreaPath = (upper: YearResult[], lower: YearResult[]) => {
    if (upper.length === 0 || lower.length === 0) return '';
    const top = upper.map((d, i) => `${getX(i)},${getY(d.portfolioEnd)}`).join(' ');
    const bottom = lower.map((d, i) => `${getX(i)},${getY(d.portfolioEnd)}`).reverse().join(' ');
    return `M ${top} L ${bottom} Z`;
  };

  return (
    <div className="w-full h-full bg-slate-900/30 rounded-2xl overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line
              x1={padding}
              y1={getY(maxPortfolio * p)}
              x2={width - padding}
              y2={getY(maxPortfolio * p)}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding - 5}
              y={getY(maxPortfolio * p)}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
              alignmentBaseline="middle"
            >
              {currency}{(maxPortfolio * p / 1000000).toFixed(1)}M
            </text>
          </g>
        ))}

        {/* X-Axis Labels (Years) */}
        {percentile50.filter((_, i) => i % 10 === 0 || i === numYears - 1).map((d) => (
          <text
            key={d.year}
            x={getX(percentile50.indexOf(d))}
            y={height - padding + 20}
            fill="#94a3b8"
            fontSize="10"
            textAnchor="middle"
          >
            {d.year}
          </text>
        ))}

        {/* Confidence Intervals (Areas) */}
        <path
          d={createAreaPath(percentile90, percentile10)}
          fill="url(#gradient-area)"
          opacity="0.2"
        />

        {/* Lines */}
        <path d={createPath(percentile90)} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
        <path d={createPath(percentile10)} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
        <path d={createPath(percentile50)} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Retirement Marker */}
        {percentile50.find(d => d.isRetirement) && (
          <g>
            <line
              x1={getX(percentile50.findIndex(d => d.isRetirement))}
              y1={padding}
              x2={getX(percentile50.findIndex(d => d.isRetirement))}
              y2={height - padding}
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
            <text
              x={getX(percentile50.findIndex(d => d.isRetirement))}
              y={padding - 10}
              fill="#6366f1"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              Retirement
            </text>
          </g>
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default PortfolioChart;
