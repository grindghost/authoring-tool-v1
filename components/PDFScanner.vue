<script setup>
import { ref, nextTick, computed } from "vue";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import { gsap } from "gsap";
import { useProjects } from "~/stores/projects";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiInputCursorText, HiInformationCircle} from "oh-vue-icons/icons";

// Register the icons
addIcons(BiInputCursorText, HiInformationCircle);

// Define props
const props = defineProps({
  selectedFile: {
    type: File,
    required: true
  }
});

const emit = defineEmits(['scan-complete']);

const projectStore = useProjects();

const pageContainer = ref(null);
const detectedFields = ref([]);
const pdfData = ref(null);
const scanComplete = ref(false);
const processingState = ref('idle'); // 'idle', 'scanning', 'complete'
const wrapperWidth = 400;
const wrapperHeight = 450;


onMounted(async () => {
  await processFile(props.selectedFile);
});

// Watch for changes in the selectedFile prop
// watch(() => props.selectedFile, async (newFile) => {
//   if (newFile) {
//     await processFile(newFile);
//   }
// }, { immediate: true });

// Move file processing logic to separate function
const processFile = async (file) => {
  scanComplete.value = false;
  processingState.value = 'scanning';
  
  const reader = new FileReader();
  reader.onload = async () => {
    const arrayBuffer = reader.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    pdfData.value = btoa(binaryString);
    
    await loadPDF(uint8Array);
  };
  reader.readAsArrayBuffer(file);
};

// Rest of your component code remains the same...
// (Keep all other functions and logic unchanged)

// Computed property to group fields by page
const fieldsByPage = computed(() => {
  const grouped = {};
  detectedFields.value.forEach(field => {
    if (!grouped[field.page]) {
      grouped[field.page] = [];
    }
    grouped[field.page].push(field);
  });
  return grouped;
});

const handleFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  scanComplete.value = false;
  processingState.value = 'scanning';
  const reader = new FileReader();
  reader.onload = async () => {
    const arrayBuffer = reader.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    pdfData.value = btoa(binaryString);
    
    await loadPDF(uint8Array);
  };
  reader.readAsArrayBuffer(file);
};

const loadPDF = async (data) => {
  if (!pageContainer.value) return;
  pageContainer.value.innerHTML = "";
  detectedFields.value = [];

  const pdf = await pdfjsLib.getDocument(data).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    await renderPage(pdf, pageNum);
  }
  
  scanComplete.value = true;
  processingState.value = 'complete';

  // In your loadPDF function, after scanning is complete:
  emit('scan-complete');
  
};

const renderPage = async (pdf, pageNum, skipFieldDetection = false) => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });

  const scaleX = wrapperWidth / viewport.width;
  const scaleY = wrapperHeight / viewport.height;
  const scaleFactor = Math.min(scaleX, scaleY);

  const scaledWidth = viewport.width * scaleFactor;
  const scaledHeight = viewport.height * scaleFactor;

  pageContainer.value.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.classList.add("page-canvas-wrapper");
  wrapper.setAttribute('data-page', pageNum.toString());
  wrapper.style.width = `${wrapperWidth}px`;
  wrapper.style.width = `auto`;
  wrapper.style.height = `${wrapperHeight}px`;
  wrapper.style.position = "relative";
  wrapper.style.overflow = "hidden";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "flex-start";
  wrapper.style.padding = "0px";
  wrapper.style.boxSizing = "border-box";

  pageContainer.value.appendChild(wrapper);

  const canvas = document.createElement("canvas");
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "100%";
  canvas.style.objectFit = "contain";
  canvas.style.position = "relative";
  canvas.classList.add("shadow-md");
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: scaleFactor }) }).promise;

  await nextTick();
  
  if (!skipFieldDetection) {
    await startScanAnimation(wrapper, scaledHeight);
    const annotations = await page.getAnnotations();
    const textFields = annotations.filter(annot => 
      annot.subtype === "Widget" && annot.fieldType === "Tx"
    );
    
    const totalAnimationTime = Math.max(1, textFields.length * 0.2);
    await highlightTextFields(page, page.getViewport({ scale: scaleFactor }), wrapper, pageNum, scaleFactor, totalAnimationTime);
    await delay(500);
  } else {
    const annotations = await page.getAnnotations();
    await highlightExistingFields(page, page.getViewport({ scale: scaleFactor }), wrapper, pageNum, scaleFactor);
  }
};

