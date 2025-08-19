// utils/validation.js

// Validation rules for different field types
export const validationRules = {
  // Project level validations
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
    sanitize: (value) => value.trim().replace(/\s+/g, ' '),
    messages: {
      required: 'Le nom du projet est requis',
      minLength: 'Le nom doit contenir au moins 3 caractères',
      maxLength: 'Le nom ne peut pas dépasser 100 caractères',
      pattern: 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets, underscores et points'
    }
  },
  courseId: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[\p{L}\p{N}\s\-_]+$/u,
    sanitize: (value) => value.trim(),
    messages: {
      required: 'L\'identifiant du cours est requis',
      minLength: 'L\'identifiant doit contenir au moins 2 caractères',
      maxLength: 'L\'identifiant ne peut pas dépasser 50 caractères',
      pattern: 'L\'identifiant peut contenir des lettres (avec accents), chiffres, espaces, tirets et underscores'
    }
  },
  description: {
    required: false,
    maxLength: 500,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'La description ne peut pas dépasser 500 caractères'
    }
  },
  customTheme: {
    required: false,
    pattern: /^#[0-9A-Fa-f]{6}$/,
    sanitize: (value) => value.trim().toLowerCase(),
    messages: {
      pattern: 'La couleur doit être au format hexadécimal (ex: #ff0000)'
    }
  },
  expirationDate: {
    required: false,
    validate: (value) => {
      if (!value) return { isValid: true };
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        isValid: date >= today,
        message: 'La date d\'expiration doit être dans le futur'
      };
    }
  },
  indexTarget: {
    required: false,
    validate: (value) => {
      if (!value) return { isValid: true };
      try {
        JSON.parse(value);
        return { isValid: true };
      } catch (error) {
        return {
          isValid: false,
          message: 'Le format JSON n\'est pas valide'
        };
      }
    },
    sanitize: (value) => {
      if (!value) return value;
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
  },
  pdfFilename: {
    required: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-z0-9\-_]+$/,
    sanitize: (value) => {
      if (!value) return value;
      // Remove file extensions (anything after a dot)
      let sanitized = value.replace(/\.[^.]*$/, '');
      // Convert to lowercase
      sanitized = sanitized.toLowerCase();
      // Remove special characters except hyphens and underscores
      sanitized = sanitized.replace(/[^a-z0-9\-_]/g, '');
      // Remove consecutive hyphens and underscores
      sanitized = sanitized.replace(/[-_]{2,}/g, '-');
      // Remove leading/trailing hyphens and underscores
      sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, '');
      return sanitized;
    },
    messages: {
      minLength: 'Le nom du fichier doit contenir au moins 1 caractère',
      maxLength: 'Le nom du fichier ne peut pas dépasser 100 caractères',
      pattern: 'Le nom du fichier ne peut contenir que des lettres minuscules, chiffres, tirets et underscores (pas d\'extensions)'
    }
  },

  // Activity level validations
  activityTitle: {
    required: true,
    minLength: 2,
    maxLength: 100,
    sanitize: (value) => value.trim().replace(/\s+/g, ' '),
    messages: {
      required: 'Le titre de l\'activité est requis',
      minLength: 'Le titre doit contenir au moins 2 caractères',
      maxLength: 'Le titre ne peut pas dépasser 100 caractères'
    }
  },
  defaultText: {
    required: false,
    maxLength: 2000,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'Le texte par défaut ne peut pas dépasser 2000 caractères'
    }
  },
  contextText: {
    required: false,
    maxLength: 2000,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'Le contexte ne peut pas dépasser 2000 caractères'
    }
  },
  maxCharactersAllowed: {
    required: false,
    min: 1,
    max: 10000,
    validate: (value) => {
      if (!value) return { isValid: true };
      const num = parseInt(value);
      return {
        isValid: num >= 1 && num <= 10000,
        message: 'Le nombre de caractères doit être entre 1 et 10000'
      };
    }
  },
  customPlaceholder: {
    required: false,
    maxLength: 200,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'Le placeholder ne peut pas dépasser 200 caractères'
    }
  }
};

