/**
 * Unit tests for pricing calculation utilities
 * Tests the core financial calculation logic
 */

import { describe, it, expect } from 'vitest';
import {
    calculateWeightDiscounts,
    calculatePricing,
    validateWeightDiscountInputs,
    validatePricingCalculation,
    roundToTwoDecimals,
    findApplicableThreshold,
} from '../../src/lib/utils/pricing';
import type { DiscountThreshold, QualityEvaluationData } from '../../src/lib/actions/types';

describe('Weight Discount Calculations', () => {
    const standardThresholds: DiscountThreshold[] = [
        {
            id: '1',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Moho',
            limit_value: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '2',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Humedad',
            limit_value: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '3',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Violetas',
            limit_value: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    describe('Test Set 1: Standard Case', () => {
        it('calculates sequential discounts correctly', () => {
            const qualityData: QualityEvaluationData = {
                moho: 12,
                humedad: 18,
                violetas: 8,
            };

            const result = calculateWeightDiscounts(1000, qualityData, standardThresholds);

            // Moho: 12% - 10% = 2% discount on 1000kg = 20kg → 980kg
            expect(result.breakdowns[0].parametro).toBe('Moho');
            expect(result.breakdowns[0].peso_descuento).toBe(20.0);

            // Humedad: 18% - 15% = 3% discount on 980kg = 29.4kg → 950.6kg
            expect(result.breakdowns[1].parametro).toBe('Humedad');
            expect(result.breakdowns[1].peso_descuento).toBe(29.4);

            // Violetas: 8% - 5% = 3% discount on 950.6kg = 28.518kg → 922.082kg
            expect(result.breakdowns[2].parametro).toBe('Violetas');
            expect(result.breakdowns[2].peso_descuento).toBeCloseTo(28.52, 2);

            // Totals
            expect(result.original_weight).toBe(1000);
            expect(result.total_discount).toBeCloseTo(77.92, 2);
            expect(result.final_weight).toBeCloseTo(922.08, 2);
        });
    });

    describe('Test Set 2: No Discounts', () => {
        it('returns original weight when quality below all thresholds', () => {
            const qualityData: QualityEvaluationData = {
                moho: 5,
                humedad: 10,
                violetas: 3,
            };

            const result = calculateWeightDiscounts(500, qualityData, standardThresholds);

            expect(result.original_weight).toBe(500);
            expect(result.total_discount).toBe(0);
            expect(result.final_weight).toBe(500);
            expect(result.breakdowns).toHaveLength(0);
        });
    });

    describe('Test Set 3: Maximum Discounts', () => {
        it('calculates maximum discounts correctly', () => {
            const qualityData: QualityEvaluationData = {
                moho: 100,
                humedad: 100,
                violetas: 100,
            };

            const result = calculateWeightDiscounts(1000, qualityData, standardThresholds);

            // Moho: 100% - 10% = 90% discount on 1000kg = 900kg → 100kg
            expect(result.breakdowns[0].peso_descuento).toBe(900.0);

            // Humedad: 100% - 15% = 85% discount on 100kg = 85kg → 15kg
            expect(result.breakdowns[1].peso_descuento).toBe(85.0);

            // Violetas: 100% - 5% = 95% discount on 15kg = 14.25kg → 0.75kg
            expect(result.breakdowns[2].peso_descuento).toBe(14.25);

            expect(result.total_discount).toBe(999.25);
            expect(result.final_weight).toBe(0.75);
        });
    });

    describe('Test Set 4: Zero Quality Values', () => {
        it('returns original weight for zero quality values', () => {
            const qualityData: QualityEvaluationData = {
                moho: 0,
                humedad: 0,
                violetas: 0,
            };

            const result = calculateWeightDiscounts(750, qualityData, standardThresholds);

            expect(result.original_weight).toBe(750);
            expect(result.total_discount).toBe(0);
            expect(result.final_weight).toBe(750);
            expect(result.breakdowns).toHaveLength(0);
        });
    });

    describe('Test Set 5: Single Metric Over Threshold', () => {
        it('applies discount for only the metric that exceeds threshold', () => {
            const qualityData: QualityEvaluationData = {
                moho: 15,
                humedad: 10,
                violetas: 2,
            };

            const result = calculateWeightDiscounts(800, qualityData, standardThresholds);

            // Only Moho exceeds threshold: 15% - 10% = 5% discount on 800kg = 40kg
            expect(result.breakdowns).toHaveLength(1);
            expect(result.breakdowns[0].parametro).toBe('Moho');
            expect(result.breakdowns[0].peso_descuento).toBe(40.0);

            expect(result.total_discount).toBe(40.0);
            expect(result.final_weight).toBe(760);
        });
    });
});

describe('Pricing Calculations', () => {
    describe('calculatePricing', () => {
        it('calculates price correctly with discounted weight', () => {
            const basePricePerKg = 25.50;
            const finalWeight = 922.08; // After discounts

            const result = calculatePricing(basePricePerKg, finalWeight, [], []);

            const expectedTotal = roundToTwoDecimals(25.50 * 922.08);
            expect(result.gross_value).toBeCloseTo(23513.04, 2);
            expect(result.final_total).toBeCloseTo(23513.04, 2);
            expect(result.total_discount_amount).toBe(0); // No price discounts
        });

        it('calculates price without discounts', () => {
            const basePricePerKg = 30.00;
            const finalWeight = 500; // No discounts

            const result = calculatePricing(basePricePerKg, finalWeight, [], []);

            expect(result.gross_value).toBe(15000.00);
            expect(result.final_total).toBe(15000.00);
        });
    });
});

describe('Validation Functions', () => {
    const validThresholds: DiscountThreshold[] = [
        {
            id: '1',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Moho',
            limit_value: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    describe('validateWeightDiscountInputs', () => {
        it('validates correct inputs', () => {
            const result = validateWeightDiscountInputs(
                1000,
                { moho: 12, humedad: 15, violetas: 8 },
                validThresholds
            );

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects negative weight', () => {
            const result = validateWeightDiscountInputs(
                -100,
                { moho: 12, humedad: 15, violetas: 8 },
                validThresholds
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Total weight must be positive');
        });

        it('rejects out-of-range quality data', () => {
            const result = validateWeightDiscountInputs(
                1000,
                { moho: 150, humedad: -5, violetas: 8 },
                validThresholds
            );

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('rejects missing thresholds', () => {
            const result = validateWeightDiscountInputs(
                1000,
                { moho: 12, humedad: 15, violetas: 8 },
                []
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('No discount thresholds available');
        });
    });
});

describe('Utility Functions', () => {
    describe('roundToTwoDecimals', () => {
        it('rounds correctly to 2 decimal places', () => {
            expect(roundToTwoDecimals(10.123)).toBe(10.12);
            expect(roundToTwoDecimals(10.126)).toBe(10.13);
            expect(roundToTwoDecimals(10.1)).toBe(10.1);
            expect(roundToTwoDecimals(10)).toBe(10);
        });
    });

    describe('findApplicableThreshold', () => {
        const thresholds: DiscountThreshold[] = [
            {
                id: '1',
                pricing_rule_id: 'rule-1',
                quality_metric: 'Moho',
                limit_value: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: '2',
                pricing_rule_id: 'rule-1',
                quality_metric: 'Humedad',
                limit_value: 15,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        it('finds correct threshold for metric', () => {
            const threshold = findApplicableThreshold(thresholds, 'Moho', 12);
            expect(threshold).not.toBeNull();
            expect(threshold?.quality_metric).toBe('Moho');
            expect(threshold?.limit_value).toBe(10);
        });

        it('returns null for non-existent metric', () => {
            const threshold = findApplicableThreshold(thresholds, 'Violetas', 8);
            expect(threshold).toBeNull();
        });
    });
});

describe('Sequential vs Parallel Discount Application', () => {
    const thresholds: DiscountThreshold[] = [
        {
            id: '1',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Moho',
            limit_value: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '2',
            pricing_rule_id: 'rule-1',
            quality_metric: 'Humedad',
            limit_value: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    it('proves discounts are applied sequentially', () => {
        const qualityData: QualityEvaluationData = {
            moho: 20,    // 10% discount
            humedad: 20, // 10% discount
            violetas: 0,
        };

        const result = calculateWeightDiscounts(1000, qualityData, thresholds);

        // Sequential: 1000 → (1000 - 100=900) → (900 - 90=810)
        // Parallel would be: 1000 - 100 - 100 = 800
        expect(result.final_weight).toBe(810); // Not 800!

        // This proves sequential application
        expect(result.breakdowns[0].peso_descuento).toBe(100); // 10% of 1000
        expect(result.breakdowns[1].peso_descuento).toBe(90);  // 10% of 900 (not 1000!)
    });
});
