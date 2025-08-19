// utils/projectValidation.js

import { validateField, validationRules } from './validation.js';

// Project profile structure validation
export const profileValidationRules = {
  // Project-level profile fields
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
  description: {
    required: false,
    maxLength: 500,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'La description ne peut pas dépasser 500 caractères'
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
  lang: {
    required: true,
    pattern: /^(fr|en|es|de|it|pt)$/,
    sanitize: (value) => value.toLowerCase().trim(),
    messages: {
      required: 'La langue est requise',
      pattern: 'La langue doit être fr, en, es, de, it ou pt'
    }
  },
  published: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'Le statut de publication est requis',
      type: 'Le statat de publication doit être un booléen'
    }
  },
  useCustomTheme: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'L\'utilisation d\'un thème personnalisé est requise',
      type: 'L\'utilisation d\'un thème personnalisé doit être un booléen'
    }
  },
  customTheme: {
    required: false,
    pattern: /^#[0-9A-Fa-f]{6}$/,
    sanitize: (value) => value.trim().toLowerCase(),
    validate: (value, context) => {
      if (!value && !context.useCustomTheme) return { isValid: true };
      if (context.useCustomTheme && !value) {
        return { isValid: false, message: 'Une couleur personnalisée est requise quand useCustomTheme est activé' };
      }
      if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return { isValid: false, message: 'La couleur doit être au format hexadécimal (ex: #ff0000)' };
      }
      return { isValid: true };
    },
    messages: {
      pattern: 'La couleur doit être au format hexadécimal (ex: #ff0000)'
    }
  },
  theme: {
    required: true,
    pattern: /^(brio|classic|modern|minimal)$/,
    sanitize: (value) => value.trim().toLowerCase(),
    messages: {
      required: 'Le thème est requis',
      pattern: 'Le thème doit être brio, classic, modern ou minimal'
    }
  },
  useExpirationDate: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'L\'utilisation d\'une date d\'expiration est requise',
      type: 'L\'utilisation d\'une date d\'expiration doit être un booléen'
    }
  },
  expirationDate: {
    required: false,
    validate: (value, context) => {
      if (!value && !context.useExpirationDate) return { isValid: true };
      if (context.useExpirationDate && !value) {
        return { isValid: false, message: 'Une date d\'expiration est requise quand useExpirationDate est activé' };
      }
      if (value) {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          return { isValid: false, message: 'La date d\'expiration doit être dans le futur' };
        }
      }
      return { isValid: true };
    }
  },
  maintenanceMode: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'Le mode maintenance est requis',
      type: 'Le mode maintenance doit être un booléen'
    }
  },
  pdfFilename: {
    required: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-z0-9\-_]+$/,
    sanitize: (value) => {
      if (!value) return value;
      let sanitized = value.replace(/\.[^.]*$/, '');
      sanitized = sanitized.toLowerCase();
      sanitized = sanitized.replace(/[^a-z0-9\-_]/g, '');
      sanitized = sanitized.replace(/[-_]{2,}/g, '-');
      sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, '');
      return sanitized;
    },
    messages: {
      minLength: 'Le nom du fichier doit contenir au moins 1 caractère',
      maxLength: 'Le nom du fichier ne peut pas dépasser 100 caractères',
      pattern: 'Le nom du fichier ne peut contenir que des lettres minuscules, chiffres, tirets et underscores'
    }
  }
};

