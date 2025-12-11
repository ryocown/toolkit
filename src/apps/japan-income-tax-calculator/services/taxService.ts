import { TaxCalculationResult, TaxBracketResult, TaxBracket, DeductionItem } from '../types';
import { JAPAN_TAX_BRACKETS, SOCIAL_INSURANCE_CAPS, SOCIAL_INSURANCE_RATES, RESIDENT_TAX, RECONSTRUCTION_TAX_RATE } from '../constants';

/**
 * Calculates the Employment Income Deduction (Kyuyo Shotoku Kojo)
 * Based on 2024 Japanese Tax Law
 */
const calculateEmploymentIncomeDeduction = (grossIncome: number): number => {
    if (grossIncome <= 1625000) return 550000;
    if (grossIncome <= 1800000) return grossIncome * 0.4 - 100000;
    if (grossIncome <= 3600000) return grossIncome * 0.3 + 80000;
    if (grossIncome <= 6600000) return grossIncome * 0.2 + 440000;
    if (grossIncome <= 8500000) return grossIncome * 0.1 + 1100000;
    return 1950000; // Capped at 1.95M for income over 8.5M
};

/**
 * Calculates Basic Deduction (Kiso Kojo) for Income Tax
 * Decreases for income over 24M
 */
const calculateBasicDeduction = (grossIncome: number): number => {
    // Note: Technically based on "Net Income" (after employment deduction), but usually checked against Total Income Estimate
    // For simplicity, we'll use the standard thresholds on Net Income
    // But wait, the law says "Total Income Amount" (Goukei Shotoku Kingaku).
    // Let's calculate Net Income first to be accurate?
    // Actually, let's use the Net Income (Gross - Employment Deduction) for this check.
    const employmentDeduction = calculateEmploymentIncomeDeduction(grossIncome);
    const netIncome = grossIncome - employmentDeduction;

    if (netIncome <= 24000000) return 480000;
    if (netIncome <= 24500000) return 320000;
    if (netIncome <= 25000000) return 160000;
    return 0;
};

/**
 * Calculates Basic Deduction for Resident Tax
 */
const calculateResidentBasicDeduction = (grossIncome: number): number => {
    const employmentDeduction = calculateEmploymentIncomeDeduction(grossIncome);
    const netIncome = grossIncome - employmentDeduction;

    if (netIncome <= 24000000) return 430000;
    if (netIncome <= 24500000) return 290000;
    if (netIncome <= 25000000) return 150000;
    return 0;
};

