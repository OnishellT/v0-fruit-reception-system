# Quickstart Guide: Dynamic Quality-Based Pricing System

**Date**: 2025-10-31
**Feature**: Dynamic Quality-Based Pricing System
**Audience**: Administrators and System Implementers

## Overview

This guide helps administrators configure and use the Dynamic Quality-Based Pricing System to automatically calculate discounts based on fruit quality metrics.

## Prerequisites

- Administrator access to the fruit reception system
- Basic understanding of your fruit quality metrics (Violetas, Humedad, Moho)
- Knowledge of base pricing per kilogram for each fruit type

## Getting Started

### Step 1: Enable Quality-Based Pricing for a Fruit Type

1. Navigate to **Dashboard** → **Pricing Configuration**
2. Select a fruit type from the list:
   - Café
   - Cacao
   - Miel
   - Cocos

3. Toggle **"Enable Quality-Based Pricing"** to ON
4. Click **"Save Configuration"**

### Step 2: Configure Discount Thresholds

For each quality metric, create threshold ranges:

#### Example Configuration for Café - Violetas Metric:

| Min Value | Max Value | Discount % |
|-----------|-----------|------------|
| 0         | 5         | 0%         |
| 5         | 15        | 5%         |
| 15        | 30        | 10%        |
| 30        | 50        | 20%        |

**How to Add:**

1. Select the fruit type (e.g., Café)
2. Select quality metric (e.g., Violetas)
3. Click **"Add Threshold"**
4. Enter minimum value
5. Enter maximum value
6. Enter discount percentage (0-100)
7. Click **"Save Threshold"**
8. Repeat for all desired ranges

### Step 3: Configure All Quality Metrics

Repeat Step 2 for each quality metric per fruit type:
- **Violetas** (Purple/Mold detection)
- **Humedad** (Moisture level)
- **Moho** (Mold presence)

### Step 4: Test the Configuration

1. Create a test reception with quality evaluation
2. Verify the pricing breakdown displays correctly
3. Ensure discounts are applied as expected
4. Review the final total

## Using Quality-Based Pricing

### For Reception Operators

When creating a reception with quality evaluation:

1. **Enter Quality Metrics**: Record values for all quality metrics
2. **Save Reception**: System automatically calculates pricing
3. **Review Breakdown**: Pricing details display shows:
   - Base price per kilogram
   - Total weight
   - Gross value (base price × weight)
   - Discounts by quality metric
   - Total discount amount
   - **Final total** (gross value - discounts)

### For Administrators

#### Viewing Pricing History

1. Navigate to **Reception History**
2. Select any reception
3. View **Pricing Details** section
4. See the exact calculation used (immutable)

#### Modifying Pricing Rules

1. Navigate to **Pricing Configuration**
2. Select fruit type to modify
3. Adjust threshold ranges or discount percentages
4. **Important**: Changes only affect NEW receptions
5. Existing receptions retain their original calculations

## Common Scenarios

### Scenario 1: Setting Up Café Pricing

**Goal**: Configure pricing for Café fruit based on quality

**Steps**:
1. Enable quality-based pricing for Café
2. Configure Violetas thresholds:
   - 0-10%: 0% discount
   - 10-25%: 5% discount
   - 25-50%: 15% discount
3. Configure Humidity thresholds:
   - 0-12%: 0% discount
   - 12-20%: 3% discount
   - 20-30%: 8% discount
4. Configure Moho thresholds:
   - 0-5%: 0% discount
   - 5-15%: 10% discount
   - 15-30%: 25% discount

### Scenario 2: Handling Edge Cases

**Quality Value Outside All Ranges**

If a quality metric value doesn't match any threshold:
- **No discount applied** for that metric
- System processes other applicable discounts
- Final total calculated with available discounts

**Missing Quality Metrics**

If quality evaluation is incomplete:
- System prompts to complete all required metrics
- Reception cannot be saved until complete
- Ensures accurate pricing

### Scenario 3: Pricing Multiple Fruit Types

**Best Practices**:
- Configure each fruit type separately
- Use consistent threshold naming
- Document threshold rationale
- Review and adjust quarterly

## Troubleshooting

### Problem: Discount Not Applied

**Possible Causes**:
1. Quality-based pricing not enabled for fruit type
2. Quality metric value outside threshold ranges
3. Missing quality evaluation data

**Solution**:
1. Check pricing configuration is enabled
2. Verify quality metric value falls within defined ranges
3. Ensure all quality metrics are recorded

### Problem: Incorrect Discount Calculation

**Possible Causes**:
1. Overlapping threshold ranges
2. Incorrect percentage values
3. Data entry error

**Solution**:
1. Review threshold configuration
2. Verify no overlapping ranges
3. Check percentage values are correct
4. Review historical calculation (immutable)

### Problem: Configuration Not Saving

**Possible Causes**:
1. Invalid range values (min > max)
2. Duplicate ranges
3. Missing required fields

**Solution**:
1. Ensure minValue ≤ maxValue
2. Check for duplicate threshold ranges
3. Fill all required fields
4. Review validation errors

## Best Practices

### Configuration Management

1. **Start Simple**: Begin with basic threshold ranges
2. **Test Thoroughly**: Create test receptions before production
3. **Document Changes**: Keep notes on why thresholds were adjusted
4. **Regular Review**: Check pricing impact monthly
5. **Version Control**: Only modify when necessary

### Threshold Design

1. **Non-Overlapping**: Ensure ranges don't overlap
2. **Logical Progression**: Higher quality issues → higher discounts
3. **Realistic Values**: Based on actual quality measurements
4. **Market Alignment**: Reflect real-world pricing impact

### Data Integrity

1. **Immutable Calculations**: Never modify historical pricing
2. **Audit Trail**: Review who changed what and when
3. **Backup Strategy**: Regular database backups before changes
4. **Rollback Plan**: Know how to restore previous configuration

## FAQ

**Q: Can I disable quality-based pricing for a fruit type?**
A: Yes. Toggle "Enable Quality-Based Pricing" to OFF. New receptions will use base price only.

**Q: What happens if I change thresholds after creating receptions?**
A: Existing receptions retain their original calculations. Only new receptions use updated thresholds.

**Q: Can multiple thresholds apply to one quality metric?**
A: Yes. If a quality value falls into multiple ranges, all applicable discounts are applied cumulatively.

**Q: How do I know which thresholds were used for a reception?**
A: View the reception's pricing breakdown. It shows all applied discounts and their sources.

**Q: Can I export pricing reports?**
A: Yes. Use the reporting feature to export reception data with full pricing breakdown.

**Q: What if quality metrics show perfect quality?**
A: If no thresholds match, no discounts are applied. Reception uses full base price.

**Q: How are discount percentages calculated?**
A: Each discount percentage is applied to the gross value (base price × total weight).

**Q: Can I set negative discounts (premiums for high quality)?**
A: Currently, the system only supports positive discounts (reductions). Contact support if premiums are needed.

## Support

For technical issues:
1. Check this quickstart guide
2. Review the pricing configuration documentation
3. Contact system administrator
4. Submit support ticket with:
   - Fruit type
   - Quality metrics
   - Expected vs actual pricing
   - Screenshots of configuration

---

**Status**: Quickstart complete - Ready for implementation
**Next Steps**: Follow tasks.md for detailed implementation tasks