// Activity validation rules
export const activityValidationRules = {
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
  contextText: {
    required: false,
    maxLength: 2000,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'Le contexte ne peut pas dépasser 2000 caractères'
    }
  },
  customPlaceholder: {
    required: false,
    maxLength: 200,
    sanitize: (value) => value.trim(),
    messages: {
      maxLength: 'Le placeholder ne peut pas dépasser 200 caractères'
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
  isEndpoint: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'Le statut endpoint est requis',
      type: 'Le statut endpoint doit être un booléen'
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
  useCharactersLimit: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'L\'utilisation de limite de caractères est requise',
      type: 'L\'utilisation de limite de caractères doit être un booléen'
    }
  },
  useCustomPlaceholder: {
    required: true,
    type: 'boolean',
    messages: {
      required: 'L\'utilisation de placeholder personnalisé est requise',
      type: 'L\'utilisation de placeholder personnalisé doit être un booléen'
    }
  },
  token: {
    required: true,
    minLength: 10,
    validate: (value) => {
      if (!value || value === '_') return { isValid: false, message: 'Le token doit être généré' };
      return { isValid: true };
    },
    messages: {
      required: 'Le token est requis',
      minLength: 'Le token doit contenir au moins 10 caractères'
    }
  },
  fieldName: {
    required: false,
    pattern: /^[a-zA-Z0-9\-_]+$/,
    sanitize: (value) => value.trim(),
    messages: {
      pattern: 'Le nom du champ ne peut contenir que des lettres, chiffres, tirets et underscores'
    }
  },
  index: {
    required: true,
    min: 0,
    validate: (value) => {
      if (value === null || value === undefined) return { isValid: false, message: 'L\'index est requis' };
      const num = parseInt(value);
      return {
        isValid: num >= 0,
        message: 'L\'index doit être un nombre positif ou zéro'
      };
    }
  }
};

// Validate a single activity
export function validateActivity(activity, activityId) {
  const errors = {};
  let hasErrors = false;

  // Validate each field in the activity
  Object.keys(activityValidationRules).forEach(fieldName => {
    if (fieldName in activity) {
      const result = validateField(fieldName, activity[fieldName], activityValidationRules[fieldName]);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        hasErrors = true;
      }
    } else if (activityValidationRules[fieldName].required) {
      errors[fieldName] = activityValidationRules[fieldName].messages.required;
      hasErrors = true;
    }
  });

  // Validate required fields that might be missing
  const requiredFields = ['activityTitle', 'isEndpoint', 'useCharactersLimit', 'useCustomPlaceholder', 'token', 'index'];
  requiredFields.forEach(field => {
    if (!(field in activity)) {
      errors[field] = `${field} est requis`;
      hasErrors = true;
    }
  });

  // Validate boolean fields
  const booleanFields = ['isEndpoint', 'useCharactersLimit', 'useCustomPlaceholder'];
  booleanFields.forEach(field => {
    if (field in activity && typeof activity[field] !== 'boolean') {
      errors[field] = `${field} doit être un booléen`;
      hasErrors = true;
    }
  });

  // Validate numeric fields
  const numericFields = ['maxCharactersAllowed', 'index'];
  numericFields.forEach(field => {
    if (field in activity && isNaN(parseInt(activity[field]))) {
      errors[field] = `${field} doit être un nombre`;
      hasErrors = true;
    }
  });

  return { isValid: !hasErrors, errors };
}

