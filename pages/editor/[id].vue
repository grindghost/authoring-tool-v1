<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { isBefore, set, startOfDay } from "date-fns";

import  DOMPurify from 'dompurify';
import { useRouter, useRoute } from 'vue-router'
import { useProjects } from '~/stores/projects'
import { useProjectModelStore } from '~/stores/projectModel'
import { initializeContainerScaler } from '~/utils/editorContainerScaler';
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiCheckCircle, HiDownload, FaRegularCopy } from "oh-vue-icons/icons";
import ProjectUpdateOverlay from '~/components/ProjectUpdateOverlay.vue';
import { useAppStateStore } from '/stores/appState';

// Register the icons
addIcons(BiCheckCircle, HiDownload, FaRegularCopy);

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

const iframeSrc = ref('');                    // Reactive iframe src
const iframe = ref(null);                     // Reference to iframe element

// Getters ****************************************
const project = computed(() => {
  const projectId = route.params.id
  const selectedProject = projectStore.projects.find((p) => p.id === projectId)
  return selectedProject ? selectedProject.profile : {}
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
  const locale = projectStore.locales.find((l) => l.lang === currentLang);
  
  return locale;
});

const configs = computed(() => {
  return projectStore.configs;
});

const profile = computed(() => {    

    // Reset the app state
    appStateStore.resetAppState();

    // Get the project from the projects store (with the profile key)
    const currentProject = computed(() => projectStore.projects.find((p) => p.id === route.params.id));

    const projectId = route.params.id;
    const activityId = selectedActivity.value.id;

    const _history = computed(() => {
      return appStateStore.getAnswerFromLocalStorage(projectId, activityId);
    }).value;
    
    
    const _profile = {
      configs: configs.value,
      project: currentProject.value,
      activity: selectedActivity.value,
      locale: language.value,
      history: _history,
      message: null,
      mockup: true,
    }

    // Update app state synchronously
    setTimeout(() => {
      appStateStore.SetUnitStateOnArrival(_profile);
    }, 1000);
    
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

  const projectId = route.params.id;
  const updatedProject = project.value;

  // for each activity in the project, update the activity
  // console.log('Updated project:', updatedProject);

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

function downloadZip() {
  projectStore.downloadProjectZip(project.value.activities, route.params.id, project.value.lang);
}

function closeSaveOverlay() {
  showSaveOverlay.value = false; // Close the save overlay
}

function selectActivity(activityKey) {

  activeActivity.value = activityKey;
  selectedActivity.value = project.value.activities[activityKey] || {};
  
  // add the id in the selected activity
  selectedActivity.value.id = activityKey;

  accordion.value.project = false;
  accordion.value.activity = true;

}

function saveQuillContent(html) {
  if (editingField.value) {

    // Sanitize the html content
    const sanitizedHtml = DOMPurify.sanitize(html, {FORBID_TAGS: ['img']});

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
}

// Watchers ****************************************
watch(project, (newVal) => {
  if (newVal) {
    // ...
    // console.log('Project/profile updated:', profile.value);

    if (!showProjectUpdateOverlay.value) {
      showAlert.value = true;
    }

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
  }

})

</script>

<template>
  <div class="editor" v-if="projectStore.projects.length" :class="projectStore.isLoading ? 'transparent' : ''">
  <!-- Alert to save the project -->
    <div class="alert-container mt-20 px-4 fixed z-50 bottom-0 pb-4 pt-10 w-full" v-if="showAlert">
    <div role="alert" class="alert bg-white shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-info h-6 w-6 shrink-0 stroke-primary">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>Assurez-vous de sauvegarder votre projet avant de quitter.</span>
      <div class="flex gap-1">
        <button class="btn bg-primary rounded-md text-white" @click="saveProject">Sauvegarder</button>
        <button class="btn bg-slate-50 rounded-md text-black" @click="showAlert = false">Ok</button>
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
                    <!-- <span class="tooltiptext">{{ tooltips[key] }}</span> -->
                    <input
                      type="text"
                      id="name"
                      v-model="project.name"
                      class="form-control"
                      :readonly="!projectModelStore.projectParams.name.editable"
                      :disabled="!projectModelStore.projectParams.name.editable"
                      required
                    />
                  </div>

                  <!-- Course ID -->
                  <div class="form-group">
                    <label for="courseId" v-html="projectModelStore.projectParams.courseId.label"></label>
                    <input
                      type="text"
                      id="courseId"
                      v-model="project.courseId"
                      class="form-control"
                      :readonly="!projectModelStore.projectParams.courseId.editable"
                      :disabled="!projectModelStore.projectParams.courseId.editable"
                    />
                  </div>

                  <!-- Course ID -->
                  <div class="form-group">
                    <label for="courseId" v-html="projectModelStore.projectParams.description.label"></label>
                    <textarea
                      id="description"
                      v-model="project.description"
                      class="form-control"
                      :readonly="!projectModelStore.projectParams.description.editable"
                      :disabled="!projectModelStore.projectParams.description.editable"
                    > </textarea>
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
                        :placeholder="'Exemple: #ff0000'"
                      />
                      <input
                        type="color"
                        v-model="project.customTheme"
                        class="color-input"
                        
                      />
                    </div>
                  </div>

                  <!-- PDF Filename (Read-only) -->
                  <div class="form-group">
                    <label for="pdfFilename" v-html="projectModelStore.projectParams.pdfFilename.label"></label>
                    <input
                      type="text"
                      id="pdfFilename"
                      v-model="project.pdfFilename"
                      class="form-control"
                    />
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
                    />
                    <span v-if="isDateExpired" class="text-red-500 text-sm mt-1">Expiré</span>
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
              
              <form @submit.prevent="saveProject">

                  <!-- PDF form field name -->
                  <div class="form-group">
                    <label for="formFeldName">Nom du champ (PDF)</label>
                    <input
                      type="text"
                      id="formFeldName"
                      v-model="activeActivity"
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
                      :readonly="!projectModelStore.activitiesParams.activityTitle.editable"
                      :disabled="!projectModelStore.activitiesParams.activityTitle.editable"
                      required
                    />
                  </div>

                  <!-- Default text -->
                  <div class="form-group">
                    <label for="defaultText" v-html="projectModelStore.activitiesParams.defaultText.label"></label>

                    <input
                      type="text"
                      id="defaultText"
                      v-model="selectedActivity.defaultText"                
                      class="form-control input-disabled"
                      @click="openEditor('defaultText')"
                      readonly
                      required
                    />                
                  </div>

                  <!-- Context/content text -->
                  <div class="form-group">
                    <label for="contextText" v-html="projectModelStore.activitiesParams.contextText.label"></label>

                    <input
                      type="text"
                      id="contextText"
                      v-model="selectedActivity.contextText"                
                      class="form-control input-disabled"
                      @click="openEditor('contextText')"
                      readonly
                      required
                    />                
                  </div>
                  
                  <!-- Is Endpoint Toggle -->                
                  <div class="form-group">
                    <label for="isEndpoint" v-html="projectModelStore.activitiesParams.isEndpoint.label">
                    </label>
                    <input
                      type="checkbox"
                      id="isEndpoint"
                      v-model="selectedActivity.isEndpoint"
                      :disabled="!projectModelStore.activitiesParams.isEndpoint.editable"
                    />
                  </div>
                  
                  <!-- Limit characters Toggle -->                
                  <div class="form-group">
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
                  <div class="form-group" v-if="selectedActivity.useCharactersLimit">
                    <label for="maxCharactersAllowed" v-html="projectModelStore.activitiesParams.maxCharactersAllowed.label"></label>
                    <input
                      type="number"
                      id="maxCharactersAllowed"
                      v-model="selectedActivity.maxCharactersAllowed"
                      class="form-control"
                      :disabled="!projectModelStore.activitiesParams.maxCharactersAllowed.editable"
                    />
                  </div>

                  <!-- Use custom placeholder text toggle -->                
                  <div class="form-group">
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
                  <div class="form-group" v-if="selectedActivity.useCustomPlaceholder">
                    <label for="customPlaceholder" v-html="projectModelStore.activitiesParams.customPlaceholder.label"></label>
                    <input
                      type="text"
                      id="customPlaceholder"
                      v-model="selectedActivity.customPlaceholder"
                      class="form-control"
                      :disabled="!projectModelStore.activitiesParams.customPlaceholder.editable"
                    />
                  </div>

                  <!-- <div class="form-group">
                    <label for="name" v-html="projectModelStore.activitiesParams.defaultText.label"></label>
                    <input
                      type="text"
                      id="name"
                      v-model="selectedActivity.defaultText"
                      class="form-control"
                      :readonly="!projectModelStore.activitiesParams.defaultText.editable"
                      :disabled="!projectModelStore.activitiesParams.defaultText.editable"
                      required
                    />
                  </div> -->

                </form>
                
            </div>
          </div>
          <div class="left-sidebar-buttons">
            <button class="btn bg-primary rounded-md text-white" @click="saveProject">Sauvegarder</button>

            <button class="btn bg-white rounded-md" @click="handleDeleteProject">Supprimer</button>
        </div>

        <!-- <button class="btn bg-primary rounded-md text-white" @click="downloadZip">Télécharger</button> -->

        <div class="downloadBlock flex items-center justify-start gap-2 cursor-pointer" @click="downloadZip">
          <div class="rounded-full w-7 h-7 bg-primary flex items-center justify-center px-2 box-size">
            <OhVueIcon name="hi-download" class="" fill="#fff"  scale="0.9"/>
          </div>
          <span class="text-[var(--color-theme-button)] hover:underline bold">Télécharger le projet</span>
        </div>

      </div>



      <!-- Middle Canvas (Iframe for PDF Preview) -->
      <div class="middle-canvas">
        <div class="browser-mockup with-url">

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

      </div>
    </div>

      <!-- Right Sidebar: Clickable Thumbnails for Activities -->
       <div class="activity-sidebar">
        <div
          v-for="(activity, key, index) in project.activities"
          :key="key"
          :class="['thumbnail', { selected: key === activeActivity }]"
          @click="selectActivity(key)"
        >
          <div class="flex-column justify-start items-start ml-1">
            <h4 class="font-bold mb-[-3px]">
              <!-- {{ activity.activityTitle.slice(0, 20) + '...' }} -->
              Activité {{ index + 1 }}
            </h4>
            <span class="text-sm">
            {{ activity.activityTitle.slice(0, 18) + '...' }}
            </span>
          </div> 
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
      <div v-if="showQuillOverlay" class="overlay" @click="cancelQuillOverlay">
        <!--  v-model:content="selectedActivity.defaultText" -->
        <div class="overlay-content" @click.stop>
          <QuillEditor
           
            v-model:content="editorContent"
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
  border-radius: 4px;
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
  gap: 1rem;
}
.thumbnail {
  padding: 0.4rem;
  border: 1px solid #ccc;
  background-color: white;
  opacity: 0.5;
  cursor: pointer;
  /* text-align: center; */
  height: 70px;
  width: 100%;
  min-width: 150px;
  display: flex;
  align-items: start;
  justify-content: start;
  gap:0;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail.selected {
  opacity: 1;
  border: 2px solid black;
  box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.17);

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
  background: theme(colors.primary); /* Works if you've defined `primary` in your Tailwind config */
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

.switch-label {
  font-size: 1rem;
}

.success-icon {
  font-size: 2rem;
  color: theme(colors.primary);
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
</style>
