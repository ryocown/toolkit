
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
