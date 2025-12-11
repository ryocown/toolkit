
import React from 'react';

interface SliderInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatDisplayValue: (value: number) => string;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, min, max, step, onChange, formatDisplayValue }) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">{label}</label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500"
            />
            <div className="text-center text-lg font-mono bg-slate-900/50 py-2 px-4 rounded-md text-cyan-300 tracking-wider">
                {formatDisplayValue(value)}
            </div>
        </div>
    );
};

export default SliderInput;
