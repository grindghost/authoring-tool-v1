# Validation System Implementation

This document describes the comprehensive validation system implemented for the project editor.

## Overview

The validation system provides real-time data validation, character limits, and sanitization for all input fields in the project editor. It prevents saving projects with invalid data and provides clear error messages to users.

## Components

### 1. Validation Utility (`utils/validation.js`)

Contains all validation logic, rules, and helper functions:

- **Validation Rules**: Defined for each field type with specific constraints
- **Field Validation**: Individual field validation with sanitization
- **Project Validation**: Complete project validation including activities
- **HTML Sanitization**: Basic HTML content sanitization
- **Character Counting**: HTML-aware character counting

### 2. Updated Project Model Store (`stores/projectModel.js`)

Enhanced with validation rules for each field:

- Added `validation` property to each field definition
- Includes required, minLength, maxLength, pattern, and custom validation rules
- Supports both project-level and activity-level validations

### 3. Validation Summary Component (`components/ValidationSummary.vue`)

Displays all validation errors in a compact, organized format:

- Groups errors by project parameters and activities
- Shows field labels and error messages
- Provides error count
- Only displays when there are validation errors

### 4. Enhanced Editor Page (`pages/editor/[id].vue`)

Integrated validation throughout the interface:

- Real-time field validation on input and blur
- Visual error indicators (red borders)
- Character count displays
- Disabled save button when validation fails
- Validation alert overlay
- Error messages under each field

## Validation Rules

### Project-Level Fields

| Field | Required | Min Length | Max Length | Pattern | Custom Validation |
|-------|----------|------------|------------|---------|-------------------|
| name | Yes | 3 | 100 | Alphanumeric, spaces, hyphens, underscores, dots | - |
| courseId | Yes | 2 | 50 | Alphanumeric, hyphens, underscores | - |
| description | No | - | 500 | - | - |
| customTheme | No | - | - | Hex color (#RRGGBB) | - |
| expirationDate | No | - | - | - | Future date only |
| indexTarget | No | - | - | - | Valid JSON |

### Activity-Level Fields

| Field | Required | Min Length | Max Length | Pattern | Custom Validation |
|-------|----------|------------|------------|---------|-------------------|
| activityTitle | Yes | 2 | 100 | - | - |
| defaultText | No | - | 2000 | - | HTML content |
| contextText | No | - | 2000 | - | HTML content |
| maxCharactersAllowed | No | 1 | 10000 | - | Numeric range |
| customPlaceholder | No | - | 200 | - | - |

## Features

### Real-Time Validation
- Fields are validated as users type
- Immediate feedback with error messages
- Visual indicators (red borders) for invalid fields

### Character Counting
- Shows current character count vs. maximum allowed
- HTML-aware counting (strips HTML tags for accurate count)
- Updates in real-time

### Save Prevention
- Save button is disabled when validation errors exist
- Clear error summary displayed
- Validation alert overlay for failed save attempts

### Sanitization
- Input sanitization to prevent XSS attacks
- HTML content sanitization using DOMPurify
- Automatic trimming and formatting

### Error Display
- Individual field error messages
- Validation summary component
- Organized error grouping by section

## Usage

### Adding New Validation Rules

1. Add validation rules to `utils/validation.js`:
```javascript
newField: {
  required: true,
  minLength: 5,
  maxLength: 100,
  pattern: /^[a-zA-Z]+$/,
  messages: {
    required: 'This field is required',
    minLength: 'Minimum 5 characters',
    maxLength: 'Maximum 100 characters',
    pattern: 'Only letters allowed'
  }
}
```

2. Update the project model store with validation metadata:
```javascript
newField: {
  label: "New Field",
  type: "string",
  editable: true,
  validation: {
    required: true,
    minLength: 5,
    maxLength: 100,
    pattern: "^[a-zA-Z]+$"
  }
}
```

3. Add validation to the template:
```vue
<input
  v-model="project.newField"
  :class="{ 'border-red-500': getFieldError('newField') }"
  @input="validateProjectField('newField', $event.target.value)"
  @blur="validateProjectField('newField', $event.target.value)"
/>
<div v-if="getFieldError('newField')" class="text-red-500 text-sm mt-1">
  {{ getFieldError('newField') }}
</div>
```

### Custom Validation Functions

For complex validation logic, add custom validation functions:

```javascript
customField: {
  required: false,
  validate: (value) => {
    // Custom validation logic
    if (someCondition) {
      return {
        isValid: false,
        message: 'Custom error message'
      };
    }
    return { isValid: true };
  }
}
```

## Error Handling

The system provides multiple levels of error feedback:

1. **Field-level errors**: Red borders and messages under each field
2. **Summary errors**: ValidationSummary component shows all errors
3. **Save prevention**: Disabled save button with validation alert
4. **Real-time feedback**: Immediate validation on input

## Security

- HTML sanitization prevents XSS attacks
- Input validation prevents malicious data
- Server-side validation should also be implemented
- DOMPurify integration for safe HTML content

## Performance

- Validation runs on input events (debounced)
- Efficient error state management
- Minimal re-renders with Vue reactivity
- Lazy validation for complex fields 