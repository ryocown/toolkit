
export interface TaxBracket {
    rate: number;
    threshold: number;
    deduction: number;
    label: string;
}

export interface TaxBracketResult extends TaxBracket {
    taxInBracket: number;
}

export interface DeductionItem {
    label: string;
    amount: number;
}

export interface TaxCalculationResult {
    incomeTax: number;
    residentTax: number;
    totalTax: number;
    socialInsurance: number;
    employmentIncomeDeduction: number;
    basicDeduction: number;
    totalDeductions: number;
    taxableIncome: number;
    netIncome: number;
    effectiveRate: number;
    deductionsBreakdown: DeductionItem[];
    breakdown: TaxBracketResult[];
}

export interface RsuDetails {
    ticker: string;
    totalShares: number;
    vestingYears: number;
}
