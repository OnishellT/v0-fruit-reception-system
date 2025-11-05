# Quick Start Guide: Weight Discount Calculation and Visualization

**Date**: 2025-10-31
**Feature**: Weighted Discount Calculation and Visualization in Receptions

## Overview

This guide provides step-by-step instructions for implementing and testing the weight discount calculation feature. The system automatically applies weight-based discounts to fruit receptions when quality metrics exceed configured thresholds.

## Prerequisites

### Required Dependencies
```typescript
// Already installed in project
- next@16+
- react@19.2.0
- typescript@5.0.2
- @supabase/supabase-js
- zod
- tailwindcss
- playwright (for testing)
```

### Database Requirements
- Supabase PostgreSQL with existing pricing system
- Access to run migration scripts
- Proper RLS policies configured

## Implementation Steps

### Step 1: Database Migration

Run the weight discount migration script:

```bash
# Execute migration script
psql $DATABASE_URL -f scripts/13-add-pricing-to-receptions.sql
```

**Migration Contents**:
```sql
-- Add weight discount columns to receptions table
ALTER TABLE receptions
ADD COLUMN total_peso_original DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_peso_descuento DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_peso_final DECIMAL(10,2) DEFAULT 0;

-- Create discount breakdown table
CREATE TABLE desglose_descuentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
  parametro VARCHAR(50) NOT NULL,
  umbral DECIMAL(5,2) NOT NULL,
  valor DECIMAL(5,2) NOT NULL,
  porcentaje_descuento DECIMAL(5,2) NOT NULL,
  peso_descuento DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  CONSTRAINT unique_recepcion_parametro UNIQUE(recepcion_id, parametro)
);
```

### Step 2: Create Pricing Calculation Utilities

Create `/lib/utils/pricing.ts`:

```typescript
import { DiscountThreshold, QualityEvaluationData, WeightDiscountCalculation } from '@/types/pricing';

export function calculateWeightDiscounts(
  totalWeight: number,
  qualityData: QualityEvaluationData,
  thresholds: DiscountThreshold[]
): WeightDiscountCalculation {
  let totalDiscount = 0;
  const breakdown = [];

  // Process each quality metric
  for (const [metric, value] of Object.entries(qualityData)) {
    const applicableThreshold = findApplicableThreshold(
      thresholds,
      metric.toUpperCase(),
      value
    );

    if (applicableThreshold) {
      const weightDiscount = totalWeight * (applicableThreshold.discount_percentage / 100);
      totalDiscount += weightDiscount;

      breakdown.push({
        parametro: metric.charAt(0).toUpperCase() + metric.slice(1),
        umbral: applicableThreshold.min_value,
        valor: value,
        porcentaje_descuento: applicableThreshold.discount_percentage,
        peso_descuento: parseFloat(weightDiscount.toFixed(2))
      });
    }
  }

  return {
    reception_id: '',
    total_peso_original: totalWeight,
    total_peso_descuento: parseFloat(totalDiscount.toFixed(2)),
    total_peso_final: parseFloat((totalWeight - totalDiscount).toFixed(2)),
    breakdown,
    calculation_timestamp: new Date().toISOString(),
    calculated_by: ''
  };
}

function findApplicableThreshold(
  thresholds: DiscountThreshold[],
  metric: string,
  value: number
): DiscountThreshold | null {
  return thresholds.find(threshold =>
    threshold.quality_metric === metric &&
    value >= threshold.min_value &&
    value <= threshold.max_value
  ) || null;
}
```

### Step 3: Create Server Actions

Create `/lib/actions/pricing.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/client';
import { calculateWeightDiscounts } from '@/lib/utils/pricing';
import {
  WeightDiscountRequestSchema,
  AdminDiscountOverrideRequestSchema
} from '@/lib/types/pricing';

export async function calculateWeightDiscounts(request: WeightDiscountRequest) {
  const supabase = createClient();

  try {
    // Validate request
    const validatedRequest = WeightDiscountRequestSchema.parse(request);

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No autorizado' };
    }

    // Fetch pricing thresholds
    const { data: thresholds, error: thresholdError } = await supabase
      .from('discount_thresholds')
      .select(`
        quality_metric,
        min_value,
        max_value,
        discount_percentage
      `)
      .eq('pricing_rule.fruit_type', validatedRequest.fruit_type_id);

    if (thresholdError) throw thresholdError;

    // Calculate discounts
    const calculation = calculateWeightDiscounts(
      validatedRequest.total_weight,
      validatedRequest.quality_data,
      thresholds || []
    );

    // Save calculation results
    await saveDiscountCalculation(validatedRequest.reception_id, calculation, session.user.id);

    return { success: true, data: calculation };

  } catch (error) {
    console.error('Error calculating weight discounts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

async function saveDiscountCalculation(
  receptionId: string,
  calculation: WeightDiscountCalculation,
  userId: string
) {
  const supabase = createClient();

  // Update reception with weight fields
  await supabase
    .from('receptions')
    .update({
      total_peso_original: calculation.total_peso_original,
      total_peso_descuento: calculation.total_peso_descuento,
      total_peso_final: calculation.total_peso_final,
      updated_at: new Date().toISOString()
    })
    .eq('id', receptionId);

  // Save discount breakdown items
  for (const item of calculation.breakdown) {
    await supabase
      .from('desglose_descuentos')
      .upsert({
        recepcion_id: receptionId,
        parametro: item.parametro,
        umbral: item.umbral,
        valor: item.valor,
        porcentaje_descuento: item.porcentaje_descuento,
        peso_descuento: item.peso_descuento,
        created_by: userId
      }, {
        onConflict: 'recepcion_id,parametro'
      });
  }
}
```

