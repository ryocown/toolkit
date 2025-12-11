
import React from 'react';

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
    maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, placeholder, icon, maxLength }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${icon ? 'pl-10' : 'pl-4'} pr-4`}
                />
            </div>
        </div>
    );
};

export default TextInput;