// Main validation function
export function validateField(fieldName, value, rules = null) {
  const rule = rules || validationRules[fieldName];
  if (!rule) {
    return { isValid: true, message: '', sanitizedValue: value };
  }

  let sanitizedValue = value;
  if (rule.sanitize) {
    sanitizedValue = rule.sanitize(value);
  }

  // Check required
  if (rule.required && (!sanitizedValue || (typeof sanitizedValue === 'string' && sanitizedValue.trim() === ''))) {
    return {
      isValid: false,
      message: rule.messages?.required || 'Ce champ est requis',
      sanitizedValue
    };
  }

  // Skip other validations if not required and empty
  if (!rule.required && (!sanitizedValue || (typeof sanitizedValue === 'string' && sanitizedValue.trim() === ''))) {
    return { isValid: true, message: '', sanitizedValue };
  }

  // Check minLength
  if (rule.minLength && typeof sanitizedValue === 'string' && sanitizedValue.length < rule.minLength) {
    return {
      isValid: false,
      message: rule.messages?.minLength || `Minimum ${rule.minLength} caractères requis`,
      sanitizedValue
    };
  }

  // Check maxLength
  if (rule.maxLength && typeof sanitizedValue === 'string' && sanitizedValue.length > rule.maxLength) {
    return {
      isValid: false,
      message: rule.messages?.maxLength || `Maximum ${rule.maxLength} caractères autorisés`,
      sanitizedValue
    };
  }

  // Check min/max for numbers
  if (rule.min !== undefined && !isNaN(sanitizedValue) && parseInt(sanitizedValue) < rule.min) {
    return {
      isValid: false,
      message: rule.messages?.min || `La valeur minimum est ${rule.min}`,
      sanitizedValue
    };
  }

  if (rule.max !== undefined && !isNaN(sanitizedValue) && parseInt(sanitizedValue) > rule.max) {
    return {
      isValid: false,
      message: rule.messages?.max || `La valeur maximum est ${rule.max}`,
      sanitizedValue
    };
  }

  // Check pattern
  if (rule.pattern && typeof sanitizedValue === 'string' && !rule.pattern.test(sanitizedValue)) {
    return {
      isValid: false,
      message: rule.messages?.pattern || 'Format invalide',
      sanitizedValue
    };
  }

  // Custom validation
  if (rule.validate) {
    const customResult = rule.validate(sanitizedValue);
    if (!customResult.isValid) {
      return {
        isValid: false,
        message: customResult.message || 'Validation échouée',
        sanitizedValue
      };
    }
  }

  return { isValid: true, message: '', sanitizedValue };
}

// Validate entire project
export function validateProject(project) {
  const errors = {};
  let hasErrors = false;

  // Validate project-level fields
  Object.keys(validationRules).forEach(fieldName => {
    if (fieldName in project) {
      const result = validateField(fieldName, project[fieldName]);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        hasErrors = true;
      }
    }
  });

  // Validate activities
  if (project.activities) {
    Object.keys(project.activities).forEach(activityId => {
      const activity = project.activities[activityId];
      const activityErrors = {};

      Object.keys(validationRules).forEach(fieldName => {
        if (fieldName in activity) {
          const result = validateField(fieldName, activity[fieldName]);
          if (!result.isValid) {
            activityErrors[fieldName] = result.message;
            hasErrors = true;
          }
        }
      });

      if (Object.keys(activityErrors).length > 0) {
        errors[`activity_${activityId}`] = activityErrors;
      }
    });
  }

  return { isValid: !hasErrors, errors };
}

// Sanitize HTML content
export function sanitizeHtml(html) {
  if (!html) return html;
  
  // Basic HTML sanitization - you might want to use DOMPurify here
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Character count for HTML content (strips HTML tags)
export function getCharacterCount(html) {
  if (!html) return 0;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent?.length || 0;
} 