const highlightExistingFields = async (page, viewport, wrapper, pageNum, scaleFactor) => {
  const annotations = await page.getAnnotations();
  const pageFields = detectedFields.value.filter(field => field.page === pageNum);

  pageFields.forEach(field => {
    const highlight = document.createElement("div");
    highlight.classList.add("text-field-highlight");
    highlight.setAttribute('data-field-name', field.name);
    highlight.setAttribute('data-field-index', field.index.toString());
    highlight.style.position = "absolute";
    highlight.style.left = `${field.position.x}px`;
    highlight.style.top = `${field.position.y}px`;
    highlight.style.width = `${field.position.width}px`;
    highlight.style.height = `${field.position.height}px`;
    highlight.style.border = "2px solid #3b82f6";
    highlight.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    highlight.style.zIndex = "5";
    highlight.style.opacity = "1";
    highlight.style.transition = "all 0.3s ease";

    wrapper.appendChild(highlight);
  });
};

const navigateToField = async (field) => {
  if (!scanComplete.value || !pdfData.value) return;

  try {
    const binaryString = atob(pdfData.value);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pdf = await pdfjsLib.getDocument(bytes).promise;
    await renderPage(pdf, field.page, true);

    await nextTick();
    await delay(100);

    const wrapper = pageContainer.value.querySelector(`[data-page="${field.page}"]`);
    const fieldElement = wrapper.querySelector(`[data-field-name="${field.name}"][data-field-index="${field.index}"]`);
    
    if (fieldElement) {
      document.querySelectorAll('.text-field-highlight').forEach(el => {
        el.classList.remove('active');
        el.style.border = "0px solid #3b82f6";
        el.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        el.style.boxShadow = "none";
      });
      
      fieldElement.classList.add('active');
      fieldElement.style.border = "3px solid #2563eb";
      fieldElement.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
      fieldElement.style.boxShadow = "0 0 10px rgba(37, 99, 235, 0.5)";
    }
  } catch (error) {
    console.error("Error navigating to field:", error);
  }
};

const startScanAnimation = (wrapper, height) => {
  return new Promise((resolve) => {
    const scanLine = document.createElement("div");
    scanLine.classList.add("scan-line");
    scanLine.style.position = "absolute";
    scanLine.style.top = "0";
    scanLine.style.left = "0";
    scanLine.style.width = "100%";
    scanLine.style.height = "5px";
    scanLine.style.background = "cyan";
    scanLine.style.boxShadow = "0 0 10px cyan";
    scanLine.style.zIndex = "10";
    wrapper.appendChild(scanLine);

    gsap.fromTo(
      scanLine,
      { top: "0px", opacity: 1 },
      { 
        top: `${height}px`,
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
          scanLine.remove();
          resolve();
        }
      }
    );
  });
};

const highlightTextFields = async (page, viewport, wrapper, pageNum, scaleFactor, totalAnimationTime) => {
  const annotations = await page.getAnnotations();
  const textFields = annotations.filter(annot => 
    annot.subtype === "Widget" && annot.fieldType === "Tx"
  );
  
  const delayPerField = totalAnimationTime / (textFields.length + 1);
  let currentDelay = 0;
  let fieldCount = 0;

  for (const annot of textFields) {
    fieldCount++;
    const { rect, fieldName } = annot;
    const [x1, y1, x2, y2] = rect;
    
    const x = x1 * scaleFactor;
    const y = viewport.height - y2 * scaleFactor;
    const width = (x2 - x1) * scaleFactor;
    const height = (y2 - y1) * scaleFactor;

    const highlight = document.createElement("div");
    highlight.classList.add("text-field-highlight");
    highlight.setAttribute('data-field-name', fieldName);
    highlight.setAttribute('data-field-index', fieldCount.toString());
    highlight.style.position = "absolute";
    highlight.style.left = `${x}px`;
    highlight.style.top = `${y}px`;
    highlight.style.width = `${width}px`;
    highlight.style.height = `${height}px`;
    highlight.style.border = "2px solid #3b82f6";
    highlight.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    highlight.style.zIndex = "5";
    highlight.style.opacity = "0";
    highlight.style.transition = "all 0.3s ease";

    wrapper.appendChild(highlight);

    // Add field to detectedFields immediately before animation
    detectedFields.value.push({ 
      name: fieldName, 
      page: pageNum,
      index: fieldCount,
      position: { x, y, width, height }
    });

    // Animate the highlight
    await new Promise((resolve) => {
      gsap.to(highlight, {
        opacity: 1,
        duration: 0.5,
        delay: currentDelay,
        onComplete: resolve
      });
    });

    currentDelay += delayPerField;
  }
};

