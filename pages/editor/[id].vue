<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { isBefore, set, startOfDay } from "date-fns";

import DOMPurify from 'dompurify';
import domtoimage from 'dom-to-image';
import draggable from 'vuedraggable';

import { useRouter, useRoute } from 'vue-router'
import { useProjects } from '~/stores/projects'
import { useProjectModelStore } from '~/stores/projectModel'
import { initializeContainerScaler } from '~/utils/editorContainerScaler';
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiCheckCircle, HiDownload, FaRegularCopy, MdAddaphotoRound } from "oh-vue-icons/icons";

import ProjectUpdateOverlay from '~/components/ProjectUpdateOverlay.vue';
import ValidationSummary from '~/components/ValidationSummary.vue';
import { useAppStateStore } from '/stores/appState';
import { validateField, validateProject, sanitizeHtml, getCharacterCount } from '~/utils/validation';

// Register the icons
addIcons(BiCheckCircle, HiDownload, FaRegularCopy, MdAddaphotoRound);

definePageMeta({
  middleware: ['auth'] // Keep auth first
});

const config = useRuntimeConfig();

const appStateStore = useAppStateStore();
const scalableContainer = ref(null); // Reference to the container to be scaled
const { status, data } = useAuth();

const router = useRouter()
const route = useRoute()
const projectStore = useProjects()
const projectModelStore = useProjectModelStore()

const accordion = ref({ project: true, activity: false }) // Accordion state
const activeActivity = ref(null)              // Currently selected activity
const selectedActivity = ref({})              // Data for the selected activity
const showSaveOverlay = ref(false);           // Save overlay visibility
const showProjectUpdateOverlay = ref(false);  // Project update overlay visibility

const showDeleteProjectOverlay = ref(false);  // Delete project overlay visibility
const showQuillOverlay = ref(false);          // Overlay visibility
const showAlert = ref(false);                 // Alert visibility 
const editorContent = ref("");
const editingField = ref(null);

// Drag & Drop state
const isDragging = ref(false);
const activitiesList = ref([]);

// Validation state
const validationErrors = ref({});
const isProjectValid = ref(true);
const showValidationAlert = ref(false);

// Getters ****************************************
const project = computed(() => {
  const projectId = route.params.id
  const selectedProject = projectStore.projects.find((p) => p.id === projectId)

  // Check if the project is found
  if (!selectedProject) {
    return {};
  } else {
    // Compute the project data
    const computedProject = selectedProject.profile;
    computedProject.locales = {};

    // Check if the selected project locales array is empty
    if (selectedProject.locales.length === 0) {  
      
      // If empty, set the locales to the default locales (templates)
      computedProject.locales = projectStore.locales;
    } else {
      
      // If not empty, set the locales to the selected project locales
      computedProject.locales = selectedProject.expand.locales;
    }
    return computedProject;
  }
});

const unitUrl = computed(() => {
  const token = selectedActivity.value.token;
  const langParam = project.value.lang;  
  return `${config.public.NEXTAUTH_URL}/portal/?token=${encodeURIComponent(token)}&lang=${langParam}`;
});

const isDateExpired = computed(() => {
  if (!project.value.expirationDate) return false; // If no date is selected, it's not expired
  const today = startOfDay(new Date()); // Get today's date at the start of the day
  const selectedDate = new Date(project.value.expirationDate);
  return isBefore(selectedDate, today); // Check if the selected date is before today
});

const language = computed(() => {
  const currentLang = project.value.lang;
  
  // Get the locale object for the current language
  const locale = project.value.locales[currentLang]
  return locale;
});

const configs = computed(() => {
  return projectStore.configs;
});

const isNotAPdfField = computed(() => {

  if (selectedActivity.value.fieldName.includes('endpoint')) {
    return true;
  } else {
    return false;
  }
});

const isLastActivity = computed(() => {
  const activities = sortedActivities.value;
  const lastActivity = activities[activities.length - 1];
  return selectedActivity.value?.id === lastActivity?.id || selectedActivity.value?.isEndpoint;
})

const activityTitleCharacterCount = computed(() => {
  return selectedActivity.value?.activityTitle?.length || 0;
})

// Compute a sorted version of activities, based on their index key
const sortedActivities = computed(() => {
  return Object.entries(project.value.activities) // Convert object to array
    .map(([id, activity]) => ({ id, ...activity })) // Keep ID reference
    .sort((a, b) => a.index - b.index); // Sort by index
});

// Watch sortedActivities to update activitiesList
watch(sortedActivities, (newActivities) => {
  activitiesList.value = [...newActivities];
}, { immediate: true });

// Function to handle drag end and update indexes
function onDragEnd() {
  isDragging.value = false;
  
  // Update the indexes based on the new order
  const updatedActivities = { ...project.value.activities };
  
  activitiesList.value.forEach((activity, newIndex) => {
    if (updatedActivities[activity.id]) {
      updatedActivities[activity.id].index = newIndex;
    }
  });
  
  // Update the project with new activities
  project.value.activities = updatedActivities;
  
  // Auto-save the project with new order
  autoSaveProject();
  
  // Trigger save alert
  showAlert.value = true;
}

// Function to auto-save project after reordering
async function autoSaveProject() {
  try {
    const projectId = route.params.id;
    const updatedProject = project.value;
    
    await projectStore.saveProject(projectId, updatedProject);
  } catch (error) {
    console.error('Error auto-saving project order:', error);
    // Show error alert if needed
    showAlert.value = true;
  }
}

const profile = computed(() => {    

    // Reset the app state
    appStateStore.resetAppState();

    // Use the existing project computed property directly
    const currentProject = computed(() => projectStore.projects.find((p) => p.id === route.params.id)).value;

    const projectId = route.params.id;
    const activityId = selectedActivity.value.id;

    // Don't create a new computed inside a computed
    // Instead, directly call the method
    const _history = appStateStore.getAnswerFromLocalStorage(projectId, activityId);
    
    const _profile = {
      configs: configs.value,
      project: { ...currentProject }, // Creating a new object to ensure reactivity
      activity: { ...selectedActivity.value }, // Creating a new object to ensure reactivity
      locale: language.value,
      history: _history,
      message: null,
      mockup: true,
    }

    // Update app state synchronously or use a watcher instead of setTimeout
    setTimeout(() => {
      appStateStore.SetUnitStateOnArrival(_profile);

      // Make sure the activity id is set
      if (!appStateStore.unitProfile.activity.id) {
        appStateStore.unitProfile.activity.id = activityId;
      }
    }, 500);
    
    if (_profile.activity?.token) {
      appStateStore.unitToken = _profile.activity.token;
    }

    return _profile;
});

