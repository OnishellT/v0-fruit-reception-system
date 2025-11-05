# Data Model: Cacao Processing Module

**Branch**: `004-cacao-processing-module` | **Date**: 2025-11-01 | **Spec**: [/home/dev/Documents/v0-fruit-reception-system/specs/004-cacao-processing-module/spec.md]

This document defines the data model for the Cacao Processing feature, based on the entities identified in the feature specification.

## 1. ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    cacao_batches {
        id UUID PK
        batch_type TEXT
        start_date TIMESTAMPTZ
        duration INTEGER
        total_wet_weight DECIMAL
        total_dried_weight DECIMAL
        status TEXT
        expected_completion_date TIMESTAMPTZ
        total_sacos_70kg INTEGER
        remainder_kg DECIMAL
    }

    batch_receptions {
        batch_id UUID FK
        reception_id UUID FK
        wet_weight_contribution DECIMAL
        percentage_of_total DECIMAL
        proportional_dried_weight DECIMAL
    }

    laboratory_samples {
        id UUID PK
        reception_id UUID FK
        sample_weight DECIMAL
        estimated_drying_days INTEGER
        status TEXT
        dried_sample_kg DECIMAL
        violetas_percentage DECIMAL
        moho_percentage DECIMAL
        basura_percentage DECIMAL
    }

    receptions {
        id UUID PK
        -- other reception fields
    }

    cacao_batches ||--o{ batch_receptions : has
    receptions ||--o{ batch_receptions : has
    receptions ||--|| laboratory_samples : has
```

## 2. Entities

### 2.1. `cacao_batches`

Represents a single drying and/or fermentation process.

| Field                      | Type        | Constraints              | Description                                                                 |
| -------------------------- | ----------- | ------------------------ | --------------------------------------------------------------------------- |
| `id`                       | `UUID`      | Primary Key, Default `gen_random_uuid()` | Unique identifier for the batch.                                            |
| `batch_type`               | `TEXT`      | Not Null                 | Type of batch (e.g., 'Drying', 'Fermentation', 'Combined').                 |
| `start_date`               | `TIMESTAMPTZ` | Not Null                 | The date the batch processing started.                                      |
| `duration`                 | `INTEGER`   | Not Null                 | The estimated duration of the batch processing in days.                     |
| `total_wet_weight`         | `DECIMAL`   |                          | The total wet weight of all receptions in the batch.                        |
| `total_dried_weight`       | `DECIMAL`   |                          | The total dried weight of the batch after processing.                       |
| `status`                   | `TEXT`      | Not Null, Default `'In progress'` | The current status of the batch (e.g., 'In progress', 'Completed').         |
| `expected_completion_date` | `TIMESTAMPTZ` |                          | The expected completion date of the batch, calculated from `start_date` and `duration`. |
| `total_sacos_70kg`         | `INTEGER`   |                          | The number of 70kg sacks of dried cacao.                                    |
| `remainder_kg`             | `DECIMAL`   |                          | The remaining weight of dried cacao in kg.                                  |

### 2.2. `batch_receptions`

A linking table that associates a specific reception with a Cacao Batch.

| Field                         | Type      | Constraints              | Description                                                                 |
| ----------------------------- | --------- | ------------------------ | --------------------------------------------------------------------------- |
| `batch_id`                    | `UUID`      | Foreign Key to `cacao_batches.id` | The ID of the batch.                                                        |
| `reception_id`                | `UUID`      | Foreign Key to `receptions.id` | The ID of the reception.                                                    |
| `wet_weight_contribution`     | `DECIMAL`   |                          | The wet weight contribution of the reception to the batch.                  |
| `percentage_of_total`         | `DECIMAL`   |                          | The percentage of the total wet weight of the batch that this reception represents. |
| `proportional_dried_weight`   | `DECIMAL`   |                          | The calculated share of the final dried weight for this reception.          |

### 2.3. `laboratory_samples`

Represents a small sample taken from a single reception for early quality analysis.

| Field                   | Type      | Constraints              | Description                                                                 |
| ----------------------- | --------- | ------------------------ | --------------------------------------------------------------------------- |
| `id`                    | `UUID`      | Primary Key, Default `gen_random_uuid()` | Unique identifier for the sample.                                           |
| `reception_id`          | `UUID`      | Foreign Key to `receptions.id`, Unique | The ID of the parent reception.                                             |
| `sample_weight`         | `DECIMAL`   | Not Null                 | The initial weight of the sample.                                           |
| `estimated_drying_days` | `INTEGER`   | Not Null                 | The estimated number of days for the sample to dry.                         |
| `status`                | `TEXT`      | Not Null, Default `'Drying'` | The current status of the sample (e.g., 'Drying', 'Completed', 'Result Entered', 'Failed'). |
| `dried_sample_kg`       | `DECIMAL`   |                          | The weight of the sample after drying.                                      |
| `violetas_percentage`   | `DECIMAL`   |                          | The percentage of violetas in the sample.                                   |
| `moho_percentage`       | `DECIMAL`   |                          | The percentage of moho (mold) in the sample.                                |
| `basura_percentage`     | `DECIMAL`   |                          | The percentage of basura (trash) in the sample.                             |

## 3. Validation Rules & State Transitions

### 3.1. Validation Rules

*   `cacao_batches.total_dried_weight` should not be greater than `cacao_batches.total_wet_weight`.
*   Weights and percentages must be non-negative numeric values.

### 3.2. State Transitions

*   **`laboratory_samples.status`**:
    *   `Drying` -> `Completed`: When `estimated_drying_days` have passed.
    *   `Completed` -> `Result Entered`: When the user inputs the quality results.
    *   `Drying` or `Completed` -> `Failed`/`Cancelled`: If the sample is lost or contaminated.
*   **`cacao_batches.status`**:
    *   `In progress` -> `Completed`: When the user inputs the final dried weight.
