<script setup lang="ts">
    import { ref, computed, watchEffect } from 'vue';
    import { useRouter } from 'vue-router';
    import { useProjects } from '~/stores/projects';
    import { da } from 'date-fns/locale';
    
    // import auth from '~/middleware/auth';
    // import { AuthHandler } from 'next-auth/core';
    // import { set } from 'date-fns';
    // import { useSession } from '@auth0/nextjs-auth0/client';

    const showProjectCreationOverlay = ref(false);
    const showDeleteProjectOverlay = ref(false);
    const selectedProjectId = ref(null);

    const { status, data } = useAuth();
    const router = useRouter();
    const projectStore = useProjects();

    // Filter state
    const filterKey = ref('author'); // Default filter key
    const filterValue = ref(''); // Default filter value

    definePageMeta({
        middleware: ["auth"],
    });

    // Fetch projects on component mount, to make sure 
    // the informations on the card is up to date...
    onMounted(async() => {
      if (status.value === 'authenticated') {
        if (projectStore.projectsLoaded == false) { 
          console.log('Initiating the projects fetch...');
          // await projectStore.fetchProjects(data.value.user.userId);     
          await projectStore.fetchProjects();   
          console.log(projectStore.projects);   
        }
      }
    });

    // Group projects by author
    const groupedProjects = computed(() => {
    const groups = {};
    projectStore.projects.forEach((project) => {

        const authorName = project?.expand?.author?.name || 'Auteur inconnu';
        
        if (!groups[authorName]) {
          groups[authorName] = [];
        }
        groups[authorName].push(project);
    });
    return groups;
    });

    // Filtered projects logic
    const filteredProjects = computed(() => {
      const filterText = filterValue.value.toLowerCase();
      const filtered = {};

      Object.entries(groupedProjects.value).forEach(([author, projects]) => {
          const matchingProjects = projects.filter((project) => {
          const name = project.profile?.name.toLowerCase();
          
          // Preformat the date into the string format used for display on the cards
          // const date = new Date(project.updated).toLocaleDateString('fr-FR');
          const date = new Date(project.updated);
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

          const authorName = project.expand?.author?.name.toLowerCase();

          if (filterKey.value === 'name') {
              return name.includes(filterText);
          } else if (filterKey.value === 'date') {
              return formattedDate.includes(filterText);
          } else if (filterKey.value === 'author') {
              return authorName.includes(filterText);
          }
          return true;
          });

          if (matchingProjects.length) {
            filtered[author] = matchingProjects;
          }
    });

    return filtered;
    });

    function handleDeleteProject(projectId) {
        selectedProjectId.value = projectId; // Store the projectId
        showDeleteProjectOverlay.value = true; // Show the overlay
    }

    async function confirmDeleteProject() {
        showDeleteProjectOverlay.value = false;
        
        setTimeout(async () => {
            await projectStore.deleteProject(selectedProjectId.value);
            selectedProjectId.value = null;
        }, 200);
    }

    function cancelDelete() {
        selectedProjectId.value = null;
        showDeleteProjectOverlay.value = false;
    }

    function onProjectCreated() {
        showProjectCreationOverlay.value = false;
        
        setTimeout(async () => {
            // projectStore.fetchProjects(data.value.user.userId);
            await projectStore.fetchProjects();
        }, 200);  
    }

    function editProject(projectId) {
        router.push(`/editor/${projectId}`);

    }
</script>


<template>
    <div class="p-6 space-y-8 pt-24 bg-slate-50" :class="projectStore.isLoading ? 'transparent' : ''">
      <!-- New Project Button -->
      <div
        class="flex items-center justify-center cursor-pointer text-3xl text-gray-400 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-100 mb-8"
        @click="showProjectCreationOverlay = true"
      >
        +
      </div>
  
      <!-- Filter Section -->
      <div class="flex items-center space-x-4 mb-6">
        <!-- Dropdown to select filter parameter -->
        <select v-model="filterKey" class="border rounded px-4 py-2 text-gray-600">
          <option value="author">Auteur</option>
          <option value="name">Nom du projet</option>
          <option value="date">Date</option>
        </select>
  
        <!-- Text input to type filter value -->
        <input
          type="text"
          v-model="filterValue"
          class="border rounded px-4 py-2 w-full"
          placeholder="Filtrer les projets..."
        />
      </div>
  
      <!-- Projects Grouped by Author -->
      <div v-for="(projects, author, index) in filteredProjects" :key="author" class="space-y-4">
        <h2 class="text-xl font-medium">{{ author }}</h2>

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
  
      <!-- Overlay for delete project confirmation -->
      <transition name="fade">
        <div v-if="showDeleteProjectOverlay" class="overlay" @click="cancelDelete">
          <div class="overlay-content" @click.stop>
            <h3>Êtes-vous certain de vouloir supprimer ce projet?</h3>
            <div class="overlay-buttons">
              <button class="btn bg-primary rounded-md text-white" @click="confirmDeleteProject">Supprimer</button>
              <button class="btn rounded-md" @click="cancelDelete">Annuler</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </template>
  

  
  <style scoped>

  
select {
    -webkit-appearance: none;
    appearance: none;
    background-repeat: no-repeat;
    background-position: right;
    background-position-x: 90%;
    -webkit-padding-end: 20px;
}
  
  /* Existing styles */
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
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }
  
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
  </style>