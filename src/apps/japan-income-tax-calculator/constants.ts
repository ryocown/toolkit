
import { TaxBracket } from './types';

export const JAPAN_TAX_BRACKETS: TaxBracket[] = [
    { threshold: 0, rate: 0.05, deduction: 0, label: 'Up to ¥1.95M' },
    { threshold: 1950000, rate: 0.10, deduction: 97500, label: '¥1.95M to ¥3.3M' },
    { threshold: 3300000, rate: 0.20, deduction: 427500, label: '¥3.3M to ¥6.95M' },
    { threshold: 6950000, rate: 0.23, deduction: 636000, label: '¥6.95M to ¥9M' },
    { threshold: 9000000, rate: 0.33, deduction: 1536000, label: '¥9M to ¥18M' },
    { threshold: 18000000, rate: 0.40, deduction: 2796000, label: '¥18M to ¥40M' },
    { threshold: 40000000, rate: 0.45, deduction: 4796000, label: 'Over ¥40M' }
];

// Basic deduction for simplicity. Real deductions are more complex.
export const BASIC_DEDUCTION = 480000;
export const SOCIAL_INSURANCE_DEDUCTION_RATE = 0.145; // Approximate rate

// Exchange Rate
export const yenToUsd = 0.0064; // Example rate, in a real app this would be dynamic

// Detailed Social Insurance Rates (Employee Share)
export const SOCIAL_INSURANCE_RATES = {
    HEALTH: 0.0499, // ~5% (Health Insurance Association / Kyokai Kenpo avg)
    PENSION: 0.0915, // 18.3% split 50/50
    EMPLOYMENT: 0.006, // 0.6%
};

// Social Insurance Caps (Annual)
export const SOCIAL_INSURANCE_CAPS = {
    HEALTH: 16680000, // Standard Monthly Remuneration max ~1.39M * 12
    PENSION: 7800000, // Standard Monthly Remuneration max ~650k * 12
};

// Resident Tax
export const RESIDENT_TAX = {
    RATE: 0.10,
    BASIC_DEDUCTION: 430000,
    PER_CAPITA: 5000,
};

// Special Reconstruction Income Tax
export const RECONSTRUCTION_TAX_RATE = 0.021;
