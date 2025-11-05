// Pricing calculation engine for Quality-Based Pricing System
// File: lib/utils/pricing.ts
// Date: 2025-10-31

import type {
  DiscountThreshold,
  QualityMetricValue,
  PricingCalculationPreview,
  PricingCalculationData,
  QualityEvaluationData,
  DiscountBreakdownItem,
  WeightDiscountResult
} from '@/lib/types/pricing';

/**
 * Calculate pricing breakdown based on final weight (after quality discounts)
 *
 * @param basePricePerKg - Base price per kilogram
 * @param finalWeight - Final weight in kilograms (after quality discounts applied)
 * @param qualityMetrics - Array of quality metric values (for reference only)
 * @param thresholds - Array of discount thresholds (for reference only)
 * @returns Pricing calculation preview with breakdown
 */
export function calculatePricing(
  basePricePerKg: number,
  finalWeight: number,
  qualityMetrics: QualityMetricValue[],
  thresholds: DiscountThreshold[]
): PricingCalculationPreview {
  // Calculate gross value (base price × final weight after quality discounts)
  const grossValue = roundToTwoDecimals(basePricePerKg * finalWeight);

  // Quality metrics only affect weight, not price. No price discounts applied.
  const discountBreakdown: Array<{
    quality_metric: string;
    value: number;
    discount_percentage: number;
    discount_amount: number;
  }> = [];

  const totalDiscountAmount = 0; // No price discounts

  // Calculate final total (same as gross value since no price discounts)
  const finalTotal = grossValue;

  // Build applied thresholds list for reference
  const appliedThresholds = thresholds.map(t => ({
    quality_metric: t.quality_metric,
    limit_value: t.limit_value
  }));

  return {
    base_price_per_kg: basePricePerKg,
    total_weight: finalWeight,
    gross_value: grossValue,
    total_discount_amount: totalDiscountAmount,
    final_total: finalTotal,
    discount_breakdown: discountBreakdown,
    applied_thresholds: appliedThresholds
  };
}

/**
 * Create immutable pricing calculation data for database storage
 *
 * @param receptionId - Reception ID
 * @param preview - Pricing calculation preview
 * @param fruitType - Type of fruit
 * @param userId - User creating the calculation
 * @returns Pricing calculation data object
 */
export function createPricingCalculationData(
  receptionId: string,
  preview: PricingCalculationPreview,
  fruitType: string,
  userId?: string
): Omit<PricingCalculationData, 'timestamp'> {
  return {
    quality_metrics: preview.discount_breakdown.map(d => ({
      metric: d.quality_metric,
      value: d.value,
      discount_percentage: d.discount_percentage,
      discount_amount: d.discount_amount
    })),
    total_discounts: preview.total_discount_amount,
    fruit_type: fruitType,
    applied_thresholds: preview.applied_thresholds
  };
}

/**
 * Validate if pricing can be calculated
 *
 * @param fruitType - Type of fruit
 * @param qualityMetrics - Quality metric values
 * @param thresholds - Available thresholds
 * @param pricingEnabled - Whether quality-based pricing is enabled
 * @returns Object with validation result and any errors
 */
export function validatePricingCalculation(
  fruitType: string,
  qualityMetrics: QualityMetricValue[],
  thresholds: DiscountThreshold[],
  pricingEnabled: boolean
): { canCalculate: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if pricing is enabled
  if (!pricingEnabled) {
    errors.push('Quality-based pricing is not enabled for this fruit type');
  }

  // Check if quality metrics are provided
  if (!qualityMetrics || qualityMetrics.length === 0) {
    errors.push('Quality metrics are required for pricing calculation');
  }

  // Check if thresholds exist
  if (!thresholds || thresholds.length === 0) {
    errors.push('No discount thresholds configured for this fruit type');
  }

  // Check if quality metrics have valid values
  for (const metric of qualityMetrics) {
    if (metric.value < 0 || metric.value > 100) {
      errors.push(`${metric.metric} value must be between 0 and 100`);
    }
  }

  // Check if thresholds are valid
  for (const threshold of thresholds) {
    if (threshold.limit_value < 0 || threshold.limit_value > 100) {
      errors.push(
        `Threshold for ${threshold.quality_metric} has invalid limit value (must be 0-100)`
      );
    }
  }

  return {
    canCalculate: errors.length === 0,
    errors
  };
}

