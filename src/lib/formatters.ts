/**
 * Formats a number to Vietnamese standard: 1.234.567,89
 * @param value The number to format
 * @param minimumFractionDigits Minimum number of fraction digits
 * @param maximumFractionDigits Maximum number of fraction digits
 */
export const formatNumber = (
  value: number, 
  minimumFractionDigits: number = 0, 
  maximumFractionDigits: number = 2
): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits,
    maximumFractionDigits
  });
};

/**
 * Formats a percentage: 12,5%
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return formatNumber(value, decimals, decimals) + '%';
};