### Step 4: Create UI Components

Create `/components/pricing-breakdown.tsx`:

```typescript
'use client';

import { DiscountBreakdownProps } from '@/lib/types/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PricingBreakdown({
  receptionId,
  isEditable = false,
  onDiscountChange,
  onOverrideSubmit
}: DiscountBreakdownProps) {
  const [breakdown, setBreakdown] = useState<DiscountBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscountBreakdown();
  }, [receptionId]);

  const loadDiscountBreakdown = async () => {
    setLoading(true);
    try {
      const response = await getDiscountBreakdown(receptionId);
      if (response.success && response.data) {
        setBreakdown(response.data);
      }
    } catch (error) {
      console.error('Error loading discount breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando desglose de descuentos...</div>;
  }

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Descuentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay descuentos aplicados</p>
        </CardContent>
      </Card>
    );
  }

  const totalOriginal = breakdown.reduce((sum, item) => sum + item.peso_descuento, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose de Descuentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <div>
              <span className="font-medium">{item.parametro}</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({item.valor}% > {item.umbral}%)
              </span>
            </div>
            <div className="text-right">
              <Badge variant="destructive">
                -{item.porcentaje_descuento}% (-{item.peso_descuento.toFixed(2)} kg)
              </Badge>
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Descuento total aplicado:</span>
            <span className="text-lg font-bold text-destructive">
              -{totalOriginal.toFixed(2)} kg
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Integrate with Reception Form

Update `components/reception-form.tsx`:

```typescript
// Add to form state
const [discountCalculation, setDiscountCalculation] = useState<WeightDiscountCalculation | null>(null);

// Add calculation trigger
useEffect(() => {
  if (formData.total_weight > 0 && qualityData) {
    calculateDiscounts();
  }
}, [formData.total_weight, qualityData, formData.fruit_type_id]);

const calculateDiscounts = async () => {
  if (!formData.id || !formData.fruit_type_id) return;

  try {
    const result = await calculateWeightDiscounts({
      reception_id: formData.id,
      total_weight: formData.total_weight,
      quality_data: qualityData,
      fruit_type_id: formData.fruit_type_id
    });

    if (result.success && result.data) {
      setDiscountCalculation(result.data);
    }
  } catch (error) {
    console.error('Error calculating discounts:', error);
  }
};

// Add to form JSX
{discountCalculation && (
  <PricingBreakdown
    receptionId={formData.id}
    isEditable={session?.user?.role === 'admin'}
  />
)}
```

## Testing

### Unit Tests

Create test file `tests/pricing-calculations.test.js`:

```javascript
import { calculateWeightDiscounts } from '@/lib/utils/pricing';

describe('Weight Discount Calculations', () => {
  test('should apply 5% discount when Moho exceeds threshold', () => {
    const totalWeight = 686;
    const qualityData = { moho: 12, humedad: 8, violetas: 5 };
    const thresholds = [
      {
        quality_metric: 'MOHO',
        min_value: 10,
        max_value: 15,
        discount_percentage: 5
      }
    ];

    const result = calculateWeightDiscounts(totalWeight, qualityData, thresholds);

    expect(result.total_peso_descuento).toBe(34.30);
    expect(result.total_peso_final).toBe(651.70);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].parametro).toBe('Moho');
  });

  test('should apply multiple discounts', () => {
    const totalWeight = 500;
    const qualityData = { moho: 12, humedad: 15, violetas: 8 };
    const thresholds = [
      { quality_metric: 'MOHO', min_value: 10, max_value: 15, discount_percentage: 5 },
      { quality_metric: 'HUMEDAD', min_value: 12, max_value: 18, discount_percentage: 3 }
    ];

    const result = calculateWeightDiscounts(totalWeight, qualityData, thresholds);

    expect(result.total_peso_descuento).toBe(40.00); // 25 + 15
    expect(result.total_peso_final).toBe(460.00);
    expect(result.breakdown).toHaveLength(2);
  });
});
```

### E2E Tests

Create test file `tests/test-discount-functionality.js`:

```javascript
const { test, expect } = require('@playwright/test');