/**
 * Get applicable threshold for a quality metric
 * Now returns the single threshold for the metric (if any)
 *
 * @param metricName - Name of the quality metric
 * @param thresholds - All available thresholds
 * @returns The threshold for this metric, or null if none exists
 */
export function getApplicableThreshold(
  metricName: string,
  thresholds: DiscountThreshold[]
): DiscountThreshold | null {
  return thresholds.find(
    (threshold) => threshold.quality_metric === metricName
  ) || null;
}

/**
 * Group thresholds by quality metric
 *
 * @param thresholds - Array of thresholds
 * @returns Object with thresholds grouped by metric name
 */
export function groupThresholdsByMetric(
  thresholds: DiscountThreshold[]
): Record<string, DiscountThreshold[]> {
  return thresholds.reduce((acc, threshold) => {
    if (!acc[threshold.quality_metric]) {
      acc[threshold.quality_metric] = [];
    }
    acc[threshold.quality_metric].push(threshold);
    return acc;
  }, {} as Record<string, DiscountThreshold[]>);
}

/**
 * Sort thresholds by min_value for a given metric
 *
 * @param thresholds - Array of thresholds
 * @param metricName - Name of the quality metric
 * @returns Sorted thresholds
 */
export function sortThresholdsByMetric(
  thresholds: DiscountThreshold[],
  metricName: string
): DiscountThreshold[] {
  return thresholds
    .filter(t => t.quality_metric === metricName)
    .sort((a, b) => a.limit_value - b.limit_value);
}

/**
 * Check if a value exceeds the quality limit for a metric
 *
 * @param metricName - Name of the quality metric
 * @param value - Value to check
 * @param thresholds - Array of thresholds
 * @returns True if value exceeds the limit (should be discounted)
 */
export function doesValueExceedLimit(
  metricName: string,
  value: number,
  thresholds: DiscountThreshold[]
): boolean {
  const threshold = getApplicableThreshold(metricName, thresholds);
  return threshold ? value > threshold.limit_value : false;
}

/**
 * Calculate discount for a specific quality metric value
 *
 * @param grossValue - Gross value before discounts
 * @param metricName - Name of the quality metric
 * @param value - Value of the quality metric
 * @param thresholds - Array of thresholds
 * @returns Total discount amount for this metric
 */
export function calculateDiscountForMetric(
  grossValue: number,
  metricName: string,
  value: number,
  thresholds: DiscountThreshold[]
): number {
  const applicableThreshold = getApplicableThreshold(metricName, thresholds);

  if (!applicableThreshold) {
    return 0;
  }

  // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)
  const excessQuality = Math.max(0, value - applicableThreshold.limit_value);
  const discountPercentage = excessQuality; // Direct percentage discount

  return roundToTwoDecimals(grossValue * (discountPercentage / 100));
}

/**
 * Round a number to 2 decimal places
 *
 * @param num - Number to round
 * @returns Rounded number
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Format currency for display
 *
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: $)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format percentage for display
 *
 * @param percentage - Percentage to format
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Validate threshold ranges for overlaps
 *
 * @param thresholds - Array of thresholds for the same metric
 * @returns Object with validation result and any warnings
 */
