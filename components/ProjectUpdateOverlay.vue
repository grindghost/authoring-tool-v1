<!-- components/ProjectUpdateOverlay.vue -->

<template>
    <div class="overlay" v-if="showOverlay" @click="cancelOverlay">
      <div class="overlay-content" @click.stop>
        <h3>Remplacer le PDF du project</h3>
        <div class="badge badge-warning gap-2  mb-3">
            expérimental
        </div>
        <p class="mb-4">Sélectionnez un nouveau fichier PDF...</p>
  
        <input
          type="file"
          @change="handleFileUpload"
          accept=".pdf"
          class="form-control"
          name="Select a PDF file"
        />
  
        <div class="preview mt-4" v-if="pdfImage">
          <h4>Aperçu de l'image de couverture :</h4>
          <img :src="pdfImage" alt="Aperçu de l'image de couverture" class="cover-preview" />
        </div>
  
        <div class="overlay-buttons">
          <button @click="cancel" class="btn rounded-md">Annuler</button>
          <button @click="confirm" class="btn bg-primary rounded-md text-white" :disabled="!pdfFile">
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useProjects } from '~/stores/projects';
  import * as pdfjsLib from 'pdfjs-dist';
  import 'pdfjs-dist/build/pdf.worker';
  
  const showOverlay = ref(true);
  const pdfFile = ref(null);
  const pdfImage = ref(null); // Store the image data here
  
  const projectStore = useProjects();
  
  // Emit events for parent component
  const emit = defineEmits(['close', 'projectUpdated']);
  const props = defineProps({
    projectId: { type: String, required: true }, // The project ID to update
  });
  
  function cancelOverlay() {
    emit('close');
  }
  
  const handleFileUpload = async (event) => {
    pdfFile.value = event.target.files[0];
    if (pdfFile.value) {
      await extractFirstPageImage(pdfFile.value);
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
  
      // Convert canvas to image data URL and set it to pdfImage
      pdfImage.value = canvas.toDataURL('image/png');
      // console.log('pdfImage', pdfImage.value);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const cancel = () => {
    emit('close'); // Emit the close event
  };
  
  const confirm = async () => {
    //emit('close'); // Emit the close event
    showOverlay.value = false;
    try {
      await projectStore.updateProjectFiles(props.projectId, pdfFile.value, pdfImage.value);
      setTimeout(() => {
        emit('projectUpdated'); // Notify parent component of successful update  
      }, 500)

    } catch (error) {
      console.error('Failed to update project files:', error);
    }
  };
  </script>
  
  <style scoped>
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .overlay {
    position: fixed;
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
    padding: 2rem 2rem 1rem 2rem;
    border-radius: 10px;
    text-align: center;
    height: auto;
    box-shadow: 0px -1px 12px 5px rgba(0, 0, 0, 0.17);
    animation: fadeIn 0.5s ease-in-out forwards;
  }
  
  .overlay-buttons {
    margin-top: 2rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  .cover-preview {
    max-width: 100%;
    max-height: 200px;
    margin: 1rem 0;
  }

  img {
    display: inline;
    border: 1px solid #e3e0e0;
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
  