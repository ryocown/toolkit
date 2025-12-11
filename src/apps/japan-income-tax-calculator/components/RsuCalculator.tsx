import React, { useState, useCallback, useEffect } from 'react';
import SliderInput from './SliderInput';
import { formatCurrency } from '../utils/formatters';

interface RsuCalculatorProps {
    onRsuValueChange: (value: number) => void;
    fxRate: number;
}

const RsuCalculator: React.FC<RsuCalculatorProps> = ({ onRsuValueChange, fxRate }) => {
    const [isRsuEnabled, setIsRsuEnabled] = useState<boolean>(true);
    const [totalShares, setTotalShares] = useState<number>(100);
    const [vestingYears, setVestingYears] = useState<number>(4);
    const [vestingSchedule, setVestingSchedule] = useState<number[]>([33, 33, 22, 12]);

    const [stockPrice, setStockPrice] = useState<number | null>(150); // Default to 150
    const [priceInput, setPriceInput] = useState<string>('150');

    const totalPercentage = vestingSchedule.reduce((sum, p) => sum + (p || 0), 0);

    // Effect to handle disabling/enabling the RSU feature
    useEffect(() => {
        if (!isRsuEnabled) {
            onRsuValueChange(0);
        } else {
            handlePriceInputBlur(true);
        }
    }, [isRsuEnabled, onRsuValueChange]);

    // Reactive calculation effect
    useEffect(() => {
        if (isRsuEnabled && stockPrice !== null && vestingSchedule.length > 0 && totalPercentage === 100) {
            const firstYearPercentage = vestingSchedule[0] || 0;
            const firstYearValueUSD = stockPrice * totalShares * (firstYearPercentage / 100);
            const firstYearValueJPY = firstYearValueUSD * fxRate;
            onRsuValueChange(Math.round(firstYearValueJPY));
        } else {
            onRsuValueChange(0);
        }
    }, [stockPrice, totalShares, vestingSchedule, isRsuEnabled, onRsuValueChange, totalPercentage]);

    const applyEqualDistribution = useCallback(() => {
        if (vestingYears <= 0) {
            setVestingSchedule([]);
            return;
        }
        const newSchedule = Array(vestingYears).fill(0);
        const basePercentage = Math.floor(100 / vestingYears);
        const remainder = 100 % vestingYears;
        for (let i = 0; i < vestingYears; i++) {
            newSchedule[i] = basePercentage + (i < remainder ? 1 : 0);
        }
        setVestingSchedule(newSchedule);
    }, [vestingYears]);

    useEffect(() => {
        if (vestingYears !== vestingSchedule.length) {
            applyEqualDistribution();
        }
    }, [vestingYears, vestingSchedule.length, applyEqualDistribution]);

    const handleScheduleChange = (index: number, value: string) => {
        const newSchedule = [...vestingSchedule];
        const numericValue = parseInt(value, 10);
        newSchedule[index] = isNaN(numericValue) ? 0 : numericValue;
        setVestingSchedule(newSchedule);
    };

    const applyGoogleSchedule = () => {
        setVestingYears(4);
        setVestingSchedule([33, 33, 22, 12]);
    };

    const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceInput(e.target.value);
    };

    const handlePriceInputBlur = (forceUpdate = false) => {
        const newPrice = parseFloat(priceInput);
        if (!isNaN(newPrice) && newPrice >= 0) {
            if (newPrice !== stockPrice || forceUpdate) {
                setStockPrice(newPrice);
            }
        } else {
            setPriceInput(stockPrice?.toString() || '');
        }
    };

    const firstYearPercentage = vestingSchedule.length > 0 ? vestingSchedule[0] || 0 : 0;
    const firstYearValueUsd = stockPrice ? stockPrice * totalShares * (firstYearPercentage / 100) : 0;
    const firstYearValueJpy = firstYearValueUsd * fxRate;

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-cyan-400">RSU Vesting</h2>
                <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isRsuEnabled ? 'text-white' : 'text-slate-400'}`}>{isRsuEnabled ? 'Enabled' : 'Disabled'}</span>
                    <button
                        role="switch"
                        aria-checked={isRsuEnabled}
                        onClick={() => setIsRsuEnabled(!isRsuEnabled)}
                        className={`${isRsuEnabled ? 'bg-cyan-500' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                        <span className={`${isRsuEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                </div>
            </div>

            <fieldset disabled={!isRsuEnabled} className="space-y-4 transition-opacity duration-300 disabled:opacity-50">
                <div>
                    <label htmlFor="stock-price" className="block text-sm font-medium text-slate-300 mb-1">Stock Price (USD)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">$</span>
                        </div>
                        <input
                            id="stock-price"
                            type="number"
                            value={priceInput}
                            onChange={handlePriceInputChange}
                            onBlur={() => handlePriceInputBlur()}
                            placeholder="Enter stock price"
                            disabled={!isRsuEnabled}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition pl-7 pr-4"
                            step="0.01"
                        />
                    </div>
                </div>

                <SliderInput
                    label="Total Shares in Grant"
                    value={totalShares}
                    min={0}
                    max={5000}
                    step={10}
                    onChange={setTotalShares}
                    formatDisplayValue={(val) => `${val.toLocaleString()} shares`}
                />
                <SliderInput
                    label="Vesting Period (Years)"
                    value={vestingYears}
                    min={1}
                    max={10}
                    step={1}
                    onChange={setVestingYears}
                    formatDisplayValue={(val) => `${val} year${val > 1 ? 's' : ''}`}
                />

                <div className="space-y-2 pt-2">
                    <label className="block text-sm font-medium text-slate-300">Vesting Schedule (%)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {vestingSchedule.map((percentage, index) => (
                            <div key={index} className="relative">
                                <label className="absolute -top-2 left-2 text-xs text-slate-400 bg-slate-800/50 px-1">Year {index + 1}</label>
                                <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => handleScheduleChange(index, e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md pt-3 pb-1 text-center text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        ))}
                    </div>
                    <div className={`text-sm text-right pr-1 font-medium ${totalPercentage !== 100 ? 'text-red-400' : 'text-green-400/80'}`}>
                        Total: {totalPercentage}%
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={applyEqualDistribution} className="text-xs flex-grow bg-slate-700 hover:bg-slate-600 text-cyan-300 py-1 px-2 rounded-md transition-colors">
                        Equal Distribution
                    </button>
                    <button onClick={applyGoogleSchedule} className="text-xs flex-grow bg-slate-700 hover:bg-slate-600 text-cyan-300 py-1 px-2 rounded-md transition-colors">
                        Google Front-loaded
                    </button>
                </div>
            </fieldset>

            {isRsuEnabled && stockPrice !== null && (
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="text-center">
                        <span className="text-lg text-cyan-300">Estimated Year 1 RSU Value:</span>
                        <p className="font-bold text-2xl text-cyan-300">{formatCurrency(firstYearValueJpy, 'JPY')}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            ({totalShares.toLocaleString()} shares @ ${formatCurrency(stockPrice, 'USD')} x {firstYearPercentage}%)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RsuCalculator;