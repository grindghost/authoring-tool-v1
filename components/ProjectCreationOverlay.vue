<template>
  <div class="overlay" v-if="showOverlay" @click="cancelOverlay">
    <div class="overlay-content" @click.stop>
      <h3>Créer un nouveau projet</h3>
      
      <div class="p-4 bg-gray-100 rounded-md mt-2 mb-4 border-l-8 border-primary"> 
      <ul class="max-w-md space-y-1 text-gray-500 list-inside text-left w-full text-[0.9rem] leading-tight">
        <li class="flex items-center">
            <svg :class="projectName ?  'text-green-500' : 'text-gray-500'" class="w-3.5 h-3.5 me-2 shrink-0 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>
            Entrez un nom pour identifier le projet
        </li>
        <li class="flex items-center">
            <svg :class="projectDescription ?  'text-green-500' : 'text-gray-500'"  class="w-3.5 h-3.5 me-2 shrink-0 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>
            Entrez une description optionnelle
        </li>
        <li class="flex items-center">
            <svg :class="pdfFile ?  'text-green-500' : 'text-gray-500'"  class="w-3.5 h-3.5 me-2 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>
            Sélectionnez un fichier PDF (avec des champs interactifs)
        </li>
    </ul>
  </div>


      <input
        type="text"
        v-model="projectName"
        placeholder="Nom du projet"
        class="form-control"
      />

      <textarea
        v-model="projectDescription"
        placeholder="Informations additionnelles (ex.: le groupe, mots clés, etc.)"
        class="form-control"
      ></textarea>

      <input
        type="file"
        @change="handleFileUpload"
        accept=".pdf"
        class="form-control"
        name="Select a PDF file"
      />

      <div class="overlay-buttons">
        <button @click="cancel" class="btn rounded-md">Annuler</button>
        <button 
          @click="confirm" 
          class="btn bg-primary rounded-md text-white" 
          :disabled="!projectName || !pdfFile || errorOverlay"
        >
          Créer le projet
        </button>
      </div>
    </div>
  </div>

  <!-- Error Overlay -->
  <div class="overlay error-overlay" v-if="errorOverlay">
    <div class="overlay-content error-content flex flex-col items-center gap-3">
      <h3>Erreur</h3>
      <p>Le PDF ne contient aucun champ de texte interactif. Veuillez en sélectionner un autre.</p>
      <button @click="closeErrorOverlay" class="btn bg-red-500 text-white rounded-md mt-2 w-1/3">OK</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useProjects } from '~/stores/projects';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';

const showOverlay = ref(true);
const projectName = ref('');
const projectDescription = ref('');
const pdfFile = ref(null);
const pdfImage = ref(null);
const errorOverlay = ref(false);

const projectStore = useProjects();
const emit = defineEmits(['close', 'projectCreated']);

const handleFileUpload = async (event) => {
  pdfFile.value = event.target.files[0];
  projectStore.selectedFile = pdfFile.value;

  if (pdfFile.value) {
    const hasTextFields = await checkForTextFields(pdfFile.value);
    if (!hasTextFields) {
      errorOverlay.value = true;
      pdfFile.value = null; // Reset file if invalid
      return;
    }

    await extractFirstPageImage(pdfFile.value);
  }
};

const checkForTextFields = async (file) => {
  try {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const annotations = await page.getAnnotations();

          // Check for interactive text fields
          const hasTextField = annotations.some((ann) => ann.subtype === 'Widget' && ann.fieldType === 'Tx');
          if (hasTextField) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      };
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error checking PDF fields:', error);
    return false;
  }
};

const extractFirstPageImage = async (file) => {
  const reader = new FileReader();
  reader.onload = async () => {
    const typedArray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    const page = await pdf.getPage(1);
    const scale = 1;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    pdfImage.value = canvas.toDataURL('image/png');
  };
  reader.readAsArrayBuffer(file);
};

function cancelOverlay() {
  emit('close');
}

const closeErrorOverlay = () => {
  errorOverlay.value = false;
};

const cancel = () => {
  emit('close');
};

const confirm = async () => {
  if (!pdfFile.value) return;

  // hide overlay
  showOverlay.value = false;

  const newProjectId = await projectStore.createProject(
    projectName.value,
    projectDescription.value,
    pdfFile.value,
    pdfImage.value
  );
  emit('projectCreated', newProjectId);
};
</script>

<style scoped>

h2  {
    font-size: 1.5rem;
    font-weight: 600;
  }


  h3  {
    font-size: 1.2rem;
    font-weight: 600;
  }

.overlay {
  position: fixed;
  margin: 0px !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.5s ease-in-out forwards;
}

.overlay-content {
  background: white;
  width: 50%;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  height: auto;
  box-shadow: 0px -1px 12px 5px rgba(0, 0, 0, 0.17);
  animation: fadeIn 0.5s ease-in-out forwards;
}

.error-overlay {
  background: rgba(0, 0, 0, 0.6);
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
}

.overlay-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
