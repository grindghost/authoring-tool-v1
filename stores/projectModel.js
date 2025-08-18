// stores/projectModel.js
import { defineStore } from 'pinia';

export const useProjectModelStore = defineStore('projectModel', {
  state: () => ({
    projectParams: {
      "name": {
        "label": "Nom du projet",
        "type": "string",
        "value": "Nom du projet",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": true,
          "minLength": 3,
          "maxLength": 100,
          "pattern": "^[a-zA-Z0-9\\s\\-_\\.]+$"
        }
      },
      "courseId": {
        "label": "Identificant du cours",
        "type": "string",
        "value": "L'apprentissage du savoir faire...",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": true,
          "minLength": 2,
          "maxLength": 50,
          "pattern": "^[a-zA-Z0-9\\-_]+$"
        }
      },

      "description": {
        "label": "Description du projet",
        "type": "string",
        "value": "...",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "maxLength": 500
        }
      },
  
      "lang": {
        "label": "Langue",
        "type": "dropdown",
        "value": "1",
        "options": {
          "fr": "fr",
          "en": "en"
        },
        "editable": true,
        "excluded": false
      },
      "theme": {
        "label": "Thème",
        "type": "dropdown",
        "value": "1",
        "options": {
          "brio": "Primary (bleu)",
          "ul-red": "Rouge",
          "ul-yellow": "Jaune"
        },
        "editable": true,
        "excluded": false
      },
  
      "useCustomTheme": {
          "label": "Utiliser un thème différent",
          "type": "toggle",
          "value": false,
          "editable": true,
          "excluded": false
      },
  
      "customTheme": {
        "label": "Couleur hexadécimale",
          "type": "string",
          "value": "#00ff33",
          "editable": true,
          "excluded": false,
          "validation": {
            "required": false,
            "pattern": "^#[0-9A-Fa-f]{6}$"
          }
      },
  
      "pdfFilename": {
        "label": "Nom du fichier PDF",
        "type": "string",
        "value": "Journal_de_bord-M2.pdf",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "minLength": 1,
          "maxLength": 100,
          "pattern": "^[a-z0-9\\-_]+$"
        }
      },
      "pdfFileSize": {
        "label": "Poids du PDF",
        "type": "string",
        "value": "1.17 MB",
        "editable": false,
        "excluded": false
      },
      "pdfURL": {
        "label": "URL du PDF",
        "type": "string",
        "value": "https://...",
        "editable": false,
        "excluded": false
      },
      "pdfCoverImgUrl": {
        "label": "URL de la couverture",
        "type": "string",
        "value": "https://...",
        "editable": false,
        "excluded": false
      },

      "useExpirationDate": {
        "label": "Expiration",
        "type": "toggle",
        "value": false,
        "editable": true,
        "excluded": false
    },
  
      "expirationDate": {
        "label": "Date d'expiration",
        "type": "date",
        "value": "",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "custom": "futureDate"
        }
      },

      "published": {
          "label": "Publié",
          "type": "toggle",
          "value": true,
          "editable": true,
          "excluded": false
      },

      "indexTarget": {
        "label": "Index Target (JSON)",
        "type": "textarea",
        "value": "{\n  \"activityId\": \"fboxlto895-jpxhskc284\",\n  \"registration\": \"fboxlto895-jpxhskc284\",\n  \"idcontenubrio\": \"fboxlto895-jpxhskc284\"\n}",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "custom": "json"
        }
      },
  
      "author": {
        "label": "Auteur",
        "type": "string",
        "value": "{\"id\":\"user_2p0BqBNl3j6GIwAPVhGfgxxK0xm\",\"firstName\":\"Ulaval\",\"lastName\":\"Devteam\"}",
        "editable": false,
        "excluded": true
      }
    },
    activitiesParams: {
      "activityTitle": {
        "label": "Titre de l'activité",
        "type": "string",
        "value": "Exercise 1",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": true,
          "minLength": 2,
          "maxLength": 100
        }
      },
      "defaultText": {
        "label": "Texte par défaut",
        "type": "html",
        "value": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua…</p>",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "maxLength": 2000
        }
      },
      "contextText": {
        "label": "Contexte de l'activité",
        "type": "html",
        "value": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua…</p>",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "maxLength": 2000
        }
      },
      "isEndpoint": {
        "label": "Point de terminaison",
        "type": "toggle",
        "value": false,
        "editable": true,
        "excluded": false
      },
      "useCharactersLimit": {
        "label": "Limiter les caractères",
        "type": "toggle",
        "value": false,
        "editable": true,
        "excluded": false
      },
      "maxCharactersAllowed": {
        "label": "Nombre de caractères autorisés",
        "type": "number",
        "value": 500,
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "min": 1,
          "max": 10000
        }
      },
      "useCustomPlaceholder": {
        "label": "Utiliser un placeholder personnalisé",
        "type": "toggle",
        "value": false,
        "editable": true,
        "excluded": false
      },
      "customPlaceholder": {
        "label": "Placeholder personnalisé",
        "type": "string",
        "value": "Entrez votre réflexion ici...",
        "editable": true,
        "excluded": false,
        "validation": {
          "required": false,
          "maxLength": 200
        }
      }
    },
  }),

});

