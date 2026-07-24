# Putaway Test Checklist

> Scope: `putaway` only.

## Purpose

Define the minimum test coverage needed for the first implementation of `putaway`.

## Test Areas

### 1) Create

Cases:

- creates a draft document with lines
- rejects missing `companyId`
- rejects missing `docNumber`
- rejects missing `docDate`
- rejects missing `warehouseId`
- rejects empty `lines`
- rejects line items without `productId`
- rejects line items without `qty`
- rejects line items without `targetLocationId`
- rejects zero or negative quantity

Expected:

- valid payloads create a `draft` document
- invalid payloads fail validation before persistence

### 2) List

Cases:

- returns putaway documents filtered by `companyId`
- returns putaway documents filtered by `warehouseId`
- returns putaway documents filtered by `status`
- returns putaway documents filtered by `docNumber`
- returns putaway documents filtered by date range
- mobile query `status=posted` returns only active tasks

Expected:

- list output is suitable for both admin and mobile use

### 3) Detail

Cases:

- returns header and line data for a valid document
- includes warehouse and relation data needed by executor context
- rejects unknown document ids

Expected:

- detail screen can render the task without an extra fetch pattern

### 4) Update

Cases:

- allows editing a draft document
- allows editing lines while draft
- rejects update on posted document
- rejects update on done document
- rejects update on canceled document

Expected:

- only draft documents are editable

### 5) Post

Cases:

- posts a draft document
- rejects posting a non-draft document
- keeps lines intact after posting
- exposes the document to mobile selection after posting

Expected:

- `draft -> posted` works and nothing else does

### 6) Complete

Cases:

- completes a posted document
- rejects completion of a draft document
- rejects completion of a canceled document
- rejects completion of a done document

Expected:

- `posted -> done` works and removes the document from mobile selection

### 7) Cancel

Cases:

- cancels a draft document
- cancels a posted document
- rejects canceling a done document
- rejects canceling a canceled document

Expected:

- canceled documents are not executable

### 8) Mobile Selection

Cases:

- mobile picker shows only posted documents
- draft documents are not shown
- done documents are not shown
- canceled documents are not shown

Expected:

- dropdown behavior matches the contract document

## Recommended Test Split

### Unit tests

- service validation
- status transition guards
- line validation helpers

### Integration tests

- controller request/response shape
- create -> post -> complete flow
- create -> cancel flow

## Priority Order

1. create validation
2. status transitions
3. mobile list filtering
4. detail payload shape
