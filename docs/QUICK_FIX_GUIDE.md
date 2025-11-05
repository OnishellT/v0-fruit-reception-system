# 🎯 Quick Fix Guide: Lab Sample Quality Discounts

## The Problem (Before Fix)
```
When you updated a lab sample with quality results:
  Lab Sample Updated → ❌ NOTHING HAPPENED → No discounts calculated
```

## The Solution (After Fix)
```
When you update a lab sample with quality results:
  Lab Sample Updated → ✅ TRIGGER FIRES → Discounts calculated & displayed
```

---

## 📋 Step-by-Step: How to See It Working

### Step 1: Apply the Migration (One-time setup)
```bash
psql -d $DATABASE_URL -f scripts/36-add-lab-sample-trigger.sql
```

### Step 2: Update a Lab Sample with Quality Results

**Go to:** Reception Details → Lab Sample → Update

**Enter these sample values:**
- Dried Sample Weight: `3.5 kg`
- Violetas: `33%`  ← Above 10% threshold = 5% discount
- Moho: `33%`      ← Above 5% threshold = 10% discount  
- Basura: `33%`    ← Above 10% threshold = 5% discount

### Step 3: View Reception Details

**Scroll down to find:**
```
┌────────────────────────────────────────────────────────────┐
│ 🔻 Desglose de Descuentos por Calidad                       │
├────────────────────────────────────────────────────────────┤
│ Violetas (Muestra Lab)  [NEW!]                             │
│ Valor: 33.0% | Umbral: 10.0% | Descuento: 5.0%           │
│                                              -41.00 kg    │
│                                                            │
│ Moho (Muestra Lab)  [NEW!]                                 │
│ Valor: 33.0% | Umbral: 5.0% | Descuento: 10.0%          │
│                                              -82.00 kg    │
│                                                            │
│ Basura (Muestra Lab)  [NEW!]                               │
│ Valor: 33.0% | Umbral: 10.0% | Descuento: 5.0%          │
│                                              -41.00 kg    │
├────────────────────────────────────────────────────────────┤
│ Total Descontado:                             -164.00 kg  │
└────────────────────────────────────────────────────────────┘
```

### Step 4: Verify in Weight Summary

**In the "Resumen" card, you should see:**
```
Peso Original:  820.00 kg
Descuento por Calidad:  -164.00 kg  ← Lab sample discounts included!
Peso Final:     656.00 kg
```

---

## 🧪 Test It Now!

### Quick Test Script:
```bash
./test-lab-sample-discounts.sh
```

This will check:
- ✅ Migration 36 applied
- ✅ Triggers exist
- ✅ Test data present

---

## 📊 What Changed?

### Before (Broken):
- Lab samples: Created ✅
- Quality entered: ✅
- **Discounts calculated: ❌**
- **Shown in UI: ❌**

### After (Fixed):
- Lab samples: Created ✅
- Quality entered: ✅
- **Discounts calculated: ✅** (via trigger)
- **Shown in UI: ✅** (in discount breakdown)

---

## 🔍 Key Files

| File | Purpose |
|------|---------|
| `scripts/36-add-lab-sample-trigger.sql` | Database migration with triggers |
| `test-lab-sample-discounts.sh` | Test script to verify fix |
| `docs/LAB_SAMPLE_DISCOUNT_FIX.md` | Full documentation |

---

## ⚡ The Magic: How the Trigger Works

```sql
-- Trigger on laboratory_samples table
CREATE TRIGGER auto_apply_quality_discounts_lab_samples
  AFTER INSERT OR UPDATE ON laboratory_samples
  FOR EACH ROW EXECUTE FUNCTION trigger_lab_sample_quality_update();

-- When quality fields change, this function runs:
1. Checks if quality metrics changed
2. Calls apply_quality_discounts(reception_id)
3. Calculates discounts for lab sample metrics
4. Inserts into desglose_descuentos table
5. Updates reception totals
```

**Result:** Discounts appear instantly in the UI! 🎉

---

## 💡 Pro Tips

1. **Separate Discount Systems**: Lab sample discounts stack with reception-level quality discounts
2. **Threshold-based**: Discounts only apply when metrics exceed thresholds
3. **Real-time**: Discounts appear immediately after saving lab sample
4. **Audit Trail**: All discounts logged in `desglose_descuentos` table

---

**🎉 Your lab sample quality discounts are now fully integrated!**
