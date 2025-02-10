<script setup>
import { ref, nextTick } from "vue";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import { gsap } from "gsap";

const pageContainer = ref(null);
const detectedFields = ref([]);
const pdfData = ref(null);
const scanComplete = ref(false);
const wrapperWidth = 400;
const wrapperHeight = 450;

const handleFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  scanComplete.value = false;
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
};

// Previous script setup code remains the same until renderPage function...

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
    // Just highlight fields without animation or detection
    const annotations = await page.getAnnotations();
    await highlightExistingFields(page, page.getViewport({ scale: scaleFactor }), wrapper, pageNum, scaleFactor);
  }
};

// Add new function to highlight existing fields
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
    await renderPage(pdf, field.page, true); // Added skipFieldDetection parameter

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

// Rest of the component remains the same...

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
  
  // Calculate timing for each field
  const delayPerField = totalAnimationTime / (textFields.length + 1);
  let currentDelay = 0;
  let fieldCount = 0;

  const highlightPromises = textFields.map((annot, index) => {
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

    detectedFields.value.push({ 
      name: fieldName, 
      page: pageNum,
      index: fieldCount,
      position: { x, y, width, height }
    });

    currentDelay += delayPerField;

    return new Promise((resolve) => {
      gsap.to(highlight, {
        opacity: 1,
        duration: 0.5,
        delay: currentDelay,
        onComplete: resolve
      });
    });
  });

  // Wait for all highlights to complete
  await Promise.all(highlightPromises);
};


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

</script>

<template>

<!-- Start -->
<transition name="fade">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>hello...</p>

        <!-- ... -->
  <div class="scanner-container">
    <input type="file" @change="handleFile" accept="application/pdf" />

    <div class="scanner-frame">
      <div class="scanner-left">
        <div ref="pageContainer" class="page-wrapper shadow-md"></div>
      </div>

      <div class="scanner-right">
        <h3>Detected Fields</h3>
        <ul>
          <li 
            v-for="(field, index) in detectedFields" 
            :key="index"
            class="field-link"
            @click="navigateToField(field)"
            :class="{ 'disabled': !scanComplete }"
          >
            {{ field.name }} (Page {{ field.page }})
          </li>
        </ul>
      </div>
    </div>
  </div>


  <!-- end -->

    </div>
    </transition>

</template>

<style scoped>


.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

/*  */

.scanner-container {
  text-align: center;
  margin-top: 20px;
}

.scanner-frame {
  width: 800px;
  height: 450px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 2px solid #ddd;
  padding: 10px;
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
  background: #f8f8f8;
  overflow: visible;
}

.scanner-right {
  width: 45%;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
}

.page-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  transform: scale(0.8);
}

.field-link {
  cursor: pointer;
  padding: 5px;
  margin: 5px 0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  list-style: none;
}

.field-link:hover {
  background-color: #f0f9ff;
}

.field-link.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>