<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProjects } from "~/stores/projects";
import { da } from 'date-fns/locale';

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
// Parse the tiers JSON string into an object
const tiers = JSON.parse(config.public.NUXT_PUBLIC_TIERS);

const { navigateToStripeDashboard } = useStripe()

const showProjectCreationOverlay = ref(false);
const showDeleteProjectOverlay = ref(false);
const selectedProjectId = ref(null);
const projectLimitReached = ref(false); // Tracks if the user has reached the project limit

const { status, data } = useAuth();
const router = useRouter();
const projectStore = useProjects();

// Fetch projects on component mount
onMounted(async () => {
  
  if (status.value === "authenticated") {
    // Get the subscription status
    const isSubscribed = data.value?.user?.isSubscribed;
    // Check if the user is subscribed
    if (!isSubscribed) {
      console.log('Your are not subscribed');
      return;
      // navigateToStripeDashboard();
    }

    checkProjectLimit();

    // Check if the projects have already been fetched
    if (!projectStore.projectsLoaded) {
      console.log("Initiating the projects fetch...");
      await projectStore.fetchProjects();
      checkProjectLimit();
    }
  }
});

// Group projects by courseId
const groupedProjects = computed(() => {
  const groups = {};
  projectStore.projects.forEach((project) => {
    const courseId = project.profile?.courseId || "Uncategorized";
    if (!groups[courseId]) {
      groups[courseId] = [];
    }
    groups[courseId].push(project);
  });
  return groups;
});

// Filtered projects logic
const filterKey = ref("name");
const filterValue = ref("");
const filteredProjects = computed(() => {
  const filterText = filterValue.value.toLowerCase();
  const filtered = {};

  Object.entries(groupedProjects.value).forEach(([courseId, projects]) => {
    const matchingProjects = projects.filter((project) => {
      const courseName = project.profile?.courseId.toLowerCase();
      const projectName = project.profile?.name.toLowerCase();
      
      // Preformat the date into the string format used for display on the card
      const date = new Date(project.updated);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

      return (
        (filterKey.value === "courseId" && courseName.includes(filterText)) ||
        (filterKey.value === "name" && projectName.includes(filterText)) ||
        (filterKey.value === 'date' && formattedDate.includes(filterText))
      );
    });

    if (matchingProjects.length) {
      filtered[courseId] = matchingProjects;
    }
  });

  return filtered;
});

// Check if the user has reached the project limit
function checkProjectLimit() {
  const userPlan = data.value?.user?.plan;
  const currentProjects = projectStore.projects.length;
  const planLimits = {
  [tiers.tier1.id]: tiers.tier1.limit,
  [tiers.tier2.id]: tiers.tier2.limit,
  [tiers.tier3.id]: tiers.tier3.limit,
  [tiers.tier4.id]: tiers.tier1.limit,
  [tiers.tier5.id]: tiers.tier2.limit,
  [tiers.tier6.id]: tiers.tier3.limit,
  };
  projectLimitReached.value = currentProjects >= planLimits[userPlan];
}

function handleDeleteProject(projectId) {
  selectedProjectId.value = projectId;
  showDeleteProjectOverlay.value = true;
}

async function confirmDeleteProject() {
  showDeleteProjectOverlay.value = false;
  await projectStore.deleteProject(selectedProjectId.value);
  selectedProjectId.value = null;
  checkProjectLimit();
}

function cancelDelete() {
  selectedProjectId.value = null;
  showDeleteProjectOverlay.value = false;
}

function onProjectCreated(newProjectId) {
  showProjectCreationOverlay.value = false;
  
  // Check the project limit
  checkProjectLimit();
  router.push(`/editor/${newProjectId}`);
}

function editProject(projectId) {

  // Verify if the project exists in the projectStore.projects array
  const project = projectStore.projects.find((p) => p.id === projectId);
  if (!project) {
    console.error(`Project with ID ${projectId} not found in the projectStore.projects array.`);
    return;
  }

  router.push(`/editor/${projectId}`);
}
</script>

<template>

  

  <div v-if="!data?.user?.isSubscribed" class="p-6 space-y-8 pt-24 bg-slate-50 wrapper">
    <PricingSectionAlternate />
  </div>
  <div v-else class="p-6 space-y-8 pt-24 bg-slate-50 wrapper" :class="{ transparent: projectStore.isLoading || projectStore.projectIsBeingCreated }">
    
    <!-- <PDFScanner/> -->

    <!-- New Project Button -->
    <div class="flex items-center justify-center cursor-pointer text-3xl text-gray-400 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-100 mb-8" @click="showProjectCreationOverlay = true" v-if="!projectLimitReached">
      +
    </div>

    <!-- Alert for project limit reached -->
    <div v-if="projectLimitReached" class="alert bg-white shadow-lg rounded-lg border-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-info h-12 w-12 shrink-0 stroke-primary">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <span class="line-clamp-4 leading-5">Vous avez atteint la limite de projets pour votre forfait actuel. Pour ajouter plus de projets, passez à un forfait supérieur.</span>
      </div>
      <div class="flex-none md:ml-24 lg:ml-96">
        <button class="btn btn-primary btn-sm text-white" @click="navigateToStripeDashboard">Upgrade</button>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="flex items-center space-x-4 mb-6">
      <select v-model="filterKey" class="border rounded px-4 py-2 text-gray-600">
        <option value="courseId">Identifiant</option>
        <option value="name">Nom du projet</option>
        <option value="date">Date</option>
      </select>
      <input
        type="text"
        v-model="filterValue"
        class="border rounded px-4 py-2 w-full"
        placeholder="Filtrer les projets..."
      />
    </div>

    <!-- Projects Grouped by Course ID -->
    <div v-for="(projects, courseId) in filteredProjects" :key="courseId" class="space-y-4">
      <h2 class="text-xl font-medium">{{ courseId }}</h2>
      <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :title="project.profile.name"
          class="h-80"
          @click="editProject(project.id)"
          @deleteProject="handleDeleteProject"
        />
      </div>
    </div>

    <!-- Project Creation Overlay -->
    <ProjectCreationOverlay
      v-if="showProjectCreationOverlay"
      @close="showProjectCreationOverlay = false"
      @projectCreated="onProjectCreated"
    />

    <!-- Delete Project Overlay -->
    <transition name="fade">
      <div v-if="showDeleteProjectOverlay" class="overlay" @click="cancelDelete">
        <div class="overlay-content" @click.stop>
          <h3 class="mb-4">Souhaitez-vous vraiment supprimer ce projet?</h3>
          <div class="overlay-buttons flex justify-center gap-3">
            <button class="btn bg-primary rounded-md text-white" @click="confirmDeleteProject">Oui, supprimer</button>
            <button class="btn rounded-md" @click="cancelDelete">Annuler</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>

.wrapper {
  height: 100%;
  min-height: 100dvh;
}

/* Reuse styles */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  margin-top: 0px !important;
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
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0px -1px 12px 5px rgba(0, 0, 0, 0.17);
  animation: fadeIn 0.5s ease-in-out forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
