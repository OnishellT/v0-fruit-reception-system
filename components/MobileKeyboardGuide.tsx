/**
 * Mobile Keyboard Types Guide for Reception Form
 *
 * This document describes the mobile keyboard optimizations implemented
 * for better user experience on mobile devices.
 */

// ========================================
// KEYBOARD TYPE MAPPINGS
// ========================================

/**
 * NUMERIC FIELDS - Shows numeric keypad (0-9)
 *
 * Used for: Whole numbers, quantities, counts
 * Keyboard: [0] [1] [2] [3] [4] [5] [6] [7] [8] [9]
 *
 * Implementation:
 * - type="number"
 * - inputMode="numeric"
 * - pattern="[0-9]*"
 *
 * Example:
 */
const numericFieldExample = `
<Input
  type="number"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Ej: 25"
/>`;

/**
 * DECIMAL FIELDS - Shows numeric keypad with decimal point
 *
 * Used for: Weight, measurements, prices
 * Keyboard: [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [.]
 *
 * Implementation:
 * - type="number"
 * - inputMode="decimal"
 * - step="0.01" (for two decimal places)
 *
 * Example:
 */
const decimalFieldExample = `
<Input
  type="number"
  inputMode="decimal"
  step="0.01"
  placeholder="Ej: 5.50"
/>`;

/**
 * TEXT FIELDS - Shows standard text keyboard
 *
 * Used for: Names, descriptions, notes
 * Keyboard: Standard QWERTY keyboard with autocomplete
 *
 * Implementation:
 * - type="text" (default)
 * - autoComplete (for suggestions)
 *
 * Example:
 */
const textFieldExample = `
<Textarea
  autoComplete="off"
  placeholder="Observaciones adicionales..."
/>`;

/**
 * SELECT FIELDS - Touch-friendly dropdown
 *
 * Used for: Choosing from predefined options
 * Experience: Large touch targets (44px minimum)
 *
 * Implementation:
 * - Uses Select component with h-11 class
 * - Mobile-optimized select list
 *
 * Example:
 */
const selectFieldExample = `
<Select>
  <SelectTrigger className="h-11">
    <SelectValue placeholder="Seleccione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>`;

// ========================================
// FORM FIELD MAPPINGS IN RECEPTION FORM
// ========================================

export const RECEPTION_FORM_KEYBOARDS = {
  // Form Fields
  totalContainers: {
    label: "Total Contenedores/Sacos",
    type: "numeric",
    keyboard: "0-9",
    purpose: "Whole number count of containers"
  },

  // Detail Fields
  quantity: {
    label: "Cantidad (in details)",
    type: "numeric",
    keyboard: "0-9",
    purpose: "Quantity for this weight entry"
  },

  weight: {
    label: "Peso (kg)",
    type: "decimal",
    keyboard: "0-9 .",
    purpose: "Weight with decimal precision"
  },

  notes: {
    label: "Notas",
    type: "text",
    keyboard: "Standard text",
    purpose: "Additional observations"
  },

  // Select Fields (use dropdown interface)
  provider: {
    label: "Proveedor",
    type: "select",
    keyboard: "N/A - Touch dropdown",
    purpose: "Select from provider list"
  },

  driver: {
    label: "Chofer",
    type: "select",
    keyboard: "N/A - Touch dropdown",
    purpose: "Select from driver list"
  },

  fruitType: {
    label: "Tipo de Fruto",
    type: "select",
    keyboard: "N/A - Touch dropdown",
    purpose: "Select from fruit type list"
  }
};

// ========================================
// MOBILE OPTIMIZATION FEATURES
// ========================================