export const calculateJapaneseTax = (grossIncome: number): TaxCalculationResult => {
    if (grossIncome <= 0) {
        return {
            incomeTax: 0,
            residentTax: 0,
            totalTax: 0,
            socialInsurance: 0,
            employmentIncomeDeduction: 0,
            basicDeduction: 0,
            totalDeductions: 0,
            taxableIncome: 0,
            netIncome: 0,
            effectiveRate: 0,
            deductionsBreakdown: [],
            breakdown: [],
        };
    }

    // 1. Social Insurance (Shakai Hoken)
    // Pension and Health have monthly caps, approximated here by annual caps
    const pension = Math.min(grossIncome, SOCIAL_INSURANCE_CAPS.PENSION) * SOCIAL_INSURANCE_RATES.PENSION;
    const health = Math.min(grossIncome, SOCIAL_INSURANCE_CAPS.HEALTH) * SOCIAL_INSURANCE_RATES.HEALTH;
    const employment = grossIncome * SOCIAL_INSURANCE_RATES.EMPLOYMENT;
    const socialInsurance = Math.round(pension + health + employment);

    // 2. Employment Income Deduction (Kyuyo Shotoku Kojo)
    const employmentIncomeDeduction = Math.round(calculateEmploymentIncomeDeduction(grossIncome));

    // 3. Basic Deduction (Kiso Kojo)
    const basicDeduction = calculateBasicDeduction(grossIncome);

    // Total Deductions for Income Tax
    const totalDeductions = socialInsurance + employmentIncomeDeduction + basicDeduction;

    // Taxable Income is rounded down to the nearest 1,000 yen
    const taxableIncomeRaw = Math.max(0, grossIncome - totalDeductions);
    const taxableIncome = Math.floor(taxableIncomeRaw / 1000) * 1000;

    // 4. Income Tax (National Tax)
    let baseIncomeTax = 0;
    let applicableBracket = null;

    for (const bracket of [...JAPAN_TAX_BRACKETS].reverse()) {
        if (taxableIncome > bracket.threshold) {
            baseIncomeTax = (taxableIncome * bracket.rate) - bracket.deduction;
            applicableBracket = bracket;
            break;
        }
    }

    if (!applicableBracket && taxableIncome > 0) {
        const lowestBracket = JAPAN_TAX_BRACKETS[0];
        baseIncomeTax = taxableIncome * lowestBracket.rate;
    }

    // Apply Special Reconstruction Income Tax (2.1%)
    const incomeTax = Math.floor(baseIncomeTax * (1 + RECONSTRUCTION_TAX_RATE));

    // 5. Resident Tax (Jyuuminzei)
    // Resident Taxable Income is also rounded down to nearest 1,000 yen
    const residentBasicDeduction = calculateResidentBasicDeduction(grossIncome);
    const residentTaxableRaw = Math.max(0, grossIncome - socialInsurance - employmentIncomeDeduction - residentBasicDeduction);
    const residentTaxable = Math.floor(residentTaxableRaw / 1000) * 1000;

    // 10% rate + Per Capita (~5000 yen)
    const residentTax = Math.floor(residentTaxable * RESIDENT_TAX.RATE) + RESIDENT_TAX.PER_CAPITA;

    const totalTax = incomeTax + residentTax;
    const netIncome = grossIncome - totalTax - socialInsurance;
    const effectiveRate = grossIncome > 0 ? (totalTax + socialInsurance) / grossIncome : 0;

    // Deductions Breakdown
    const deductionsBreakdown: DeductionItem[] = [
        { label: 'Social Insurance (Pension)', amount: Math.round(pension) },
        { label: 'Social Insurance (Health)', amount: Math.round(health) },
        { label: 'Social Insurance (Employment)', amount: Math.round(employment) },
        { label: 'Employment Income Deduction', amount: employmentIncomeDeduction },
        { label: 'Basic Deduction', amount: basicDeduction },
    ];

    // Tax Brackets Breakdown (for visualization)
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
        incomeTax,
        residentTax,
        totalTax,
        socialInsurance,
        employmentIncomeDeduction,
        basicDeduction,
        totalDeductions,
        taxableIncome,
        netIncome,
        effectiveRate,
        deductionsBreakdown,
        breakdown,
    };
};

export const getMarginalRateForGrossIncome = (grossIncome: number): { rate: number; bracket: TaxBracket | null } => {
    if (grossIncome <= 0) {
        return { rate: 0, bracket: null };
    }

    // Use detailed social insurance logic
    const pension = Math.min(grossIncome, SOCIAL_INSURANCE_CAPS.PENSION) * SOCIAL_INSURANCE_RATES.PENSION;
    const health = Math.min(grossIncome, SOCIAL_INSURANCE_CAPS.HEALTH) * SOCIAL_INSURANCE_RATES.HEALTH;
    const employment = grossIncome * SOCIAL_INSURANCE_RATES.EMPLOYMENT;
    const socialInsurance = Math.round(pension + health + employment);

    const employmentIncomeDeduction = calculateEmploymentIncomeDeduction(grossIncome);
    const totalDeductions = socialInsurance + employmentIncomeDeduction + calculateBasicDeduction(grossIncome);

    const taxableIncomeRaw = Math.max(0, grossIncome - totalDeductions);
    const taxableIncome = Math.floor(taxableIncomeRaw / 1000) * 1000;

    let applicableBracket: TaxBracket | null = null;

    for (const bracket of [...JAPAN_TAX_BRACKETS].reverse()) {
        if (taxableIncome > bracket.threshold) {
            applicableBracket = bracket;
            break;
        }
    }

    if (!applicableBracket && taxableIncome > 0) {
        applicableBracket = JAPAN_TAX_BRACKETS[0];
    }

    return {
        rate: applicableBracket ? applicableBracket.rate : 0,
        bracket: applicableBracket,
    };
};