// Helpers ****************************************
function clickProjectAccordion() {
  if (accordion.value.project) {
    accordion.value.project = false;
    accordion.value.activity = true;
  } else  {
    accordion.value.project = true; 
    accordion.value.activity = false;   
  }
}

function clickActivityAccordion() {
  accordion.value.project = false; 
  accordion.value.activity = false;   
}

function copyToClipboard() {
    navigator.clipboard.writeText(unitUrl.value).then(
      () => {
        console.log("Copied to clipboard!");
      },
      () => {
        console.log("Failed to copy!");
      }
    );
}

function displayCoverImg() {
  window.open(project.value.pdfCoverImgUrl, '_blank')
}

function handleUpdatePdfOverlay() {
  showAlert.value = false
  showProjectUpdateOverlay.value = true
}

function handleDeleteProject() {
  showDeleteProjectOverlay.value = true;
}

function cancelDelete() {
  showDeleteProjectOverlay.value = false;
}

async function deleteProject() {
  
  const projectId = route.params.id;

  await projectStore.deleteProject(projectId);

  // Hide the overlay
  showDeleteProjectOverlay.value = false;

  setTimeout(() => {
    router.push('/dashboard');
  }, 1000)  
}

function saveProject() {
  showAlert.value = false;
  showValidationAlert.value = false;

  // Validate the entire project before saving
  const validationResult = validateProject(project.value);
  
  if (!validationResult.isValid) {
    validationErrors.value = validationResult.errors;
    isProjectValid.value = false;
    showValidationAlert.value = true;
    return;
  }

  // Clear any previous validation errors
  validationErrors.value = {};
  isProjectValid.value = true;

  const projectId = route.params.id;
  const updatedProject = project.value;

  // for each activity in the project, update the activity
  projectStore.saveProject(projectId, updatedProject).then(() => {
    setTimeout(() => {
    showSaveOverlay.value = true; // Show the save confirmation overlay
    projectStore.stopLoading();
    setTimeout(() => {
      showSaveOverlay.value = false; // Close the save overlay
    }, 1000)
  }, 200);
  });
}

async function onProjectUpdated() {
    showProjectUpdateOverlay.value = false;

    await projectStore.fetchProjects();
    showAlert.value = false;
  }


async function downloadZip() {
  projectStore.downloadProjectZip(project.value.activities, route.params.id, project.value.lang);
}

async function downloadZipRCP() {
  // Parse the indexTarget JSON from the project
  let indexTarget = null;
  try {
    if (project.value.indexTarget) {
      indexTarget = JSON.parse(project.value.indexTarget);
    }
  } catch (error) {
    console.error('Invalid JSON in indexTarget:', error);
    // You might want to show an alert to the user here
    return;
  }
  
  projectStore.downloadProjectZipRCP(project.value.activities, route.params.id, project.value.lang, indexTarget);
}

function closeSaveOverlay() {
  showSaveOverlay.value = false; // Close the save overlay
}