export const MOBILE_OPTIMIZATIONS = {
  // Touch Targets
  touchTargets: {
    description: "All interactive elements are minimum 44px for easy tapping",
    implementation: "className='h-11' (44px height)"
  },

  // Input Modes
  inputModes: {
    numeric: "For whole numbers (0-9 only)",
    decimal: "For decimal numbers (0-9 and .)",
    text: "For general text input",
    tel: "For phone numbers",
    email: "For email addresses"
  },

  // Placeholders
  placeholders: {
    description: "Helpful examples in placeholders to guide input",
    examples: {
      containers: "Ej: 25",
      quantity: "Ej: 10",
      weight: "Ej: 5.50"
    }
  },

  // Autocomplete
  autocomplete: {
    description: "AutoComplete off to prevent unwanted suggestions",
    purpose: "Avoid interference with numeric inputs"
  },

  // Responsive Sizing
  responsive: {
    textareaRows: {
      mobile: 4,
      desktop: 3
    },
    textareaMinHeight: {
      mobile: "100px"
    }
  }
};

// ========================================
// TESTING CHECKLIST
// ========================================

export const KEYBOARD_TESTING_CHECKLIST = [
  {
    field: "Total Containers",
    expectedKeyboard: "Numeric (0-9)",
    attributes: {
      type: "number",
      inputMode: "numeric",
      pattern: "[0-9]*"
    }
  },
  {
    field: "Quantity (Detail)",
    expectedKeyboard: "Numeric (0-9)",
    attributes: {
      type: "number",
      inputMode: "numeric",
      pattern: "[0-9]*"
    }
  },
  {
    field: "Weight (kg)",
    expectedKeyboard: "Decimal (0-9 .)",
    attributes: {
      type: "number",
      inputMode: "decimal",
      step: "0.01"
    }
  },
  {
    field: "Notes",
    expectedKeyboard: "Standard Text",
    attributes: {
      autoComplete: "off"
    }
  },
  {
    field: "Provider/Driver/Fruit Type",
    expectedKeyboard: "N/A - Dropdown",
    attributes: {
      isSelect: true,
      touchTarget: "44px minimum"
    }
  }
];

// ========================================
// BROWSER COMPATIBILITY
// ========================================

export const BROWSER_SUPPORT = {
  inputMode: {
    supported: ["Chrome 66+", "Safari 12+", "Firefox 95+", "Edge 79+"],
    fallback: "type='number' still works even if inputMode not supported"
  },

  pattern: {
    supported: ["All modern browsers"],
    purpose: "Hint to mobile browsers about expected input format"
  },

  autoComplete: {
    supported: ["All modern browsers"],
    purpose: "Control browser autocomplete behavior"
  }
};

// ========================================
// IMPLEMENTATION GUIDELINES
// ========================================

/**
 * When adding new fields to the reception form, follow these guidelines:
 *
 * 1. NUMERIC FIELDS
 *    - Use inputMode="numeric"
 *    - Add pattern="[0-9]*"
 *    - Use helpful placeholders
 *
 * 2. DECIMAL FIELDS
 *    - Use inputMode="decimal"
 *    - Set appropriate step value (0.01, 0.1, etc.)
 *    - Use helpful placeholders
 *
 * 3. TEXT FIELDS
 *    - Add autoComplete="off" for controlled inputs
 *    - Use descriptive placeholders
 *    - Consider increasing rows on mobile
 *
 * 4. SELECT FIELDS
 *    - Maintain minimum 44px touch target
 *    - Use clear, descriptive options
 *    - Test on actual mobile devices
 *
 * 5. TOUCH TARGETS
 *    - Minimum 44px (iOS) / 48px (Android) recommended
 *    - Use h-11 class (44px) as default
 *    - Adequate spacing between elements
 */

// ========================================
// EXAMPLE USAGE
// ========================================

export function ExampleUsage() {
  return (
    <div className="space-y-4">
      {/* Numeric Input */}
      <div>
        <label>Containers</label>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej: 25"
          className="h-11 w-full"
        />
      </div>

      {/* Decimal Input */}
      <div>
        <label>Weight (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="Ej: 5.50"
          className="h-11 w-full"
        />
      </div>

      {/* Text Area */}
      <div>
        <label>Notes</label>
        <textarea
          placeholder="Observaciones adicionales..."
          autoComplete="off"
          rows={4}
          className="w-full"
        />
      </div>
    </div>
  );
}
