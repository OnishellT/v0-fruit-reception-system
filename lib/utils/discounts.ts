/**
 * Cash POS Discount Calculation Utilities
 *
 * Implements excess-over-threshold discount calculation for quality-based pricing.
 * Discounts are calculated as the excess percentage over quality thresholds,
 * applied proportionally to the total weight.
 */

export interface QualityThreshold {
  fruitTypeId: number;
  metric: string;
  thresholdPercent: number;
  enabled: boolean;
}

export interface QualityMeasurements {
  humedad?: number;
  moho?: number;
  violetas?: number;
}

export interface DiscountBreakdownItem {
  parametro: string;
  umbral: number;
  valor: number;
  porcentajeDescuento: number;
  pesoDescuento: number;
}

export interface DiscountBreakdown {
  [metric: string]: {
    threshold: number;
    value: number | null;
    percentApplied: number;
    weightKg: number;
  };
}

export interface DiscountResult {
  combinedPercent: number;
  discountWeightKg: number;
  finalKg: number;
  breakdown: DiscountBreakdownItem[];
}

/**
 * Calculate cash discounts using excess-over-threshold method
 *
 * @param totalKg - Original weight in kilograms
 * @param thresholds - Array of quality thresholds for the fruit type
 * @param quality - Measured quality values (humedad, moho, violetas)
 * @returns Discount calculation result with breakdown
 */
export function computeCashDiscounts(
  totalKg: number,
  thresholds: QualityThreshold[],
  quality: QualityMeasurements
): DiscountResult {
  let totalExcessPercent = 0;
  const breakdown: DiscountBreakdownItem[] = [];

  // Calculate excess for each enabled threshold
  for (const threshold of thresholds.filter(t => t.enabled)) {
    const measuredValue = quality[threshold.metric as keyof QualityMeasurements] ?? 0;
    const excess = Math.max(0, measuredValue - threshold.thresholdPercent);
    totalExcessPercent += excess;

    // Add to breakdown array in the format expected by display components
    breakdown.push({
      parametro: `${threshold.metric.charAt(0).toUpperCase() + threshold.metric.slice(1)} (Evaluación)`,
      umbral: threshold.thresholdPercent,
      valor: measuredValue,
      porcentajeDescuento: excess,
      pesoDescuento: 0, // calculated after clamping
    });
  }

  // Clamp total discount to 100%
  const combinedPercent = Math.min(totalExcessPercent, 100);

  // Calculate discount weight
  const discountWeightKg = +(totalKg * (combinedPercent / 100)).toFixed(3);
  const finalKg = +(totalKg - discountWeightKg).toFixed(3);

  // Distribute weight proportionally among breakdown items
  const totalExcess = breakdown.reduce((sum, item) => sum + item.porcentajeDescuento, 0);

  for (const item of breakdown) {
    const share = totalExcess > 0 ? item.porcentajeDescuento / totalExcess : 0;
    item.pesoDescuento = +(discountWeightKg * share).toFixed(3);
  }

  return {
    combinedPercent,
    discountWeightKg,
    finalKg,
    breakdown,
  };
}

/**
 * Validate discount calculation inputs
 */
export function validateDiscountInputs(
  totalKg: number,
  thresholds: QualityThreshold[],
  quality: QualityMeasurements
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (totalKg <= 0) {
    errors.push('Total weight must be positive');
  }

  if (totalKg > 10000) {
    errors.push('Total weight cannot exceed 10,000 kg');
  }

  // Validate quality measurements
  for (const [metric, value] of Object.entries(quality)) {
    if (value !== undefined && (value < 0 || value > 100)) {
      errors.push(`${metric} must be between 0 and 100`);
    }
  }

  // Validate thresholds
  for (const threshold of thresholds) {
    if (threshold.thresholdPercent < 0 || threshold.thresholdPercent > 100) {
      errors.push(`Threshold for ${threshold.metric} must be between 0 and 100`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate final amounts including pricing
 */
export function calculateFinalAmounts(
  originalWeight: number,
  finalWeight: number,
  pricePerKg: number
) {
  const grossAmount = +(originalWeight * pricePerKg).toFixed(4);
  const netAmount = +(finalWeight * pricePerKg).toFixed(4);
  const totalDiscount = +(grossAmount - netAmount).toFixed(4);

  return {
    grossAmount,
    netAmount,
    totalDiscount,
  };
}