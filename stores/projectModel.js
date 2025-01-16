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
        "excluded": false
      },
      "courseId": {
        "label": "Identificant du cours",
        "type": "string",
        "value": "L'apprentissage du savoir faire...",
        "editable": true,
        "excluded": false
      },

      "description": {
        "label": "Description du projet",
        "type": "string",
        "value": "...",
        "editable": true,
        "excluded": false
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
          "brio": "Bleu Brio",
          "ul-red": "Rouge UL",
          "ul-yellow": "Or UL"
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
          "excluded": false
      },
  
      "pdfFilename": {
        "label": "Nom du fichier PDF",
        "type": "string",
        "value": "Journal_de_bord-M2.pdf",
        "editable": false,
        "excluded": false
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
        "excluded": false
      },

      "published": {
          "label": "Publié",
          "type": "toggle",
          "value": true,
          "editable": true,
          "excluded": false
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
        "excluded": false
      },
      "defaultText": {
        "label": "Texte par défaut",
        "type": "html",
        "value": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua…</p>",
        "editable": true,
        "excluded": false
      },
      "contextText": {
        "label": "Contexte de l'activité",
        "type": "html",
        "value": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua…</p>",
        "editable": true,
        "excluded": false
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
        "excluded": false
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
        "excluded": false
      }
    },
  }),

});

