# Quickstart: Cacao Processing Module

**Branch**: `004-cacao-processing-module` | **Date**: 2025-11-01 | **Spec**: [/home/dev/Documents/v0-fruit-reception-system/specs/004-cacao-processing-module/spec.md]

This document provides a quickstart guide for developers to use the Cacao Processing API.

## 1. Data Model

The data model for this feature consists of three new tables:
*   `cacao_batches`: Stores information about each batch.
*   `batch_receptions`: A linking table between batches and receptions.
*   `laboratory_samples`: Stores information about each lab sample.

For more details, see the [data-model.md](data-model.md) file.

## 2. API Endpoints

The API provides endpoints for managing batches and lab samples. The full API contract is defined in the [openapi.yml](contracts/openapi.yml) file.

### 2.1. Batches

*   `GET /api/batches`: Get all cacao batches.
*   `POST /api/batches`: Create a new cacao batch.
*   `GET /api/batches/{batchId}`: Get a single cacao batch.
*   `PUT /api/batches/{batchId}`: Update a cacao batch with final dried weight.

### 2.2. Laboratory Samples

*   `GET /api/receptions/{receptionId}/samples`: Get all laboratory samples for a reception.
*   `POST /api/receptions/{receptionId}/samples`: Create a new laboratory sample for a reception.
*   `GET /api/samples/{sampleId}`: Get a single laboratory sample.
*   `PUT /api/samples/{sampleId}`: Update a laboratory sample with quality results.

## 3. Getting Started

1.  **Create a new batch**:
    *   Send a `POST` request to `/api/batches` with a list of reception IDs, batch type, start date, and duration.
2.  **Create a new lab sample**:
    *   Send a `POST` request to `/api/receptions/{receptionId}/samples` with the sample weight and estimated drying days.
3.  **Update a lab sample**:
    *   Send a `PUT` request to `/api/samples/{sampleId}` with the dried sample weight and quality percentages.
4.  **Update a batch**:
    *   Send a `PUT` request to `/api/batches/{batchId}` with the total number of 70kg sacks and the remainder weight.
