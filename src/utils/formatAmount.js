/**
 * Formats an amount with $ELD currency and 6 decimal places
 * Divides by 1,000,000 to convert from smallest unit to main unit
 * @param {number|string} amount - The amount in smallest units
 * @returns {string} Formatted amount with $ELD prefix
 */
export function formatELDAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '$ELD 0.000000';
  }

  // Convert to number if it's a string, handling both string and number inputs
  let numAmount;
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount.trim());
  } else {
    numAmount = Number(amount);
  }
  
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '$ELD 0.000000';
  }

  // Divide by 1,000,000 to get the main unit
  const mainUnit = numAmount / 1000000;

  // Format with exactly 6 decimal places
  const formatted = mainUnit.toFixed(6);

  return `$ELD ${formatted}`;
}

/**
 * Formats an account balance with $ELD currency and 8 decimal places
 * Does NOT divide - assumes balance is already in main unit
 * @param {number|string} amount - The amount in main unit
 * @returns {string} Formatted amount with $ELD prefix
 */
export function formatAccountBalance(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '$ELD 0.00000000';
  }

  // Convert to number if it's a string, handling both string and number inputs
  let numAmount;
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount.trim());
  } else {
    numAmount = Number(amount);
  }
  
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '$ELD 0.00000000';
  }

  // Format with exactly 8 decimal places (no division)
  const formatted = numAmount.toFixed(8);

  return `$ELD ${formatted}`;
}

