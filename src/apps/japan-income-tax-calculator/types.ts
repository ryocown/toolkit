
export interface TaxBracket {
    rate: number;
    threshold: number;
    deduction: number;
    label: string;
}

export interface TaxBracketResult extends TaxBracket {
    taxInBracket: number;
}

export interface TaxCalculationResult {
    totalTax: number;
    netIncome: number;
    effectiveRate: number;
    taxableIncome: number;
    totalDeductions: number;
    breakdown: TaxBracketResult[];
}

export interface RsuDetails {
    ticker: string;
    totalShares: number;
    vestingYears: number;
}