export function validateThresholdLimits(
  thresholds: DiscountThreshold[]
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const metricsSeen = new Set<string>();

  // Check for duplicate metrics
  for (const threshold of thresholds) {
    if (metricsSeen.has(threshold.quality_metric)) {
      warnings.push(
        `Multiple thresholds found for ${threshold.quality_metric}. Only one limit per metric is allowed.`
      );
    }
    metricsSeen.add(threshold.quality_metric);
  }

  return { isValid: warnings.length === 0, warnings };
}

// ==============================
// WEIGHT DISCOUNT CALCULATION UTILITIES
// ==============================

/**
 * Calculate weight discounts based on quality evaluation data and thresholds
 *
 * @param totalWeight - Total weight in kilograms
 * @param qualityData - Quality evaluation data (moho, humedad, violetas)
 * @param thresholds - Array of discount thresholds
 * @returns Weight discount calculation result
 */
export function calculateWeightDiscounts(
  totalWeight: number,
  qualityData: QualityEvaluationData,
  thresholds: DiscountThreshold[]
): WeightDiscountResult {
  let currentWeight = totalWeight; // Start with original weight
  let totalDiscount = 0;
  const breakdowns: DiscountBreakdownItem[] = [];

  // Process each quality metric in sequence, applying discounts to current final weight
  const metrics = ['moho', 'humedad', 'violetas'] as const;

  for (const metric of metrics) {
    const value = qualityData[metric];
    // Convert metric name to proper case (first letter uppercase, rest lowercase)
    const metricName = metric.charAt(0).toUpperCase() + metric.slice(1).toLowerCase();
    const applicableThreshold = findApplicableThreshold(thresholds, metricName, value);

    if (applicableThreshold) {
      // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)%
      const excessQuality = Math.max(0, value - applicableThreshold.limit_value);
      const discountPercentage = excessQuality; // Direct percentage discount

      if (discountPercentage > 0) {
        // Apply discount to current final weight (not original weight)
        const weightDiscount = currentWeight * (discountPercentage / 100);
        totalDiscount += weightDiscount;

        breakdowns.push({
          parametro: metric.charAt(0).toUpperCase() + metric.slice(1) as 'Moho' | 'Humedad' | 'Violetas',
          umbral: applicableThreshold.limit_value,
          valor: value,
          porcentaje_descuento: discountPercentage,
          peso_descuento: roundToTwoDecimals(weightDiscount)
        });

        // Update current weight for next discount calculation
        currentWeight = currentWeight - weightDiscount;
      }
    }
  }

  return {
    original_weight: totalWeight,
    total_discount: roundToTwoDecimals(totalDiscount),
    final_weight: roundToTwoDecimals(currentWeight),
    breakdowns
  };
}

/**
 * Find applicable threshold for a quality metric value
 *
 * @param thresholds - Array of discount thresholds
 * @param metric - Quality metric name
 * @param value - Quality metric value
 * @returns Applicable threshold or null if none found
 */
export function findApplicableThreshold(
  thresholds: DiscountThreshold[],
  metric: string,
  value: number
): DiscountThreshold | null {
  return thresholds.find(threshold =>
    threshold.quality_metric === metric
  ) || null;
}

/**
 * Validate weight discount calculation inputs
 *
 * @param totalWeight - Total weight to validate
 * @param qualityData - Quality data to validate
 * @param thresholds - Thresholds to validate
 * @returns Validation result with any errors
 */
