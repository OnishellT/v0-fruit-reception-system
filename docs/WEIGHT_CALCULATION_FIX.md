# Weight Calculation Fix - Migration 29

## Summary

Fixed the reception details table to properly display **all weight adjustments** including:
- Original weight
- Quality discounts (from quality evaluation)
- Lab sample adjustments (wet → dry weight difference)
- Final weight (after all adjustments)

## What Was Changed

### 1. Database Schema (Migration 29)

**Added to `reception_details` table:**
- `lab_sample_adjustment` - Proportional lab sample weight adjustment for each detail row

**Updated trigger function `apply_quality_discounts`:**
- Now calculates lab sample adjustment at the reception level
- Distributes lab adjustment proportionally across all detail rows
- Formula: `final_weight = original - quality_discounts + lab_adjustment`

**Added new trigger `apply_lab_sample_adjustment`:**
- Fires when lab sample weights are updated
- Automatically recalculates final weights
- Keeps data in sync in real-time

### 2. UI Changes (app/dashboard/reception/[id]/page.tsx)

**Updated table columns:**
1. **Peso Original (kg)** - Original weight
2. **Desc. Calidad (kg)** - Quality discount amount
3. **Ajuste Lab (kg)** - Lab sample adjustment (shown in blue, + for gain, - for loss)
4. **Peso Final (kg)** - Final weight after all adjustments (shown in green)
5. **Desc. Total (%)** - Total discount percentage

**Updated summary row:**
- Shows totals for all columns
- Displays lab sample adjustment separately
- Shows proper percentage calculation

**Updated summary card:**
- Separates quality discounts from lab sample adjustments
- Shows wet/dry lab sample weights
- Calculates adjustment in real-time

## How It Works

### Weight Calculation Formula

```
Final Weight = Original Weight - Quality Discounts + Lab Sample Adjustment

Where:
- Quality Discounts = Sum of (Violetas + Humedad + Moho) discounts
- Lab Sample Adjustment = (Dried Weight - Wet Weight)
```

### Example

**Input:**
- Original weight: 100 kg
- Quality evaluation: Violetas = 6% (triggers 2% discount)
- Lab sample: Wet = 5 kg, Dry = 3 kg (loss of 2 kg)

**Calculation:**
```
Quality discount = 100 kg × 2% = 2 kg
Lab adjustment = 3 kg - 5 kg = -2 kg
Final weight = 100 kg - 2 kg + (-2 kg) = 96 kg
```

**Display in UI:**
- Peso Original: 100.00 kg
- Desc. Calidad: 2.00 kg (red)
- Ajuste Lab: -2.00 kg (blue)
- Peso Final: 96.00 kg (green, bold)

## Quality Measurement System Integration

The quality measurement system continues to work exactly as before:

1. User clicks "Registrar Calidad" button
2. Enters quality values (Violetas, Humedad, Moho)
3. Database trigger fires automatically
4. Trigger calculates discounts and updates:
   - `desglose_descuentos` table (breakdown)
   - `receptions.total_peso_descuento`
   - `receptions.total_peso_final`
   - `reception_details.discounted_weight`
   - `reception_details.lab_sample_adjustment` (NEW!)
5. UI displays updated values in real-time

## Benefits

✅ **Complete Transparency**: Users can see exactly how the final weight is calculated
✅ **Stackable Discounts**: Quality + Lab samples work together seamlessly
✅ **Proportional Distribution**: Lab adjustments distributed fairly across all fruit types
✅ **Real-time Updates**: Changes to lab samples automatically update final weights
✅ **Better UX**: Clear color coding (red=discounts, blue=lab, green=final)

## Testing

To test the system:

1. Create a new reception with 100 kg
2. Add a lab sample (wet: 5 kg, dry: 3 kg)
3. Click "Registrar Calidad" and enter values
4. Observe the details table shows:
   - Original: 100.00 kg
   - Desc. Calidad: X.XX kg (based on quality)
   - Ajuste Lab: -2.00 kg (5-3)
   - Peso Final: XX.XX kg (100 - quality - 2)

## Migration Files

- `scripts/29-fix-reception-details-final-weight.sql` - Database schema and trigger updates
- `app/dashboard/reception/[id]/page.tsx` - UI display updates

---

**Migration 29 Status**: ✅ Applied Successfully
**UI Status**: ✅ Updated
**Testing**: ✅ Ready for testing
