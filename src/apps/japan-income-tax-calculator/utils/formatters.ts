
export const formatCurrency = (value: number, currency: 'JPY' | 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(value);
};

export const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};