export function validateWeightDiscountInputs(
  totalWeight: number,
  qualityData: QualityEvaluationData,
  thresholds: DiscountThreshold[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate total weight
  if (totalWeight <= 0) {
    errors.push('Total weight must be positive');
  }

  // Validate quality data ranges
  for (const [metric, value] of Object.entries(qualityData)) {
    if (value < 0 || value > 100) {
      errors.push(`${metric} must be between 0 and 100`);
    }
  }

  // Validate thresholds
  if (!thresholds || thresholds.length === 0) {
    errors.push('No discount thresholds available');
  } else {
    for (const threshold of thresholds) {
      if (threshold.limit_value < 0 || threshold.limit_value > 100) {
        errors.push(`Invalid limit value for ${threshold.quality_metric} (must be 0-100)`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate weight discount for a single quality metric
 *
 * @param totalWeight - Total weight
 * @param metricValue - Quality metric value
 * @param threshold - Applicable threshold
 * @returns Weight discount amount
 */
export function calculateSingleWeightDiscount(
  totalWeight: number,
  metricValue: number,
  threshold: DiscountThreshold
): number {
  // Calculate discount: if quality value > limit, discount = (quality_value - limit_value)%
  const excessQuality = Math.max(0, metricValue - threshold.limit_value);
  const discountPercentage = excessQuality;
  return roundToTwoDecimals(totalWeight * (discountPercentage / 100));
}

/**
 * Get all quality metrics that trigger discounts
 *
 * @param qualityData - Quality evaluation data
 * @param thresholds - Discount thresholds
 * @returns Array of metrics that exceed thresholds
 */
export function getTriggeredMetrics(
  qualityData: QualityEvaluationData,
  thresholds: DiscountThreshold[]
): Array<{
  metric: string;
  value: number;
  threshold: DiscountThreshold;
  discountAmount: number;
}> {
  const triggered: Array<{
    metric: string;
    value: number;
    threshold: DiscountThreshold;
    discountAmount: number;
  }> = [];

  const metrics = ['moho', 'humedad', 'violetas'] as const;

  for (const metric of metrics) {
    const value = qualityData[metric];
    // Convert metric name to proper case (first letter uppercase, rest lowercase)
    const metricName = metric.charAt(0).toUpperCase() + metric.slice(1).toLowerCase();
    const threshold = findApplicableThreshold(thresholds, metricName, value);

    if (threshold) {
      triggered.push({
        metric: metric.charAt(0).toUpperCase() + metric.slice(1),
        value,
        threshold,
        discountAmount: calculateSingleWeightDiscount(100, value, threshold) // Using 100 as base for percentage
      });
    }
  }

  return triggered;
}

/**
 * Check if weight discounts would be applied
 *
 * @param qualityData - Quality evaluation data
 * @param thresholds - Discount thresholds
 * @returns True if any discounts would be applied
 */
export function wouldApplyWeightDiscounts(
  qualityData: QualityEvaluationData,
  thresholds: DiscountThreshold[]
): boolean {
  const metrics = ['moho', 'humedad', 'violetas'] as const;

  for (const metric of metrics) {
    const value = qualityData[metric];
    // Convert metric name to proper case (first letter uppercase, rest lowercase)
    const metricName = metric.charAt(0).toUpperCase() + metric.slice(1).toLowerCase();
    const threshold = findApplicableThreshold(thresholds, metricName, value);

    if (threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Get maximum possible discount for given weight and thresholds
 *
 * @param totalWeight - Total weight
 * @param thresholds - Discount thresholds
 * @returns Maximum discount amount
 */
export function getMaximumPossibleDiscount(
  totalWeight: number,
  thresholds: DiscountThreshold[]
): number {
  // In the new system, maximum discount occurs when quality is 100%
  // Find the lowest limit value (most restrictive threshold)
  if (thresholds.length === 0) return 0;

  const minLimit = Math.min(...thresholds.map(t => t.limit_value));
  const maxDiscountPercentage = 100 - minLimit; // Maximum excess quality

  return roundToTwoDecimals(totalWeight * (maxDiscountPercentage / 100));
}

/**
 * Create weight discount breakdown for display
 *
 * @param result - Weight discount calculation result
 * @param receptionId - Reception ID
 * @param userId - User ID
 * @returns Formatted breakdown for database storage
 */
export function createDiscountBreakdownForStorage(
  result: WeightDiscountResult,
  receptionId: string,
  userId: string
): Array<{
  recepcion_id: string;
  parametro: string;
  umbral: number;
  valor: number;
  porcentaje_descuento: number;
  peso_descuento: number;
  created_by: string;
}> {
  return result.breakdowns.map(breakdown => ({
    recepcion_id: receptionId,
    parametro: breakdown.parametro,
    umbral: breakdown.umbral,
    valor: breakdown.valor,
    porcentaje_descuento: breakdown.porcentaje_descuento,
    peso_descuento: breakdown.peso_descuento,
    created_by: userId
  }));
}

/**
 * Format weight discount breakdown for Spanish display
 *
 * @param breakdown - Discount breakdown item
 * @returns Formatted string in Spanish
 */
export function formatDiscountBreakdownSpanish(breakdown: DiscountBreakdownItem): string {
  const { parametro, valor, umbral, porcentaje_descuento, peso_descuento } = breakdown;

  return `${parametro} (${valor}% > ${umbral}%): -${porcentaje_descuento}% (-${peso_descuento.toFixed(2)} kg)`;
}

/**
 * Combine quality metrics from reception evaluation and lab samples
 *
 * @param receptionQuality - Quality evaluation from reception
 * @param labSamples - Array of lab samples with quality measurements
 * @returns Array of quality metrics for pricing calculation
 */
export function combineQualityMetrics(
  receptionQuality: { moho?: number; humedad?: number; violetas?: number } | null,
  labSamples: Array<{
    moho_percentage?: number | null;
    basura_percentage?: number | null;
    violetas_percentage?: number | null;
  }>
): Array<{ metric: 'Violetas' | 'Humedad' | 'Moho'; value: number; source: string }> {
  const combinedMetrics: Array<{ metric: 'Violetas' | 'Humedad' | 'Moho'; value: number; source: string }> = [];

  // Add reception quality metrics
  if (receptionQuality) {
    if (receptionQuality.violetas !== undefined && typeof receptionQuality.violetas === 'number' && receptionQuality.violetas > 0) {
      combinedMetrics.push({
        metric: 'Violetas',
        value: receptionQuality.violetas,
        source: 'reception_evaluation'
      });
    }
    if (receptionQuality.humedad !== undefined && typeof receptionQuality.humedad === 'number' && receptionQuality.humedad > 0) {
      combinedMetrics.push({
        metric: 'Humedad',
        value: receptionQuality.humedad,
        source: 'reception_evaluation'
      });
    }
    if (receptionQuality.moho !== undefined && typeof receptionQuality.moho === 'number' && receptionQuality.moho > 0) {
      combinedMetrics.push({
        metric: 'Moho',
        value: receptionQuality.moho,
        source: 'reception_evaluation'
      });
    }
  }

  // Add lab sample quality metrics
  labSamples.forEach((sample, index) => {
    if (sample.violetas_percentage !== null && sample.violetas_percentage !== undefined && typeof sample.violetas_percentage === 'number' && sample.violetas_percentage > 0) {
      combinedMetrics.push({
        metric: 'Violetas',
        value: sample.violetas_percentage,
        source: `lab_sample_${index + 1}`
      });
    }
    if (sample.moho_percentage !== null && sample.moho_percentage !== undefined && typeof sample.moho_percentage === 'number' && sample.moho_percentage > 0) {
      combinedMetrics.push({
        metric: 'Moho',
        value: sample.moho_percentage,
        source: `lab_sample_${index + 1}`
      });
    }
    // Note: basura_percentage is not used in pricing thresholds currently
  });

  return combinedMetrics;
}

/**
 * Calculate discount percentage from original and discounted weight
 *
 * @param originalWeight - Original weight
 * @param discountedWeight - Discounted weight
 * @returns Discount percentage
 */
export function calculateDiscountPercentage(
  originalWeight: number,
  discountedWeight: number
): number {
  if (originalWeight <= 0) return 0;

  const discountAmount = originalWeight - discountedWeight;
  return roundToTwoDecimals((discountAmount / originalWeight) * 100);
}