// Validate the entire profile structure
export function validateProfile(profile) {
  const errors = {};
  let hasErrors = false;

  // STRICT MODE: Check for extra/unknown fields
  const allowedFields = Object.keys(profileValidationRules).concat(['activities']);
  const extraFields = Object.keys(profile).filter(field => !allowedFields.includes(field));

  if (extraFields.length > 0) {
    errors.extraFields = `Champs non autorisés détectés: ${extraFields.join(', ')}. Seuls les champs définis dans les règles de validation sont autorisés.`;
    hasErrors = true;
  }

  // Validate profile-level fields
  Object.keys(profileValidationRules).forEach(fieldName => {
    if (fieldName in profile) {
      const result = validateField(fieldName, profile[fieldName], profileValidationRules[fieldName]);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        hasErrors = true;
      }
    } else if (profileValidationRules[fieldName].required) {
      errors[fieldName] = profileValidationRules[fieldName].messages.required;
      hasErrors = true;
    }
  });

  // Validate required profile fields
  const requiredProfileFields = ['name', 'courseId', 'lang', 'published', 'useCustomTheme', 'theme', 'useExpirationDate', 'maintenanceMode'];
  requiredProfileFields.forEach(field => {
    if (!(field in profile)) {
      errors[field] = `${field} est requis dans le profil`;
      hasErrors = true;
    }
  });

  // Validate activities object
  if (!profile.activities || typeof profile.activities !== 'object') {
    errors.activities = 'Les activités sont requises et doivent être un objet';
    hasErrors = true;
  } else {
    const activitiesErrors = {};
    let activitiesHaveErrors = false;

    Object.keys(profile.activities).forEach(activityId => {
      const activity = profile.activities[activityId];
      
      if (typeof activity !== 'object' || activity === null) {
        activitiesErrors[activityId] = 'L\'activité doit être un objet valide';
        activitiesHaveErrors = true;
        return;
      }

      // STRICT MODE: Check for extra fields in activities
      const allowedActivityFields = Object.keys(activityValidationRules);
      const extraActivityFields = Object.keys(activity).filter(field => !allowedActivityFields.includes(field));

      if (extraActivityFields.length > 0) {
        activitiesErrors[activityId] = {
          ...activitiesErrors[activityId],
          extraFields: `Champs non autorisés dans l'activité: ${extraActivityFields.join(', ')}. Seuls les champs définis dans les règles de validation d'activité sont autorisés.`
        };
        activitiesHaveErrors = true;
      }

      const activityValidation = validateActivity(activity, activityId);
      if (!activityValidation.isValid) {
        activitiesErrors[activityId] = {
          ...activitiesErrors[activityId],
          ...activityValidation.errors
        };
        activitiesHaveErrors = true;
      }
    });

    if (activitiesHaveErrors) {
      errors.activities = activitiesErrors;
      hasErrors = true;
    }

    // Validate that there's at least one activity
    if (Object.keys(profile.activities).length === 0) {
      errors.activities = 'Au moins une activité est requise';
      hasErrors = true;
    }

    // Validate that there's exactly one endpoint activity
    const endpointActivities = Object.values(profile.activities).filter(activity => activity.isEndpoint);
    if (endpointActivities.length === 0) {
      errors.activities = 'Au moins une activité endpoint est requise';
      hasErrors = true;
    } else if (endpointActivities.length > 1) {
      errors.activities = 'Une seule activité endpoint est autorisée';
      hasErrors = true;
    }
  }

  // Validate conditional fields
  if (profile.useCustomTheme && !profile.customTheme) {
    errors.customTheme = 'Une couleur personnalisée est requise quand useCustomTheme est activé';
    hasErrors = true;
  }

  if (profile.useExpirationDate && !profile.expirationDate) {
    errors.expirationDate = 'Une date d\'expiration est requise quand useExpirationDate est activé';
    hasErrors = true;
  }

  return { isValid: !hasErrors, errors };
}

// Sanitize profile data
export function sanitizeProfile(profile) {
  // STRICT MODE: Only keep known fields
  const sanitized = {};

  // Only include fields defined in profileValidationRules
  Object.keys(profileValidationRules).forEach(fieldName => {
    if (fieldName in profile) {
      sanitized[fieldName] = profile[fieldName];
    }
  });

  // Always include activities (required)
  if (profile.activities) {
    sanitized.activities = {};
    
    Object.keys(profile.activities).forEach(activityId => {
      const activity = profile.activities[activityId];
      if (typeof activity === 'object' && activity !== null) {
        // Only keep known activity fields
        const sanitizedActivity = {};
        Object.keys(activityValidationRules).forEach(fieldName => {
          if (fieldName in activity) {
            sanitizedActivity[fieldName] = activity[fieldName];
          }
        });
        sanitized.activities[activityId] = sanitizedActivity;
      }
    });
  }

  // Sanitize profile-level fields
  Object.keys(profileValidationRules).forEach(fieldName => {
    if (fieldName in sanitized && profileValidationRules[fieldName].sanitize) {
      sanitized[fieldName] = profileValidationRules[fieldName].sanitize(sanitized[fieldName]);
    }
  });

  // Sanitize activities
  if (sanitized.activities) {
    Object.keys(sanitized.activities).forEach(activityId => {
      const activity = sanitized.activities[activityId];
      Object.keys(activityValidationRules).forEach(fieldName => {
        if (fieldName in activity && activityValidationRules[fieldName].sanitize) {
          activity[fieldName] = activityValidationRules[fieldName].sanitize(activity[fieldName]);
        }
      });
    });
  }

  return sanitized;
}

// Validate and sanitize profile in one function
export function validateAndSanitizeProfile(profile) {
  const sanitized = sanitizeProfile(profile);
  const validation = validateProfile(sanitized);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    sanitizedProfile: sanitized
  };
} 