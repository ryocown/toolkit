import { TaxCalculationResult, TaxBracketResult, TaxBracket } from '../types';
import { JAPAN_TAX_BRACKETS, BASIC_DEDUCTION, SOCIAL_INSURANCE_DEDUCTION_RATE } from '../constants';

export const calculateJapaneseTax = (grossIncome: number): TaxCalculationResult => {
    if (grossIncome <= 0) {
        return {
            totalTax: 0,
            netIncome: 0,
            effectiveRate: 0,
            taxableIncome: 0,
            totalDeductions: 0,
            breakdown: [],
        };
    }

    const socialInsuranceDeduction = grossIncome * SOCIAL_INSURANCE_DEDUCTION_RATE;
    const totalDeductions = BASIC_DEDUCTION + socialInsuranceDeduction;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    let totalTax = 0;
    let applicableBracket = null;

    for (const bracket of [...JAPAN_TAX_BRACKETS].reverse()) {
        if (taxableIncome > bracket.threshold) {
            totalTax = (taxableIncome * bracket.rate) - bracket.deduction;
            applicableBracket = bracket;
            break;
        }
    }

    if (!applicableBracket) {
        // Fallback for the lowest bracket if taxable income is > 0 but <= 1,950,000
        const lowestBracket = JAPAN_TAX_BRACKETS[0];
        totalTax = taxableIncome * lowestBracket.rate;
    }

    totalTax = Math.round(totalTax);
    const netIncome = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

    // Create a breakdown for visualization
    const breakdown: TaxBracketResult[] = [];
    let remainingIncome = taxableIncome;

    for (const bracket of JAPAN_TAX_BRACKETS) {
        if (remainingIncome <= 0) break;

        const nextThreshold = JAPAN_TAX_BRACKETS.find(b => b.threshold > bracket.threshold)?.threshold || Infinity;
        const incomeInBracket = Math.min(remainingIncome, nextThreshold - bracket.threshold);

        if (incomeInBracket > 0) {
            const taxInBracket = incomeInBracket * bracket.rate;
            breakdown.push({
                ...bracket,
                taxInBracket,
            });
            remainingIncome -= incomeInBracket;
        }
    }

    return {
        totalTax,
        netIncome,
        effectiveRate,
        taxableIncome,
        totalDeductions,
        breakdown,
    };
};


export const getMarginalRateForGrossIncome = (grossIncome: number): { rate: number; bracket: TaxBracket | null } => {
    if (grossIncome <= 0) {
        return { rate: 0, bracket: null };
    }

    const socialInsuranceDeduction = grossIncome * SOCIAL_INSURANCE_DEDUCTION_RATE;
    const totalDeductions = BASIC_DEDUCTION + socialInsuranceDeduction;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    let applicableBracket: TaxBracket | null = null;

    // Find the correct bracket for the taxable income
    for (const bracket of [...JAPAN_TAX_BRACKETS].reverse()) {
        if (taxableIncome > bracket.threshold) {
            applicableBracket = bracket;
            break;
        }
    }

    // If income is very low but > 0, it falls in the first bracket
    if (!applicableBracket && taxableIncome > 0) {
        applicableBracket = JAPAN_TAX_BRACKETS[0];
    }

    return {
        rate: applicableBracket ? applicableBracket.rate : 0,
        bracket: applicableBracket,
    };
};