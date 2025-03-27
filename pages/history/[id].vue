<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjects } from '~/stores/projects';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { MdDelete } from "oh-vue-icons/icons";

addIcons(MdDelete);

definePageMeta({
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const projectStore = useProjects();

const projectId = computed(() => route.params.id);
const projectHistory = ref(null);
const isLoading = ref(false);
const error = ref(null);
const showDeleteConfirmation = ref(false);
const recordToDelete = ref(null);
const hoveredAnswerId = ref(null);
const tooltipPosition = ref({ top: 0, left: 0 });
const tooltipContent = ref('');
const tooltipVisible = ref(false);

// Fetch project history
async function fetchProjectHistory() {
  isLoading.value = true;
  error.value = null;
  try {
    projectHistory.value = await projectStore.fetchProjectHistory(projectId.value);
  } catch (err) {
    error.value = err.message || 'Failed to fetch project history';
  } finally {
    isLoading.value = false;
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return format(date, 'dd MMMM yyyy, HH:mm', { locale: fr });
}

// Delete record
async function deleteRecord(recordId) {
  recordToDelete.value = recordId;
  showDeleteConfirmation.value = true;
}

async function confirmDelete() {
  showDeleteConfirmation.value = false;
  try {
    const response = await fetch(`/api/pb/delete-history-record/${recordToDelete.value}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete record');
    }

    // Instead of re-fetching, filter the deleted record
    if (projectHistory.value && projectHistory.value.historyByBackpack) {
      for (const backpackId in projectHistory.value.historyByBackpack) {
        projectHistory.value.historyByBackpack[backpackId] = projectHistory.value.historyByBackpack[backpackId].filter(
          (record) => record.id !== recordToDelete.value
        );
      }
    }
  } catch (err) {
    error.value = err.message || 'Failed to delete record';
  } finally {
    recordToDelete.value = null;
  }
}

function cancelDelete() {
  showDeleteConfirmation.value = false;
  recordToDelete.value = null;
}

// Function to trim and clean the answer
function trimAnswer(answer) {
  if (!answer) return '';

  const noLineBreaks = answer.replace(/(\r\n|\n|\r)/gm, " ");
  const noMultipleSpaces = noLineBreaks.replace(/\s+/g, ' ');

  return noMultipleSpaces.length > 50 ? noMultipleSpaces.substring(0, 50) + '...' : noMultipleSpaces;
}

function showTooltip(event, content) {
  const row = event.currentTarget;
  const tableContainer = row.closest('.overflow-x-auto');
  const tableRect = tableContainer.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  tooltipContent.value = content;
  tooltipPosition.value = {
    top: rowRect.top - tableRect.top + rowRect.height,
    left: tableRect.right - tableRect.left - 100
  };
  tooltipVisible.value = true;
}

function hideTooltip() {
  tooltipVisible.value = false;
}

onMounted(async () => {
  await fetchProjectHistory();
});
</script>

<template>
  <div class="p-6 space-y-8 pt-24 min-h-screen bg-gray-50">
    <div class="container mx-auto">
      <h1 class="text-3xl font-bold mb-6">Historique du projet</h1>

      <div v-if="isLoading" class="text-center">Chargement...</div>

      <div v-else-if="error" class="alert alert-error shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>

      <div v-else-if="projectHistory && projectHistory.historyByBackpack">
        <div v-for="(historyRecords, backpackId) in projectHistory.historyByBackpack" :key="backpackId" class="mb-8">
          <div class="mb-4">
            <h2 class="text-2xl font-semibold mb-1">
              <span v-if="projectHistory.backpackRecords[backpackId]">
                {{ projectHistory.backpackRecords[backpackId].name }}
              </span>
            </h2>
            <p class="text-sm text-gray-500">Backpack ID: {{ backpackId }}</p>
          </div>

          <div class="overflow-x-auto rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
            <table class="table w-full bg-white">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activité</th>
                  <th>Réponse</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in historyRecords"
                  :key="record.id"
                  class="cursor-pointer border-b border-gray-200 bg-white hover:bg-gray-100"
                  @mouseover="showTooltip($event, record.answer)"
                  @mouseleave="hideTooltip"
                >
                  <td>{{ formatDate(record.created) }}</td>
                  <td>{{ record.activityTitle }}</td>
                  <td>
                    <span class="truncate max-w-[200px] block">
                      {{ trimAnswer(record.answer) }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="deleteRecord(record.id)">
                      <OhVueIcon name="md-delete" class="text-error" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else>
        <p>Aucune donnée d'historique trouvée pour ce projet.</p>
      </div>

      <!-- External Tooltip -->
      <div 
        v-if="tooltipVisible"
        class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-96 max-h-[50vh] overflow-auto"
        :style="{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }"
      >
        <div v-html="tooltipContent" class="prose max-w-full"></div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog id="delete_confirmation" class="modal" :class="{ 'modal-open': showDeleteConfirmation }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Êtes-vous sûr de vouloir supprimer cet enregistrement ?</h3>
        <div class="modal-action">
          <button class="btn btn-error" @click="confirmDelete">Supprimer</button>
          <button class="btn" @click="cancelDelete">Annuler</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.prose {
  max-width: 100%;
}
</style>