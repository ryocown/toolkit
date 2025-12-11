
import React, { useState, useCallback, useEffect, useRef } from 'react';
import TextInput from './TextInput';
import SliderInput from './SliderInput';
import { fetchStockPrice, StockPriceResult } from '../services/stockService';
import { formatCurrency } from '../utils/formatters';
import { TickerIcon } from './Icon';
import { yenToUsd } from '../constants';

interface RsuCalculatorProps {
    onRsuValueChange: (value: number) => void;
}

const RsuCalculator: React.FC<RsuCalculatorProps> = ({ onRsuValueChange }) => {
    const [isRsuEnabled, setIsRsuEnabled] = useState<boolean>(true);
    const [ticker, setTicker] = useState<string>('GOOGL');
    const [totalShares, setTotalShares] = useState<number>(100);
    const [vestingYears, setVestingYears] = useState<number>(4);
    const [vestingSchedule, setVestingSchedule] = useState<number[]>([33, 33, 22, 12]);
    
    const [stockPrice, setStockPrice] = useState<number | null>(null);
    const [sourceData, setSourceData] = useState<{url?: string, title?: string} | null>(null);
    const [priceInput, setPriceInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const lastFetchedTicker = useRef<string | null>(null);

    const totalPercentage = vestingSchedule.reduce((sum, p) => sum + (p || 0), 0);

    // Effect to handle disabling/enabling the RSU feature
    useEffect(() => {
        if (!isRsuEnabled) {
            onRsuValueChange(0);
            setStockPrice(null);
            setSourceData(null);
            setError(null);
            lastFetchedTicker.current = null;
        } else {
            // Re-calculate if enabled and there's a valid price
            handlePriceInputBlur(true);
        }
    }, [isRsuEnabled, onRsuValueChange]);
    
    // Effect to update the text input when stock price is fetched
    useEffect(() => {
        if (stockPrice !== null) {
            setPriceInput(stockPrice.toString());
        } else {
            setPriceInput('');
        }
    }, [stockPrice]);

    // Reactive calculation effect
    useEffect(() => {
        if (isRsuEnabled && stockPrice !== null && vestingSchedule.length > 0 && totalPercentage === 100) {
            const firstYearPercentage = vestingSchedule[0] || 0;
            const firstYearValueUSD = stockPrice * totalShares * (firstYearPercentage / 100);
            const firstYearValueJPY = firstYearValueUSD * (1 / yenToUsd);
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

    const handleFetchPrice = async () => {
        setError(null);
        setIsLoading(true);
        setStockPrice(null);
        setSourceData(null);

        try {
            const result: StockPriceResult = await fetchStockPrice(ticker);
            setStockPrice(result.price);
            setSourceData({ url: result.sourceUrl, title: result.sourceTitle });
            lastFetchedTicker.current = ticker;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch stock price.');
            lastFetchedTicker.current = null;
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPriceInput(e.target.value);
        // If manually editing, clear the source data as it's no longer from the API
        if (sourceData) {
            setSourceData(null);
        }
    };

    const handlePriceInputBlur = (forceUpdate = false) => {
        const newPrice = parseFloat(priceInput);
        if (!isNaN(newPrice) && newPrice >= 0) {
            if (newPrice !== stockPrice || forceUpdate) {
                setStockPrice(newPrice);
            }
        } else {
            // If input is invalid, clear it and the price state
            setPriceInput('');
            setStockPrice(null);
        }
    };

    const firstYearPercentage = vestingSchedule.length > 0 ? vestingSchedule[0] || 0 : 0;
    const firstYearValueUsd = stockPrice ? stockPrice * totalShares * (firstYearPercentage / 100) : 0;
    const firstYearValueJpy = firstYearValueUsd * (1 / yenToUsd);

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
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <TextInput 
                            label="Stock Ticker"
                            value={ticker}
                            onChange={setTicker}
                            placeholder="e.g., AAPL"
                            icon={<TickerIcon />}
                        />
                    </div>
                     <button
                        onClick={handleFetchPrice}
                        disabled={isLoading || !ticker.trim() || !isRsuEnabled}
                        className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 h-[42px] w-[90px] flex items-center justify-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Fetch'}
                    </button>
                </div>

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
                            placeholder="Enter or fetch price"
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

            {isRsuEnabled && error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

            {isRsuEnabled && stockPrice !== null && !error && (
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                     <p className="text-center text-sm text-slate-400">
                        Based on a stock price of <span className="font-mono text-white">${formatCurrency(stockPrice, 'USD')}</span> for {ticker}
                     </p>
                     {sourceData?.url && (
                         <div className="text-center mt-1">
                             <a 
                                href={sourceData.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-cyan-500 hover:text-cyan-400 underline"
                             >
                                 Source: {sourceData.title || 'Google Search'}
                             </a>
                         </div>
                     )}
                    <div className="text-center mt-2">
                        <span className="text-lg text-cyan-300">Estimated Year 1 RSU Value:</span>
                        <p className="font-bold text-2xl text-cyan-300">{formatCurrency(firstYearValueJpy, 'JPY')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RsuCalculator;