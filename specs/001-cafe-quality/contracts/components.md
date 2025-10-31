# Component Contract: Quality Evaluation Modal

**Phase**: 1 - Design
**Date**: 2025-10-31

## Component: QualityEvaluationModal

### Purpose
Modal dialog component for displaying and editing quality evaluation data for Café Seco receptions.

### Location
`components/quality-evaluation-modal.tsx`

### Props Interface

```typescript
interface QualityEvaluationModalProps {
  /** Reception ID to associate quality data with */
  recepcionId: string;

  /** Reception details including fruit type/subtype */
  reception: {
    id: string;
    reception_number: string;
    fruit_type: string;
    fruit_subtype: string;
  };

  /** Current user's role */
  userRole: 'admin' | 'operator';

  /** Existing quality data (null if not created yet) */
  existingQuality?: {
    id: string;
    violetas: number;
    humedad: number;
    moho: number;
  } | null;

  /** Callback invoked after successful save */
  onSaved?: () => void;

  /** Callback invoked when modal is closed */
  onClose?: () => void;

  /** Whether modal is currently open */
  isOpen: boolean;
}
```

## Component Behavior

### Open/Close
- **isOpen=true**: Modal is visible and interactive
- **isOpen=false**: Modal is hidden
- **Escape key**: Closes modal (unless form has unsaved changes)
- **Click outside**: Closes modal (unless form has unsaved changes)

### Mode Selection
**Read-Only Mode** (userRole='operator' OR existingQuality exists):
- All fields are disabled
- "Cerrar" button only
- No validation messages

**Edit Mode** (userRole='admin' AND no existingQuality):
- All fields are enabled
- "Guardar" and "Cancelar" buttons
- Validation enabled

**View Mode** (userRole='admin' AND existingQuality exists):
- All fields are enabled with pre-filled values
- "Guardar" and "Cancelar" buttons
- Validation enabled

## Form Fields

### Field: Violetas
- **Type**: Number input with step="0.01"
- **Label**: "Violetas (%)"
- **Placeholder**: "0.00"
- **Validation**: 0 ≤ value ≤ 100
- **Required**: Yes

### Field: Humedad
- **Type**: Number input with step="0.01"
- **Label**: "Humedad (%)"
- **Placeholder**: "0.00"
- **Validation**: 0 ≤ value ≤ 100
- **Required**: Yes

### Field: Moho
- **Type**: Number input with step="0.01"
- **Label**: "Moho (%)"
- **Placeholder**: "0.00"
- **Validation**: 0 ≤ value ≤ 100
- **Required**: Yes

## Validation Rules

### Client-Side Validation
```typescript
const qualitySchema = z.object({
  violetas: z.number()
    .min(0, 'Violetas must be at least 0')
    .max(100, 'Violetas cannot exceed 100'),
  humedad: z.number()
    .min(0, 'Humedad must be at least 0')
    .max(100, 'Humedad cannot exceed 100'),
  moho: z.number()
    .min(0, 'Moho must be at least 0')
    .max(100, 'Moho cannot exceed 100'),
});
```

### Server-Side Validation
Re-validated using Zod in server actions (defense in depth).

## State Management

```typescript
interface ModalState {
  // Form data
  violetas: string;  // String for controlled input
  humedad: string;
  moho: string;

  // UI state
  isSubmitting: boolean;
  errors: {
    violetas?: string;
    humedad?: string;
    moho?: string;
    general?: string;
  };

  // Form dirty state
  isDirty: boolean;
}
```

## Actions

### Handle Submit
1. **Validate form** using Zod schema
2. **Show errors** for any invalid fields
3. **Call server action** (createQualityEvaluation or updateQualityEvaluation)
4. **Handle response**:
   - Success: Close modal, call onSaved(), refresh page data
   - Error: Display error message
5. **Set isSubmitting=false**

### Handle Cancel
1. **Check if form is dirty**
2. **If dirty**: Show confirmation dialog ("Discard changes?")
3. **Reset form** to original values or empty
4. **Close modal**
5. **Call onClose()**

### Handle Close (X button or click outside)
1. **Check if form is dirty**
2. **If dirty**: Show confirmation dialog
3. **Reset form** to original values
4. **Close modal**
5. **Call onClose()**

## Rendering

### Modal Structure
```jsx
<Dialog open={isOpen} onOpenChange={handleOpenChange}>
  <DialogContent className="quality-evaluation-modal">
    <DialogHeader>
      <DialogTitle>
        Evaluación de Calidad — Café Seco
      </DialogTitle>
      <DialogDescription>
        Recepción: {reception.reception_number}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <DialogFooter>
        {/* Buttons based on mode */}
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Button Configuration
**Read-Only Mode**:
```jsx
<Button onClick={onClose}>Cerrar</Button>
```

**Edit/View Mode**:
```jsx
<Button type="button" variant="outline" onClick={handleCancel}>
  Cancelar
</Button>
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Guardando...' : 'Guardar'}
</Button>
```

## Error Messages

### Validation Errors
- "Violetas must be at least 0"
- "Violetas cannot exceed 100"
- "Humedad must be at least 0"
- "Humedad cannot exceed 100"
- "Moho must be at least 0"
- "Moho cannot exceed 100"
- "All fields are required"

### Server Errors
- "Unauthorized: Please log in"
- "Forbidden: Only administrators can modify quality data"
- "Validation failed: Please check your inputs"
- "Server error: Please try again later"

## Accessibility

### ARIA Attributes
- `aria-labelledby`: References dialog title
- `aria-describedby`: References form description
- `aria-required`: Set on required fields
- `aria-invalid`: Set on fields with errors

### Keyboard Navigation
- **Tab**: Navigate between form fields
- **Shift+Tab**: Navigate backwards
- **Enter**: Submit form (when focused on submit button)
- **Escape**: Close modal (with confirmation if dirty)

## Styling

### CSS Classes
- `.quality-evaluation-modal`: Modal container
- `.quality-evaluation-form`: Form container
- `.quality-field`: Individual field container
- `.quality-field-error`: Error state styling

### Responsive Design
- **Desktop**: Modal centered on screen
- **Mobile**: Full-screen modal with inset padding
- **Small screens**: Form fields stack vertically

## Integration Points

### With Server Actions
- `createQualityEvaluation()`: Called when creating new quality data
- `updateQualityEvaluation()`: Called when updating existing quality data
- `getQualityEvaluation()`: Called on modal open to load existing data

### With Receptions Table
- Receives `existingQuality` prop from parent
- Calls `onSaved()` callback to refresh table data
- Button visibility controlled by parent component

### With Authentication
- Receives `userRole` to determine permissions
- Modal mode automatically adjusted based on role

---

**Component contract completed**: 2025-10-31
**Implementation**: `components/quality-evaluation-modal.tsx`