test('discount calculation appears in reception form', async ({ page }) => {
  // Login as operator
  await page.goto('/login');
  await page.fill('[name="username"]', 'operator@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create new reception
  await page.goto('/dashboard/reception/new');
  await page.selectOption('[name="provider_id"]', 'Test Provider');
  await page.selectOption('[name="fruit_type_id"]', 'CAFÉ');
  await page.fill('[name="total_containers"]', '10');

  // Enter quality data that exceeds thresholds
  await page.fill('[name="moho"]', '12'); // Exceeds 10% threshold
  await page.fill('[name="humedad"]', '8'); // Below threshold
  await page.fill('[name="violetas"]', '5'); // Below threshold

  // Check that discount breakdown appears
  await expect(page.locator('text=Desglose de Descuentos')).toBeVisible();
  await expect(page.locator('text=5% (-34.30 kg)')).toBeVisible();
});

test('admin can override discount values', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('[name="username"]', 'admin@test.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Navigate to existing reception with discounts
  await page.goto('/dashboard/reception/123');

  // Verify admin can see edit buttons
  await expect(page.locator('button:has-text("Editar Descuentos")')).toBeVisible();

  // Override discount values
  await page.click('button:has-text("Editar Descuentos")');
  await page.fill('[name="total_peso_descuento"]', '50');
  await page.fill('[name="override_reason"]', 'Ajuste especial cliente');
  await page.click('button:has-text("Guardar Cambios")');

  // Verify override was applied
  await expect(page.locator('text=Descuento total: -50.00 kg')).toBeVisible();
});
```

### Run Tests

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run specific discount tests
npm run test:e2e tests/test-discount-functionality.js
```

## Configuration

### Pricing Threshold Setup

Configure discount thresholds in the database:

```sql
-- Enable quality-based pricing for coffee
INSERT INTO pricing_rules (fruit_type, quality_based_pricing_enabled, created_by)
VALUES ('CAFÉ', true, 'admin-user-id')
ON CONFLICT (fruit_type) DO UPDATE SET
  quality_based_pricing_enabled = true,
  updated_at = NOW(),
  updated_by = 'admin-user-id';

-- Add Moho discount threshold (5% discount for 10-15% moho)
INSERT INTO discount_thresholds (
  pricing_rule_id,
  quality_metric,
  min_value,
  max_value,
  discount_percentage,
  created_by
)
SELECT
  pr.id,
  'Moho',
  10.0,
  15.0,
  5.0,
  'admin-user-id'
FROM pricing_rules pr
WHERE pr.fruit_type = 'CAFÉ';
```

### Environment Variables

Ensure these environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Monitoring

### Key Metrics to Monitor

1. **Performance**:
   - Discount calculation response time
   - Database query performance
   - Form rendering speed

2. **Usage**:
   - Number of discount calculations per day
   - Override frequency by admin users
   - Most common discount triggers

3. **Errors**:
   - Calculation failures
   - Permission denials
   - Validation errors

### Log Examples

```typescript
// Add to server actions
console.log('Discount calculation initiated', {
  receptionId: request.reception_id,
  fruitType: request.fruit_type_id,
  qualityData: request.quality_data,
  userId: session.user.id,
  timestamp: new Date().toISOString()
});

console.log('Discount calculation completed', {
  receptionId,
  originalWeight: calculation.total_peso_original,
  totalDiscount: calculation.total_peso_descuento,
  finalWeight: calculation.total_peso_final,
  breakdownCount: calculation.breakdown.length,
  processingTime: Date.now() - startTime
});
```

## Troubleshooting

### Common Issues

1. **Discounts not calculating**:
   - Check that pricing rules are configured for the fruit type
   - Verify quality thresholds exist
   - Ensure quality data exceeds threshold values

2. **Permission errors**:
   - Verify user session is active
   - Check RLS policies on discount tables
   - Confirm user has access to reception provider

3. **Calculation errors**:
   - Validate quality data ranges (0-100)
   - Check for negative weight values
   - Verify discount percentage ranges (0-100)

### Debug Commands

```sql
-- Check pricing rules configuration
SELECT * FROM pricing_rules WHERE fruit_type = 'CAFÉ';

-- Check discount thresholds
SELECT * FROM discount_thresholds
WHERE pricing_rule_id IN (
  SELECT id FROM pricing_rules WHERE fruit_type = 'CAFÉ'
);

-- Verify discount breakdowns
SELECT * FROM desglose_descuentos WHERE recepcion_id = 'your-reception-id';

-- Check reception weight fields
SELECT
  id,
  total_peso_original,
  total_peso_descuento,
  total_peso_final,
  (total_peso_original - total_peso_descuento) as calculated_final
FROM receptions
WHERE id = 'your-reception-id';
```

## Next Steps

1. **Configure pricing thresholds** for each fruit type
2. **Test discount calculations** with sample data
3. **Train users** on the new discount breakdown display
4. **Monitor system performance** after deployment
5. **Gather user feedback** for future improvements

## Support

For implementation support:
- Check existing pricing system documentation
- Review test cases for expected behavior
- Monitor application logs for errors
- Contact development team for complex issues