async function showHistoryHandler() {
  const projectId = route.params.id;
  try {
    const history = await projectStore.fetchProjectHistory(projectId);

  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

function selectActivity(activityKey) {

  activeActivity.value = activityKey;
  
  // Create a proper reactive object by spreading the activity data
  const activityData = project.value.activities[activityKey] || {};
  
  selectedActivity.value = { ...activityData, id: activityKey };

  accordion.value.project = false;
  accordion.value.activity = true;

}

function saveQuillContent(html) {
  if (editingField.value) {
    // Sanitize the html content
    const sanitizedHtml = DOMPurify.sanitize(html, {FORBID_TAGS: ['img']});

    // Validate the content
    const validationResult = validateActivityField(editingField.value, sanitizedHtml);
    
    if (!validationResult.isValid) {
      // Show error message (you might want to add a toast or alert here)
      console.error('Validation error:', validationResult.message);
      // Don't close the overlay if there's an error
      return;
    }

    selectedActivity.value[editingField.value] = sanitizedHtml; // Save content to the correct field
  }
  cancelQuillOverlay();
}

function cancelQuillOverlay() {
  showQuillOverlay.value = false;
  editingField.value = null; // Reset the editing field
}

function openEditor(fieldName) {
  editingField.value = fieldName;
  editorContent.value = selectedActivity.value[fieldName]; // Load the field content into the editor
  showQuillOverlay.value = true;
  
  // Clear validation error for this field when opening editor
  if (selectedActivity.value?.id) {
    const activityKey = `activity_${selectedActivity.value.id}`;
    if (validationErrors.value[activityKey]?.[fieldName]) {
      delete validationErrors.value[activityKey][fieldName];
      // Update project validity
      isProjectValid.value = Object.keys(validationErrors.value).length === 0;
    }
  }
}

function convertQuillListsToStatic(containerDiv) {
    const quillEditor = containerDiv.querySelector('.ql-editor');
    if (!quillEditor) return null;

    // Save original Quill content
    const originalHtml = quillEditor.innerHTML;

    const listItems = quillEditor.querySelectorAll('li[data-list]');
    listItems.forEach((li, index) => {
        let listSymbol = '';
        let indentLevel = 0;
        let indentPx = 20;

        // Determine list type and indentation
        if (li.hasAttribute('data-list')) {
            const listType = li.getAttribute('data-list'); // "ordered" or "bullet"

            // Check indentation level from class (e.g., "ql-indent-1")
            const indentClass = li.className.match(/ql-indent-(\d+)/);
            if (indentClass) {
                indentLevel = parseInt(indentClass[1], 10);
                indentPx = (indentLevel + 1) * 20; // Increase indentation spacing as needed
            }

            // Determine list numbering style based on your CSS
            if (listType === "ordered") {
                if (indentLevel === 0) listSymbol = String.fromCharCode(97 + index) + ')'; // lower-alpha
                else if (indentLevel === 1) listSymbol = (index + 1) + '.'; // decimal
                else if (indentLevel === 2) listSymbol = toRoman(index + 1).toLowerCase() + '.'; // lower-roman
                else if (indentLevel === 3) listSymbol = toRoman(index + 1).toUpperCase() + '.'; // upper-roman
                else listSymbol = (index + 1) + '.'; // Fallback
            } else if (listType === "bullet") {
                if (indentLevel === 0) listSymbol = '•'; // Bullet
                else if (indentLevel === 1) listSymbol = '◦'; // Smaller bullet
                else if (indentLevel === 2) listSymbol = '▪'; // Square bullet
                else listSymbol = '•'; // Fallback
            }
        }

        // Replace list item with a <p> tag
        const newParagraph = document.createElement('p');
        newParagraph.style.marginLeft = `${indentPx}px`; // Apply indentation
        newParagraph.innerHTML = `<span style="margin-right: 5px;">${listSymbol}</span> ${li.innerHTML}`;
        li.replaceWith(newParagraph);
    });

    return originalHtml; // Return original content for restoring later
}

function restoreQuillListsFromStatic(containerDiv, originalHtml) {
    const quillEditor = containerDiv.querySelector('.ql-editor');
    if (quillEditor && originalHtml) {
        quillEditor.innerHTML = originalHtml;
    }
}

// Utility function: Convert numbers to Roman numerals
function toRoman(num) {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

// Validation functions
function validateProjectField(fieldName, value) {
  const result = validateField(fieldName, value);
  
  if (!result.isValid) {
    validationErrors.value[fieldName] = result.message;
  } else {
    delete validationErrors.value[fieldName];
  }
  
  // Update project validity
  isProjectValid.value = !hasValidationErrors();
  
  return result;
}

function validateActivityField(fieldName, value) {
  if (!selectedActivity.value?.id) return { isValid: true };
  
  const result = validateField(fieldName, value);
  const activityKey = `activity_${selectedActivity.value.id}`;
  
  if (!validationErrors.value[activityKey]) {
    validationErrors.value[activityKey] = {};
  }
  
  if (!result.isValid) {
    validationErrors.value[activityKey][fieldName] = result.message;
  } else {
    delete validationErrors.value[activityKey][fieldName];
  }
  
  // Clean up empty activity error objects
  if (Object.keys(validationErrors.value[activityKey]).length === 0) {
    delete validationErrors.value[activityKey];
  }
  
  // Update project validity
  isProjectValid.value = !hasValidationErrors();
  
  return result;
}

function getFieldError(fieldName, isActivity = false) {
  if (isActivity && selectedActivity.value?.id) {
    const activityKey = `activity_${selectedActivity.value.id}`;
    return validationErrors.value[activityKey]?.[fieldName] || '';
  }
  return validationErrors.value[fieldName] || '';
}

function getCharacterCountForField(fieldName) {
  if (!selectedActivity.value?.[fieldName]) return 0;
  return getCharacterCount(selectedActivity.value[fieldName]);
}

function getProjectFieldCharacterCount(fieldName) {
  if (!project.value?.[fieldName]) return 0;
  return project.value[fieldName].length;
}

function getActivityFieldCharacterCount(fieldName) {
  if (!selectedActivity.value?.[fieldName]) return 0;
  return selectedActivity.value[fieldName].length;
}

// Helper function to check if there are any validation errors
function hasValidationErrors() {
  return Object.keys(validationErrors.value).some(key => {
    if (key.startsWith('activity_')) {
      return Object.keys(validationErrors.value[key]).length > 0;
    }
    return true; // Project-level errors
  });
}

// Force focus on input to prevent focus loss
function forceFocus(inputElement) {
  // Use nextTick to ensure the DOM has updated
  nextTick(() => {
    inputElement.focus();
    // Restore cursor position to end of input
    const length = inputElement.value.length;
    inputElement.setSelectionRange(length, length);
  });
}

// Handle PDF filename input with real-time filtering
function handlePdfFilenameInput(event) {
  const input = event.target;
  let value = input.value;
  
  // Remove file extensions (anything after a dot)
  value = value.replace(/\.[^.]*$/, '');
  
  // Convert to lowercase
  value = value.toLowerCase();
  
  // Remove special characters except hyphens and underscores
  value = value.replace(/[^a-z0-9\-_]/g, '');
  
  // Remove consecutive hyphens and underscores
  value = value.replace(/[-_]{2,}/g, '-');
  
  // Remove leading/trailing hyphens and underscores
  value = value.replace(/^[-_]+|[-_]+$/g, '');
  
  // Update the input value
  input.value = value;
  project.pdfFilename = value;
  
  // Validate the field
  validateProjectField('pdfFilename', value);
}


// Helper Method for Taking Screenshot
async function takeScreenshot() {
  

  const element = document.querySelector('.wrapper'); // Target the .wrapper element

  if (!element) {
    console.error("Element .scalable-container not found");
    return;
  }
  
  const originalHtml = convertQuillListsToStatic(element);

  // Add a faint gray border before taking the screenshot
  // element.style.border = '1px solid #ccc';

  try {
    const dataUrl = await domtoimage.toPng(element, {
      // Optional parameters - adjust as needed
      bgcolor: '#fff', // default background to white.
      style: {
        border: 'none', // Prevent dom-to-image from adding its own border
      },
      quality: 1, // Set quality to 1 for best resolution
      scale: 2,  // Increase scale factor for high-quality images
      width: 800,
      height: 449,
    });

    restoreQuillListsFromStatic(element, originalHtml);

    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = dataUrl;

    // Define the filename - using project name and activity title as example
    const projectName = project.value.name || 'project'; // Default to 'project' if name is empty
    const activityTitle = selectedActivity.value.activityTitle || 'activity'; // Default to 'activity' if title is empty
    const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${activityTitle.replace(/[^a-zA-Z0-9]/g, '_')}_screenshot.png`;

    const simplifiedFilename = `vignette-${selectedActivity.value.index + 1}.png`

    link.download = simplifiedFilename;

    // Simulate a click on the link to trigger the download
    link.click();

    // Clean up the link element
    link.remove();
  } catch (error) {
    console.error("Error taking screenshot:", error);
  } finally {
    // element.style.border = ''; // Remove the border
  }
}

// Watchers ****************************************
watch(project, (oldVal, newVal) => {
  if (newVal) {
    // console.log('Project updated:', newVal);
    if (!showProjectUpdateOverlay.value) {
      showAlert.value = true;      
    }
    
    // Validate the project when it changes
    const validationResult = validateProject(newVal);
    if (!validationResult.isValid) {
      validationErrors.value = validationResult.errors;
    }
    isProjectValid.value = !hasValidationErrors();
  }
}, { deep: true });

// Watch selected activity for validation
watch(() => selectedActivity.value?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Only validate when the activity ID changes, not on every field update
    const activityKey = `activity_${newId}`;
    if (validationErrors.value[activityKey]) {
      const activityValidation = validateProject({ activities: { [newId]: selectedActivity.value } });
      if (activityValidation.errors[`activity_${newId}`]) {
        validationErrors.value[activityKey] = activityValidation.errors[`activity_${newId}`];
      }
    }
  }
});

// Watch selectedActivity changes and sync back to project activities
watch(selectedActivity, (newActivity) => {
  if (newActivity?.id && project.value?.activities) {
    // Update the project's activities object with the latest selectedActivity data
    project.value.activities[newActivity.id] = { 
      ...project.value.activities[newActivity.id],
      ...newActivity 
    };
    
    // Remove the id field as it's not part of the activity data
    delete project.value.activities[newActivity.id].id;
  }
}, { deep: true });

// Hooks ****************************************

onMounted(async () => {

// Logic for when the page is refreshed or accesd directly...
if (status.value === "authenticated") {
    if (projectStore.projectsLoaded == false) {
      
      // Re-fetch the projects
      await projectStore.fetchProjects();

      // Verify that the project (from the id in the query param) exist in the projects list
      const projectId = route.params.id;

      const selectedProject = projectStore.projects.find((p) => p.id === projectId);
      if (!selectedProject) {
        // throw a 404 error
        navigateTo("/404", { replace: true });
        return;
      }

      // If the project exist, select the first activity by default
      selectActivity(Object.entries(project.value?.activities)[0][0]); 
      projectStore.stopLoading();  

    }      
  }

  
  // Wait for the DOM to render
  await nextTick();
  if (process.client) {
    const firstThumbnail = document.querySelector('.activity-sidebar .thumbnail');
    if (firstThumbnail) {
      firstThumbnail.click();
    }
    // Set the current project ID
    projectStore.currentProject = project;
          
    // Initialize the scaler for the specific container
    const container = ref.scalerContainer;
    initializeContainerScaler(scalableContainer.value);
    
    // Initial validation of the project
    if (project.value) {
      const validationResult = validateProject(project.value);
      if (!validationResult.isValid) {
        validationErrors.value = validationResult.errors;
      }
      isProjectValid.value = !hasValidationErrors();
    }
  }

})

</script>

<template>
  <div class="editor" v-if="projectStore.projects.length" :class="projectStore.isLoading  || projectStore.projectIsBeingCreated ? 'transparent' : ''">
  <!-- Alert to save the project -->
    <div class="alert-container mt-20 px-4 fixed z-50 bottom-0 pb-4 pt-10 w-full" v-if="showAlert">
    <div role="alert" class="alert bg-white shadow-lg">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 shrink-0 stroke-current animate-pulse text-primary"
          fill="none"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex flex-col leading-5">
          <span class="font-bold">Des changements ont été apportés.</span>
          <span>Assurez-vous de sauvegarder vos modifications.</span>
        </div>
      <div class="flex gap-1">
        <button class="btn bg-primary rounded-md text-white" @click="saveProject">Sauvegarder</button>
        <button class="btn bg-slate-50 rounded-md text-black" @click="showAlert = false">Ok</button>
      </div>
    </div>
  </div>

  <!-- Validation Alert -->
  <div class="alert-container mt-20 px-4 fixed z-50 bottom-0 pb-4 pt-10 w-full" v-if="showValidationAlert">
    <div role="alert" class="alert bg-red-50 border border-red-200 shadow-lg">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 shrink-0 stroke-current text-red-500"
          fill="none"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex flex-col leading-5">
          <span class="font-bold text-red-700">Erreurs de validation détectées</span>
          <span class="text-red-600">Veuillez corriger les erreurs avant de sauvegarder.</span>
        </div>
      <div class="flex gap-1">
        <button class="btn bg-red-500 rounded-md text-white" @click="showValidationAlert = false">Fermer</button>
      </div>
    </div>
  </div>

  <div class="content mt-16">
      <!-- Left Sidebar with Accordion Sections -->
      <div class="left-sidebar shadow-md">
          <div class="collapse collapse-arrow bg-gray-100 rounded-md mb-2">
            <input type="radio" name="my-accordion-2" :checked="accordion.project" @click="clickProjectAccordion" />
            <div class="collapse-title text-md font-bold">Paramètres du projet</div>
             <!-- Accordion content for the project level parameters -->
              <div class="collapse-content">
                <form @submit.prevent="saveProject">

                  <!-- Project Name -->
                  <div class="form-group">
                    <label for="name" v-html="projectModelStore.projectParams.name.label">
                      
                    </label>
                    <input
                      type="text"
                      id="name"
                      v-model="project.name"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('name') }"
                      :readonly="!projectModelStore.projectParams.name.editable"
                      :disabled="!projectModelStore.projectParams.name.editable"
                      @blur="validateProjectField('name', $event.target.value)"
                      required
                    />
                    <div v-if="getFieldError('name')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('name') }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getProjectFieldCharacterCount('name') }}/100 caractères
                    </div>
                  </div>

                  <!-- Course ID -->
                  <div class="form-group">
                    <label for="courseId" v-html="projectModelStore.projectParams.courseId.label"></label>
                    <input
                      type="text"
                      id="courseId"
                      v-model="project.courseId"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('courseId') }"
                      :readonly="!projectModelStore.projectParams.courseId.editable"
                      :disabled="!projectModelStore.projectParams.courseId.editable"
                      @blur="validateProjectField('courseId', $event.target.value)"
                    />
                    <div v-if="getFieldError('courseId')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('courseId') }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getProjectFieldCharacterCount('courseId') }}/50 caractères
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="form-group">
                    <label for="description" v-html="projectModelStore.projectParams.description.label"></label>
                    <textarea
                      id="description"
                      v-model="project.description"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('description') }"
                      :readonly="!projectModelStore.projectParams.description.editable"
                      :disabled="!projectModelStore.projectParams.description.editable"
                      @blur="validateProjectField('description', $event.target.value)"
                      rows="3"
                    ></textarea>
                    <div v-if="getFieldError('description')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('description') }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getProjectFieldCharacterCount('description') }}/500 caractères
                    </div>
                  </div>

                  <!-- Language Dropdown -->
                  <div class="form-group">
                    <label for="lang" v-html="projectModelStore.projectParams.lang.label"></label>
                    <select
                      id="lang"
                      v-model="project.lang"
                      class="form-control"
                      :disabled="!projectModelStore.projectParams.lang.editable"
                    >
                      <option
                        v-for="(label, value) in projectModelStore.projectParams.lang.options"
                        :key="value"
                        :value="value"
                      >
                        {{ label }}
                      </option>
                    </select>
                  </div>

                  <!-- Theme Dropdown -->
                  <div class="form-group">
                    <label for="theme" v-html="projectModelStore.projectParams.theme.label"></label>
                    <select
                      id="theme"
                      v-model="project.theme"
                      class="form-control"
                      :disabled="!projectModelStore.projectParams.theme.editable || project.useCustomTheme"
                    >
                      <option
                        v-for="(label, value) in projectModelStore.projectParams.theme.options"
                        :key="value"
                        :value="value"
                      >
                        {{ label }}
                      </option>
                    </select>
                  </div>

                  <!-- Use Custom Theme Toggle -->
                  <div class="form-group">
                    <label for="useCustomTheme" v-html="projectModelStore.projectParams.useCustomTheme.label">
                    </label>
                    <input
                      type="checkbox"
                      id="useCustomTheme"
                      v-model="project.useCustomTheme"
                      :disabled="!projectModelStore.projectParams.useCustomTheme.editable"
                    />
                  </div>

                  <!-- Custom Theme -->
                  <div class="form-group" v-if="project.useCustomTheme">
                    <label for="customTheme">Couleur hexadécimale</label>
                    <div class="color-picker flex gap-1">
                      <input
                        type="text"
                        id="customTheme"
                        v-model="project.customTheme"
                        class="form-control"
                        :class="{ 'border-red-500': getFieldError('customTheme') }"
                        :placeholder="'Exemple: #ff0000'"
                                              @blur="validateProjectField('customTheme', $event.target.value)"
                      />
                      <input
                        type="color"
                        v-model="project.customTheme"
                        class="color-input"
  
                      />
                    </div>
                    <div v-if="getFieldError('customTheme')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('customTheme') }}
                    </div>
                  </div>

                  <!-- PDF Filename -->
                  <div class="form-group">
                    <label for="pdfFilename" v-html="projectModelStore.projectParams.pdfFilename.label"></label>
                    <div class="relative">
                      <input
                        type="text"
                        id="pdfFilename"
                        v-model="project.pdfFilename"
                        class="form-control pr-12"
                        :class="{ 'border-red-500': getFieldError('pdfFilename') }"
                        :readonly="!projectModelStore.projectParams.pdfFilename.editable"
                        :disabled="!projectModelStore.projectParams.pdfFilename.editable"
                        @input="handlePdfFilenameInput"
                        @blur="validateProjectField('pdfFilename', $event.target.value)"
                        placeholder="ex: mon-projet-2024"
                      />
                      <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        .pdf
                      </span>
                    </div>
                    <div v-if="getFieldError('pdfFilename')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('pdfFilename') }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getProjectFieldCharacterCount('pdfFilename') }}/100 caractères
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="pdfFileSize" v-html="projectModelStore.projectParams.pdfFileSize.label"></label>
                    <input
                      type="text"
                      id="pdfFileSize"
                      v-model="project.pdfFileSize"
                      class="form-control"
                      readonly
                      disabled
                    />
                  </div>

                  <div class="form-group" >
                    <label for="pdfURL" v-html="projectModelStore.projectParams.pdfURL.label"></label>
                    <input
                      type="text"
                      id="pdfURL"
                      v-model="project.pdfURL"
                      class="form-control input-disabled"                      
                      readonly
                      @click="handleUpdatePdfOverlay"
                    />
                  </div>

                  <div class="form-group">
                    <label for="pdfCoverImgUrl" v-html="projectModelStore.projectParams.pdfCoverImgUrl.label"></label>
                    <input
                      type="text"
                      id="pdfURL"
                      v-model="project.pdfCoverImgUrl"
                      class="form-control input-disabled" 
                      readonly
                      @click="displayCoverImg"
                      
                    />
                  </div>
                  <!-- Published Toggle -->
                  <div class="form-group">
                    <label for="published" v-html="projectModelStore.projectParams.published.label"></label>
                    <input
                      type="checkbox"
                      id="published"
                      v-model="project.published"
                      :disabled="!projectModelStore.projectParams.published.editable"
                    />
                  </div>                  
                  <!-- Expiration Toggle -->
                  <div class="form-group">
                    <label for="useExpirationDate" v-html="projectModelStore.projectParams.useExpirationDate.label"></label>
                    <input
                      type="checkbox"
                      id="useExpirationDate"
                      v-model="project.useExpirationDate"
                      :disabled="!projectModelStore.projectParams.useExpirationDate.editable"
                    />
                  </div>

                  <!-- Expiration Date -->
                  <div class="form-group" v-if="project.useExpirationDate">
                    <label for="expirationDate" v-html="projectModelStore.projectParams.expirationDate.label"></label>
                    <input
                      type="date"
                      id="expirationDate"
                      v-model="project.expirationDate"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('expirationDate') }"
                      @blur="validateProjectField('expirationDate', $event.target.value)"
                    />
                    <div v-if="getFieldError('expirationDate')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('expirationDate') }}
                    </div>
                    <span v-if="isDateExpired && !getFieldError('expirationDate')" class="text-red-500 text-sm mt-1">Expiré</span>
                  </div>

                  <!-- Index Target -->
                  <div class="form-group">
                    <label for="indexTarget" v-html="projectModelStore.projectParams.indexTarget.label"></label>
                    <textarea
                      id="indexTarget"
                      v-model="project.indexTarget"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('indexTarget') }"
                      :readonly="!projectModelStore.projectParams.indexTarget.editable"
                      :disabled="!projectModelStore.projectParams.indexTarget.editable"
                      @blur="validateProjectField('indexTarget', $event.target.value)"
                      rows="6"
                      placeholder="Enter JSON object for indexTarget..."
                    ></textarea>
                    <div v-if="getFieldError('indexTarget')" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('indexTarget') }}
                    </div>
                  </div>
                </form>          
                <!-- ...  -->

              </div>
            </div>
          <div class="collapse collapse-arrow bg-gray-100 rounded-md mb-2" v-if="activeActivity">
            <input type="radio" name="my-accordion-2" :checked="accordion.activity" @click="clickActivityAccordion" />
            <div class="collapse-title text-md font-bold">Paramètres de l'activité</div>
            
            <!-- Accordion content for the activity level parameters -->
            <div class="collapse-content">
              
              <form @submit.prevent="saveProject" :key="activeActivity">

                  <!-- PDF form field name -->
                  <div class="form-group" v-if="!selectedActivity.fieldName.includes('endpoint')">
                    <label for="formFeldName">Nom du champ (PDF)</label>
                    <input
                      type="text"
                      id="formFeldName"
                      v-model="selectedActivity.fieldName"
                      class="form-control"
                      readonly
                      disabled
                      required
                    />
                  </div>

                <!-- Activity title -->
                  <div class="form-group">
                    <label for="activityTitle" v-html="projectModelStore.activitiesParams.activityTitle.label"></label>
                    <input
                      type="text"
                      id="activityTitle"
                      v-model="selectedActivity.activityTitle"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('activityTitle', true) }"
                      :readonly="!projectModelStore.activitiesParams.activityTitle.editable"
                      :disabled="!projectModelStore.activitiesParams.activityTitle.editable"
                      @input="forceFocus($event.target)"
                      @blur="validateActivityField('activityTitle', $event.target.value)"
                      required
                    />
                    <div v-if="getFieldError('activityTitle', true)" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('activityTitle', true) }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ activityTitleCharacterCount }}/100 caractères
                    </div>
                  </div>

                  <!-- Default text -->
                  <div class="form-group" v-if="selectedActivity.useDefaultText !== false">
                    <label for="defaultText" v-html="projectModelStore.activitiesParams.defaultText.label"></label>

                    <input
                      type="text"
                      id="defaultText"
                      v-model="selectedActivity.defaultText"                
                      class="form-control input-disabled"
                      :class="{ 'border-red-500': getFieldError('defaultText', true) }"
                      @click="openEditor('defaultText')"
                      readonly
                      required
                    />
                    <div v-if="getFieldError('defaultText', true)" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('defaultText', true) }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getCharacterCountForField('defaultText') }}/2000 caractères
                    </div>
                  </div>

                  <!-- Context/content text -->
                  <div class="form-group">
                    <label for="contextText" v-html="projectModelStore.activitiesParams.contextText.label"></label>

                    <input
                      type="text"
                      id="contextText"
                      v-model="selectedActivity.contextText"                
                      class="form-control input-disabled"
                      :class="{ 'border-red-500': getFieldError('contextText', true) }"
                      @click="openEditor('contextText')"
                      readonly
                      required
                    />
                    <div v-if="getFieldError('contextText', true)" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('contextText', true) }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getCharacterCountForField('contextText') }}/2000 caractères
                    </div>
                  </div>
                  
                  <!-- Is Endpoint Toggle -->                
                  <div class="form-group" v-if="!isNotAPdfField">
                    <label for="isEndpoint" v-html="projectModelStore.activitiesParams.isEndpoint.label">
                    </label>
                    <input
                      type="checkbox"
                      id="isEndpoint"
                      v-model="selectedActivity.isEndpoint"
                      :disabled="!projectModelStore.activitiesParams.isEndpoint.editable"
                    />
                  </div>

                  <!-- Is Endpoint Toggle (disabled) -->                
                  <div class="form-group" v-else>
                    <label for="isEndpoint" v-html="projectModelStore.activitiesParams.isEndpoint.label">
                    </label>
                    <input
                      type="checkbox"
                      id="isEndpoint"
                      v-model="selectedActivity.isEndpoint"
                      disabled
                    />
                  </div>
                  
                  <!-- Limit characters Toggle -->                
                  <div class="form-group" v-if="!isLastActivity && !selectedActivity.fieldName.includes('endpoint')">
                    <label for="useCharactersLimit" v-html="projectModelStore.activitiesParams.useCharactersLimit.label">
                    </label>
                    <input
                      type="checkbox"
                      id="useCharactersLimit"
                      v-model="selectedActivity.useCharactersLimit"
                      :disabled="!projectModelStore.activitiesParams.useCharactersLimit.editable"
                    />
                  </div>
                  


                  <!-- Number field to set limit -->
                  <div class="form-group" v-if="selectedActivity.useCharactersLimit && !isLastActivity && !selectedActivity.fieldName?.includes('endpoint')">
                    <label for="maxCharactersAllowed" v-html="projectModelStore.activitiesParams.maxCharactersAllowed.label"></label>
                    <input
                      type="number"
                      id="maxCharactersAllowed"
                      v-model="selectedActivity.maxCharactersAllowed"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('maxCharactersAllowed', true) }"
                      :disabled="!projectModelStore.activitiesParams.maxCharactersAllowed.editable"
                      @blur="validateActivityField('maxCharactersAllowed', $event.target.value)"
                    />
                    <div v-if="getFieldError('maxCharactersAllowed', true)" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('maxCharactersAllowed', true) }}
                    </div>
                  </div>

                  <!-- Use custom placeholder text toggle -->                
                  <div class="form-group" v-if="!isLastActivity && !selectedActivity.fieldName.includes('endpoint')">
                    <label for="useCustomPlaceholder" v-html="projectModelStore.activitiesParams.useCustomPlaceholder.label">
                    </label>
                    <input
                      type="checkbox"
                      id="useCustomPlaceholder"
                      v-model="selectedActivity.useCustomPlaceholder"
                      :disabled="!projectModelStore.activitiesParams.useCustomPlaceholder.editable"
                    />
                  </div>


                  <!-- Text field to define the custom placeholder -->
                  <div class="form-group" v-if="selectedActivity.useCustomPlaceholder && !isLastActivity && !selectedActivity.fieldName.includes('endpoint')">
                    <label for="customPlaceholder" v-html="projectModelStore.activitiesParams.customPlaceholder.label"></label>
                    <input
                      type="text"
                      id="customPlaceholder"
                      v-model="selectedActivity.customPlaceholder"
                      class="form-control"
                      :class="{ 'border-red-500': getFieldError('customPlaceholder', true) }"
                      :disabled="!projectModelStore.activitiesParams.customPlaceholder.editable"
                      @blur="validateActivityField('customPlaceholder', $event.target.value)"
                    />
                    <div v-if="getFieldError('customPlaceholder', true)" class="text-red-500 text-sm mt-1">
                      {{ getFieldError('customPlaceholder', true) }}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                      {{ getActivityFieldCharacterCount('customPlaceholder') }}/200 caractères
                    </div>
                  </div>

                  <!-- Use default text toggle -->
                  <div class="form-group">
                    <label for="useDefaultText">Utiliser un texte par défaut</label>
                    <input
                      type="checkbox"
                      id="useDefaultText"
                      v-model="selectedActivity.useDefaultText"
                    />
                  </div>

                </form>
                
            </div>
          </div>
          <div class="left-sidebar-buttons">
            <button 
              class="btn rounded-md text-white" 
              :class="isProjectValid ? 'bg-primary' : 'bg-gray-400 cursor-not-allowed'"
              @click="saveProject"
              :disabled="!isProjectValid"
            >
              Sauvegarder
            </button>

            <button class="btn bg-white rounded-md" @click="handleDeleteProject">Supprimer</button>
        </div>

        <!-- Validation Summary -->
        <ValidationSummary 
          :validation-errors="validationErrors" 
          :sorted-activities="sortedActivities"
        />

        <div class="downloadBlock flex items-center justify-start gap-2 cursor-pointer" @click="downloadZip">
          <div class="rounded-full w-7 h-7 bg-primary flex items-center justify-center px-2 box-size">
            <OhVueIcon name="hi-download" class="" fill="#fff"  scale="0.9"/>
          </div>
          <span class="text-[var(--color-theme-button)] hover:underline bold">Télécharger le projet</span>
        </div>

        <div class="downloadBlock flex items-center justify-start gap-2 cursor-pointer mt-2" @click="downloadZipRCP">
          <div class="rounded-full w-7 h-7 bg-green-600 flex items-center justify-center px-2 box-size">
            <OhVueIcon name="hi-download" class="" fill="#fff"  scale="0.9"/>
          </div>
          <span class="text-green-600 hover:underline font-semibold">Télécharger RCP</span>
        </div>

      </div>



      <!-- Middle Canvas (Iframe for PDF Preview) -->
      <div class="middle-canvas">
        <div class="browser-mockup with-url h-full">

        <div ref="scalableContainer" class="scalable-container">
        <div class="custom-component">
          <UnitEmbed 
            :profile="profile"
            :key="selectedActivity?.token || Date.now()" 
            />
        </div>

        </div>
        <div class="relative border border-gray-200 rounded-md inline-block p-4 border-l-8 primary">
          <a
            class="link break-all text-[0.7rem] leading-1 text-gray-400 inline-block pr-14 decoration-white"
            :href="unitUrl"
            target="_blank"
          >
            {{ unitUrl }}
          </a>

          <div 
            class="absolute top-0 right-0 m-2 hover:bg-gray-200 px-2 py-1 bg-gray-100 rounded-md cursor-pointer"
            @click="copyToClipboard"
            title="Copy to clipboard"
            >
            <OhVueIcon name="fa-regular-copy" fill="#8d8d8d"  scale="0.9"/>
          </div>
        </div>
        <!-- <button class="btn bg-primary rounded-md text-white mt-2" @click="showHistoryHandler">Preview history</button> -->

      </div>
    </div>

    <div class="activity-sidebar relative bg-white shadow-md p-4 m-4 flex flex-col min-w-[300px] max-h-[calc(100dvh-70px)] overflow-y-auto">
    <!-- Fixed header -->
    <div class="sticky top-0 pb-2 z-20">
      <h3 class="font-bold text-lg text-gray-700 border-b pb-2">Activités</h3>
      <!-- Gradient overlay for scrolling content -->
      <div class="absolute left-0 right-0 bottom-[-12px] h-6 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
    </div>
  
      <!-- Scrollable content -->
      <div class="overflow-y-auto max-h-[calc(100vh-100px)] relative top-[-10px] flex flex-col gap-3">
        <draggable
          v-model="activitiesList"
          :disabled="false"
          :animation="200"
          ghost-class="ghost"
          chosen-class="chosen"
          drag-class="drag"
          @start="isDragging = true"
          @end="onDragEnd"
          class="flex flex-col gap-3"
          item-key="id"
        >
          <template #item="{ element: activity, index }">
            <div
              :key="activity.id"
              class="first:mt-2 thumbnail"
              :class="['relative cursor-pointer flex p-3 border rounded-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-md', 
                      { 'border-2 border-primary bg-blue-50 shadow-md': activity.id === activeActivity,
                        'border-gray-200 opacity-70': activity.id !== activeActivity,
                        'cursor-grab': !isDragging,
                        'cursor-grabbing': isDragging }]"
              @click="!isDragging && selectActivity(activity.id)"
            >
          <div class="flex flex-col justify-start w-full">
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center gap-2">
                <span :class="{ 'border-2 border-primary bg-primary text-white': activity.id === activeActivity,
                      'border-gray-200 opacity-70': activity.id !== activeActivity }" class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Activité {{ index + 1 }}
                </span>
                <!-- Drag handle -->
                <div class="drag-handle text-gray-400 hover:text-gray-600 cursor-grab">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
                  </svg>
                </div>
              </div>
              <span v-if="activity.fieldName.includes('endpoint')" class="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                Endpoint
              </span>
            </div>
            
            <h4 class="font-semibold text-sm pr-[2rem]" :title="activity.activityTitle">
              {{ activity.activityTitle.length > 25 ? activity.activityTitle.slice(0, 25) + '...' : activity.activityTitle }}
            </h4>
            
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs text-gray-500 italic" :title="activity.fieldName">
                {{ activity.fieldName }}
              </span>
              
              <div v-if="activity.id === activeActivity" 
                  class="screenshot-btn absolute right-2 bottom-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-primary transition-colors duration-200 group"
                  @click.stop="takeScreenshot" 
                  title="Prendre une capture d'écran">
                <OhVueIcon name="md-addaphoto-round" class="group-hover:scale-110 transition-transform duration-200" fill="currentColor" :class="{'text-gray-600': true, 'group-hover:text-white': true}" scale="0.9"/>
              </div>
            </div>
          </div>
        </div>
          </template>
        </draggable>
      </div>
    </div>

    
    </div>

    <!-- Project PDF update Overlay -->
    <ProjectUpdateOverlay
      v-if="showProjectUpdateOverlay"
      :projectId="route.params.id"
      @close="showProjectUpdateOverlay = false"
      @projectUpdated="onProjectUpdated"
    />

    <!-- Save Confirmation Overlay -->
    <transition name="fade">
      <div v-if="showSaveOverlay" class="overlay" @click="closeSaveOverlay">
        <div class="overlay-content" @click.stop>
          <OhVueIcon name="bi-check-circle" class="success-icon" scale="3" animation="pulse"/>
          <h3>Votre projet a bien été sauvegardé!</h3>
          <div class="overlay-buttons" style="margin-top: 1rem !important;">
            <button class="btn bg-primary rounded-md text-white"  @click="closeSaveOverlay">OK</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Overlay for delete project confirmation -->
    <transition name="fade">
      <div v-if="showDeleteProjectOverlay" class="overlay" @click="cancelDelete">
        <div class="overlay-content" @click.stop>
          <h3>Êtes-vous certain de vouloir supprimer ce projet?</h3>
          <div class="overlay-buttons">
            <button class="btn bg-primary rounded-md text-white" @click="deleteProject">Supprimer</button>
            <button class="btn rounded-md"  @click="cancelDelete">Annuler</button>
          </div>
        </div>
      </div>
    </transition>


    <!-- Overlays for Custom Theme Color Picker -->

    <!-- Quill Editor Overlay -->
    <transition name="fade" mode="out-in">
      <div v-if="showQuillOverlay" class="overlay">
        <!--  v-model:content="selectedActivity.defaultText" -->
        <div class="overlay-content" @click.stop>
          <QuillEditor
           
            :content="editorContent"
            @save="saveQuillContent"
            @cancel="cancelQuillOverlay"
          />
        </div>
      </div>
    </transition>


  </div>

  <!-- Display a message if the project is not found -->
  <div v-else class="editor" style="height: 100vh;"></div>


</template>

<style scoped>

.editor {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  height: 100%;
  background: rgb(235,239,241);
  background: linear-gradient(180deg, rgba(235,239,241,1) 44%, rgba(198,204,205,1) 82%);
}

.editor > :nth-last-child(1) {
  flex: 1; /* Allows the last child to grow and take remaining space */
  overflow: auto; /* Ensures content is scrollable if it overflows */
}

.content {
  display: flex;
  /* height: 100%; */
  transition: all 0.3s ease-in-out;

}

h3 {
  padding: 0.5rem;
  background-color: var(--light_gray_2);
  border-radius: var(--border-radius_button);
  margin-bottom: 10px;
}

.overlay-content h3 {
  padding: 0.5rem;
  background-color: white;
  border-radius: var(--border-radius_button);
  margin-bottom: 10px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}


.accordion-content {
  padding: 0.7rem;
  background-color: var(--light_gray_2);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  margin-bottom: 0.7rem;
  margin-top: -12px !important;
  /* animation: openAccordion 0.4s ease-in-out; */
}


/* Keyframes for open and close animations */
@keyframes openAccordion {
  from {
    max-height: 0;
  }
  to {
    max-height: 100%; /* Adjust based on the content height */
  }
}

@keyframes closeAccordion {
  from {
    max-height: 300px; /* Should match the max-height in openAccordion */
  }
  to {
    max-height: 0;
  }
}

.left-sidebar {
  flex: 1;
  max-width: 350px;
  padding: 2rem;
  display: flex;
  flex-direction: column;

  background-color: white;
  margin: 20px;
  border-radius: 0.4rem;
}

.activity-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.middle-canvas  {
  flex: 2;
  /* background: rgb(235,239,241);
  background: linear-gradient(180deg, rgba(235,239,241,1) 44%, rgba(198,204,205,1) 82%); */
  margin: 0;
  min-width: 300px;
  padding: 1.2rem 0.4rem;
}

.browser-container {
  margin: 0.4rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: var(--border-radius);
  /* box-shadow: 0px -1px 12px 5px rgba(0,0,0,0.17); */
}

.iframe-container {
  width: 100%;
  height: 100%;
  margin-bottom: 1.3rem;
}
iframe {
  width: 100%;
  height: 100%;
  border: 1px solid #e3e0e0;
  border-radius: 8px;
}

.activity-sidebar {
  flex: 0.5;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.4rem;

}

.theme-dropdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 10%;
  border: 1px solid #ccc;
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
}

.overlay-content {
  background: white;
  width: 50%;
  padding: 2rem 2rem 1rem 2rem;
  border-radius: 10px;
  text-align: center;
  height:auto;

  box-shadow: 0px -1px 12px 5px rgba(0,0,0,0.17);
  animation: fadeIn 0.5s ease-in-out forwards;

}

.overlay-buttons {
  margin-top: 2rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, /* Set initial state of entering element */
.fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


input:disabled {
  cursor: not-allowed;
  color: slategrey;
}

.input-disabled {
  color: slategrey;
  background-color: theme('colors.gray.100');
  cursor: pointer !important;
}

/* Validation styles */
.form-control.border-red-500 {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px #ef4444;
}

.form-control.border-red-500:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

input {
 font-size: 0.9rem;
 text-overflow: ellipsis;
}

.color-input {
  -webkit-appearance: none;
  height: auto;
  margin-top: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
	padding: 0;
}
input[type="color"]::-webkit-color-swatch {
	border: none;
}
  
textarea {
  font-size: 0.9rem;
  min-height: 40px;
}

input[type="checkbox"] {
  width: 40px;
  height: 20px;
  margin-top: 0.25rem;
  appearance: none;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background 0.3s;
}

input[type="checkbox"]:checked {
  background: var(--color-primary); /* Works if you've defined `primary` in your Tailwind config */
}

input[type="checkbox"]::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  top: 1px;
  left: 1px;
  transition: transform 0.3s;
}

input[type="checkbox"]:checked::before {
  transform: translateX(20px);
}

input[type="checkbox"]:disabled {
  cursor: not-allowed;
  background: #ccc;
}

.switch-label {
  font-size: 1rem;
}

.success-icon {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.header-icon {
  font-size: 2rem;
  color: white;
}


.accordion-enter-active, .accordion-leave-active {
  transition: height 0.3s ease;
}

.accordion-enter-from, .accordion-leave-to {
  height: 0;
  overflow: hidden;
}

.default-text-preview {
  font-size: 0.8rem;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  
}


.iframe-src {
  overflow-wrap: anywhere;
  font-size: 0.8rem;
  line-height: 1rem;
  display: block;
}

.tooltip {
  position: relative;
  cursor: pointer;
}
.tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: white;
  text-align: center;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above */
  left: 50%;
  transform: translateX(-50%);
}
.tooltip:hover .tooltiptext {
  visibility: visible;
}

.left-sidebar-buttons {
  display: flex;
  gap: 0.8rem;
  padding-bottom: 2rem;
  padding: 1rem;
  border-radius: 6px;
  background-color: var(--light_gray_2);
  margin-bottom: 1rem;
}

#maxCharAllowedCheckbox{
  margin-bottom: 10px;
}

  label {

    font-weight: 400;
    line-height: 1.2;
  }

  label:hover {
    cursor: pointer;
    font-weight: 500;
  }

.alert-container {
  background: rgb(0,0,0);
  background: linear-gradient(180deg, rgba(0,0,0,0) 22%, rgba(0,0,0,0.6601234243697479) 100%);
}

/*  */

.scalable-container {
  position: relative;
  width: 100% !important;
  padding-top: 56.125%;
  height: 0;
  overflow: hidden;
  margin-bottom: 1rem;
}

.scalable-container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  box-sizing: border-box; /* Include borders/paddings in dimensions */
}

.custom-component {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: top left; /* Scale from the center */
  padding: 2px;
}

#pdfFilename {
  padding-right: 48px;
}

/* Validation error message styles */
.text-red-500.text-sm.mt-1 {
  line-height: 118%;
  margin-bottom: 0.5rem;
}

/* Drag & Drop styles */
.ghost {
  opacity: 0.5;
  background: #f3f4f6;
  border: 2px dashed #9ca3af;
}

.chosen {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.drag {
  transform: rotate(5deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.drag-handle {
  transition: color 0.2s ease;
}

.drag-handle:hover {
  color: #6b7280;
}

/* Disable text selection during drag */
.sortable-ghost {
  user-select: none;
}

</style>
