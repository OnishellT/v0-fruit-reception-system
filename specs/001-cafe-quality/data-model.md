# Data Model: Post-Reception Quality Evaluation (Café Seco)

**Phase**: 1 - Design
**Date**: 2025-10-31

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Users       │     │   Receptions     │     │  Calidad_Cafe   │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ username        │     │ reception_number │     │ recepcion_id(FK)│
│ role            │────▶│ provider_id(FK)  │◀────┤ violetas        │
│ is_active       │     │ driver_id(FK)    │     │ humedad         │
│ created_at      │     │ fruit_type       │     │ moho            │
│ updated_at      │     │ fruit_subtype    │     │ created_by(FK)  │
└─────────────────┘     │ total_containers │     │ updated_by(FK)  │
                        │ total_weight     │     │ created_at      │
                        │ status           │     │ updated_at      │
                        │ created_at       │     └─────────────────┘
                        │ updated_at       │
                        └──────────────────┘
```

## Entities

### 1. Calidad_Cafe (Quality Evaluation)

**Purpose**: Store post-reception quality evaluation data for Café Seco receptions

**Fields**:
- `id` (UUID, Primary Key, Auto-generated)
  - Type: UUID
  - Default: gen_random_uuid()
  - Description: Unique identifier

- `recepcion_id` (UUID, Foreign Key → receptions.id)
  - Type: UUID
  - Constraints: NOT NULL, REFERENCES receptions(id) ON DELETE CASCADE
  - Description: Links to the reception being evaluated

- `violetas` (Decimal, NOT NULL)
  - Type: DECIMAL(5,2)
  - Constraints: CHECK (violetas >= 0 AND violetas <= 100)
  - Description: Percentage of purple grains (0-100)

- `humedad` (Decimal, NOT NULL)
  - Type: DECIMAL(5,2)
  - Constraints: CHECK (humedad >= 0 AND humedad <= 100)
  - Description: Moisture level percentage (0-100)

- `moho` (Decimal, NOT NULL)
  - Type: DECIMAL(5,2)
  - Constraints: CHECK (moho >= 0 AND moho <= 100)
  - Description: Percentage of grains affected by mold (0-100)

- `created_by` (UUID, Foreign Key → users.id)
  - Type: UUID
  - Constraints: NOT NULL, REFERENCES users(id)
  - Description: User who created the quality record

- `updated_by` (UUID, Foreign Key → users.id)
  - Type: UUID
  - Constraints: NOT NULL, REFERENCES users(id)
  - Description: User who last updated the record

- `created_at` (Timestamp, NOT NULL)
  - Type: TIMESTAMPTZ
  - Default: now()
  - Description: Record creation timestamp

- `updated_at` (Timestamp, NOT NULL)
  - Type: TIMESTAMPTZ
  - Default: now()
  - Description: Last update timestamp

**Constraints**:
- UNIQUE(recepcion_id) - Only one quality evaluation per reception
- CHECK: All quality metrics must be between 0 and 100 inclusive

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (recepcion_id)
- INDEX (created_by)
- INDEX (updated_by)
- FOREIGN KEY (recepcion_id) REFERENCES receptions(id) ON DELETE CASCADE

**RLS Policies**:
```sql
-- Allow authenticated users to SELECT
CREATE POLICY "Authenticated users can view quality data"
ON calidad_cafe FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify quality data"
ON calidad_cafe FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_active = true
  )
);
```

## Validation Rules

### Quality Metrics
1. **Range Validation**: All quality metrics (violetas, humedad, moho) must be between 0 and 100
2. **Required Fields**: All quality metrics are mandatory for a complete evaluation
3. **Uniqueness**: Only one quality evaluation per reception (enforced at database level)

### Business Rules
1. **Eligibility**: Only receptions with fruit_type = 'CAFÉ' and fruit_subtype = 'Seco' can have quality evaluations
2. **Permissions**: Only users with role = 'admin' can create or modify quality data
3. **Audit Trail**: All actions must record who created/updated (created_by, updated_by)

## State Transitions

### Quality Evaluation Lifecycle

```
No Quality Data
      ↓ (Admin clicks "Registrar Calidad" and saves data)
Quality Evaluation Created
      ↓ (Admin clicks "Editar Calidad" and modifies data)
Quality Evaluation Updated
      ↓ (No further transitions - evaluation persists with reception)
Quality Evaluation Finalized
```

**States**:
- **None**: Reception exists but no quality data recorded
- **Recorded**: Quality evaluation created, all metrics have values
- **Updated**: Quality evaluation modified from original values
- **Finalized**: Quality evaluation complete (no more changes expected)

## Relationships

### Calidad_Cafe → Receptions (Many-to-One)
- **Cardinality**: Many calidad_cafe records can reference one reception
- **Business Rule**: UNIQUE constraint ensures only one quality record per reception
- **Deletion**: CASCADE DELETE - if reception is deleted, quality evaluation is also deleted

### Calidad_Cafe → Users (Many-to-One)
- **created_by**: Links to user who created the evaluation
- **updated_by**: Links to user who last updated the evaluation
- **Constraint**: Both fields are mandatory for audit trail

## Integration with Existing Schema

### Extends Receptions
The quality evaluation extends the reception lifecycle with post-reception data collection. The `recepcion_id` FK creates a tight coupling between a reception and its quality evaluation.

### Aligns with Users
Uses the same user identification and role-based access pattern as the rest of the system. The `created_by` and `updated_by` fields follow the audit trail pattern used elsewhere.

### Follows Existing Patterns
- **UUID primary keys**: Consistent with other tables
- **Timestamps**: Uses same created_at/updated_at pattern
- **Soft delete**: NOT IMPLEMENTED - quality evaluations are tied to reception lifecycle
- **RLS policies**: Follows existing authentication-based policies
- **Audit fields**: Consistent with other entities

## Future Extensions

### Price Adjustment Integration
The quality metrics will later be used to calculate price adjustments:
- Each metric (violetas, humedad, moho) will have configurable discount thresholds
- Discount calculation will be performed in a separate module
- Current schema designed to support this future feature

### Multi-Quality Evaluations
Future requirement may allow multiple quality evaluations over time:
- Schema already supports this with timestamps
- Would require removing UNIQUE constraint
- Current implementation keeps UNIQUE for simplicity

### Additional Quality Metrics
Future versions may add more quality metrics (e.g., "Granos_Vacios", "Impurezas"):
- Schema easily extensible with new DECIMAL(5,2) fields
- Each new metric would need CHECK constraint (0-100)
- Validation schema would need updating

---

**Data model completed**: 2025-10-31
**Next**: Generate API contracts and quickstart guide