const handleNext = () => {
  // Add your logic for handling the next step
  console.log('Next step...');
  projectStore.projectIsBeingCreated = false;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

</script>

<template>
  <div class="scanner-container">
    <!-- <input type="file" @change="handleFile" accept="application/pdf" /> -->

    <div class="scanner-frame shadow-md">
      <div class="scanner-left">
        <div ref="pageContainer" class="page-wrapper shadow-md"></div>
      </div>

      <div class="scanner-right">
        <h3 class="text-xl font-semibold mb-4">Champs de formulaire</h3>
        <div class="fields-by-page">
          <div v-for="(fields, page) in fieldsByPage" :key="page" class="page-group">
            <h4 class="page-title">Page {{ page }}</h4>
            <ul class="field-list">
              <li 
                v-for="field in fields" 
                :key="`${field.page}-${field.index}`"
                class="field-link"
                @click="navigateToField(field)"
                :class="{ 'disabled': !scanComplete }"
              >
              <OhVueIcon name="bi-input-cursor-text" fill="#8d8d8d"  scale="0.9"/>

                {{ field.name }}
              </li>
            </ul>
          </div>
        </div>

        <div class="next-button-container flex flex-row-reverse">
          <button
            @click="handleNext"
            :disabled="!scanComplete"
            class="btn bg-primary rounded-md text-white"
          >
            <div v-if="processingState === 'scanning'" class="spinner"></div>
            <span v-else>{{ processingState === 'complete' ? 'Suivant' : 'Commencer' }}</span>
          </button>

          <div class="flex flex-row justify-center items-center">
            <OhVueIcon name="hi-information-circle" class="text-primary"  scale="1.8" animation="flash" speed="slow"/>
            <span class="text-xs text-gray-500 ml-3 mr-6 leading-[105%]">
              Nous sommes en train d'extraire les infos. sur les champs de formulaire...
            </span>
            
          </div>


        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container {
  margin-top: 60px;
  text-align: center;
  margin-top: 20px;
}

.scanner-frame {
  width: 800px;
  height: 450px;
  display: flex;
  /* justify-content: space-between; */
  align-items: center;
  background: white;
  border-radius: 0.6rem;
  /* padding: 10px; */
  box-sizing: border-box;
  margin: 20px auto;
  overflow: hidden;
}

.scanner-left {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dee1e6;
  overflow: visible;
}

.scanner-right {
  text-align: left;
  width: 45%;
  height: 100%;
  /* padding: 40px 40px 20px 40px; */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

h3 {
  padding: 40px 40px 0px 40px;
}

.page-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  transform: scale(0.8);
}

.fields-by-page {
  flex-grow: 1;
  overflow-y: scroll;
  /* padding: 12px; */
  padding: 0px 50px 12px 50px;
  /* background-color: #f5f6f8;
  border-left: 0.6rem solid theme('colors.primary'); */
  /* border-radius: 0.3rem; */
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);

}

.page-group {
  margin-bottom: 0.6rem;
}

.page-title {
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.1rem;
}

.field-list {
  padding-left: 0rem;
}

.field-link {
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  margin: 0rem 0;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  list-style: none;
  font-size: 0.875rem;
}


.field-link:hover {
  background-color: #f0f9ff;
}

.field-link.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.next-button-container {
  margin-top: auto;
  padding: 0px 25px 20px 20px;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.next-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.next-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.next-button:disabled {
  background-color: #9ca3af;
  background-color: #2563eb;
  cursor: not-allowed;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>