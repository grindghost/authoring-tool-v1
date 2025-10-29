<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjects } from '~/stores/projects';
import { format, set } from 'date-fns';
import { fr, ro } from 'date-fns/locale';
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { MdDelete } from "oh-vue-icons/icons";

addIcons(MdDelete);

definePageMeta({
  middleware: ['auth'],
});

// Toggle to display decoded actor name (true) or raw actor value (false)
const DECODE_ACTOR_NAME = true;

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
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ top: 0, left: 0 });
const selectedRecord = ref(null);

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

// Download PDF for specific user
async function downloadUserPdf(backpackId, actor) {
  try {
    await projectStore.downloadUserPdf(projectId.value, backpackId, actor);
  } catch (err) {
    error.value = err.message || 'Failed to download PDF';
  }
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

// Function to extract actor name from URI-encoded base64 JSON
function extractActorName(actorField) {
  if (!actorField || actorField === 'N/A') {
    return 'N/A';
  }

  // If DECODE_ACTOR_NAME is false, return the raw value (trimmed to 30 chars)
  if (!DECODE_ACTOR_NAME) {
    return actorField.length > 30 ? actorField.substring(0, 30) + '...' : actorField;
  }

  try {
    // First, decode the URI encoding
    const uriDecoded = decodeURIComponent(actorField);
    
    // Then decode the base64 string
    const base64Decoded = atob(uriDecoded);
    
    // Parse the JSON
    const actorData = JSON.parse(base64Decoded);
    
    // Extract the name field
    return actorData.name || 'N/A';
  } catch (error) {
    console.error('Error decoding actor field:', error);
    return 'N/A';
  }
}

// Function to trim and clean the answer
function trimAnswer(answer) {
  if (!answer) return '';

  const noLineBreaks = answer.replace(/(\r\n|\n|\r)/gm, " ");
  const noMultipleSpaces = noLineBreaks.replace(/\s+/g, ' ');

  return noMultipleSpaces.length > 50 ? noMultipleSpaces.substring(0, 50) + '...' : noMultipleSpaces;
}

// Computed property to sort history records by index
const sortedProjectHistory = computed(() => {
  if (!projectHistory.value || !projectHistory.value.historyByBackpack) {
    return null;
  }

  const sorted = {};
  for (const [backpackId, records] of Object.entries(projectHistory.value.historyByBackpack)) {
    // Sort records by index (ascending order)
    sorted[backpackId] = [...records].sort((a, b) => {
      const indexA = a.index || 0;
      const indexB = b.index || 0;
      return indexA - indexB;
    });
  }
  return {
    ...projectHistory.value,
    historyByBackpack: sorted
  };
});

function showTooltip(event, content, _) {
    if (event.target.tagName !== 'SPAN') {
        return;
    }

    // Process the content to add inline styles for bullets
    let processedContent = content;
    
    // Add inline styles to list items to override Tailwind
    processedContent = processedContent.replace(
        /<li([^>]*)>/g,
        '<li$1 style="position: relative; padding-left: 1rem; margin-bottom: 0.5rem; list-style: none;">'
    );
    
    // Add bullet styling for bullet lists
    processedContent = processedContent.replace(
        /<li([^>]*data-list="bullet"[^>]*)>/g,
        '<li$1 style="position: relative; padding-left: 2rem; margin-bottom: 0.5rem; list-style: none;"><span style="position: absolute; left: 0; color: #6b7280; font-size: 0.75rem;">•</span>'
    );
    
    // Handle indent classes
    processedContent = processedContent.replace(
        /<li([^>]*class="[^"]*ql-indent-1[^"]*"[^>]*data-list="bullet"[^>]*)>/g,
        '<li$1 style="position: relative; padding-left: 3.5rem; margin-bottom: 0.5rem; list-style: none;"><span style="position: absolute; left: 1.5rem; color: #6b7280; font-size: 0.75rem;">•</span>'
    );
    
    processedContent = processedContent.replace(
        /<li([^>]*class="[^"]*ql-indent-2[^"]*"[^>]*data-list="bullet"[^>]*)>/g,
        '<li$1 style="position: relative; padding-left: 5rem; margin-bottom: 0.5rem; list-style: none;"><span style="position: absolute; left: 3rem; color: #6b7280; font-size: 0.75rem;">•</span>'
    );
    
    // Process ordered lists by finding each <ol> and numbering its items
    processedContent = processedContent.replace(
        /<ol>([\s\S]*?)<\/ol>/g,
        (match, listContent) => {
            let counter = 1;
            let processedList = listContent.replace(
                /<li([^>]*data-list="ordered"[^>]*)>(.*?)<\/li>/g,
                (match, attributes, content) => `<li${attributes} style="position: relative; padding-left: 2rem; margin-bottom: 0.5rem; list-style: none; display: block;"><span style="position: absolute; left: 0; color: #6b7280; font-size: 0.75rem;">${counter++}.</span>${content}</li>`
            );
            
            // Handle indented ordered lists
            counter = 1;
            processedList = processedList.replace(
                /<li([^>]*class="[^"]*ql-indent-1[^"]*"[^>]*data-list="ordered"[^>]*)>(.*?)<\/li>/g,
                (match, attributes, content) => `<li${attributes} style="position: relative; padding-left: 3.5rem; margin-bottom: 0.5rem; list-style: none; display: block;"><span style="position: absolute; left: 1.5rem; color: #6b7280; font-size: 0.75rem;">${counter++}.</span>${content}</li>`
            );
            
            counter = 1;
            processedList = processedList.replace(
                /<li([^>]*class="[^"]*ql-indent-2[^"]*"[^>]*data-list="ordered"[^>]*)>(.*?)<\/li>/g,
                (match, attributes, content) => `<li${attributes} style="position: relative; padding-left: 5rem; margin-bottom: 0.5rem; list-style: none; display: block;"><span style="position: absolute; left: 3rem; color: #6b7280; font-size: 0.75rem;">${counter++}.</span>${content}</li>`
            );
            
            return `<ol>${processedList}</ol>`;
        }
    );
    
    // Hide ql-ui spans
    processedContent = processedContent.replace(
        /<span class="ql-ui"><\/span>/g,
        ''
    );

    tooltipContent.value = processedContent;
    
    // Get the span element and its position
    const span = event.target;
    const spanRect = span.getBoundingClientRect();
    
    // Get cursor position relative to viewport
    const cursorY = event.clientY;
    
    // Calculate optimal position to avoid overflow
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 400; // Use the same width as the answer span
    const tooltipHeight = 300; // Estimated tooltip height
    
    // Align tooltip with the answer span
    let left = spanRect.left;
    let top = cursorY + 10; // 10px offset from cursor

    // Adjust horizontal position to prevent overflow
    if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 10; // Align to right edge
    }
    
    // Ensure tooltip doesn't go outside left edge
    if (left < 10) {
        left = 10;
    }

    // Adjust vertical position to prevent overflow
    if (top + tooltipHeight > viewportHeight) {
        top = cursorY - tooltipHeight - 10; // Position above cursor
    }

    // Ensure tooltip doesn't go above the viewport
    if (top < 10) {
        top = 10;
    }

    tooltipPosition.value = {
        top: top,
        left: left,
        width: tooltipWidth
    };

    tooltipVisible.value = true;
}


function hideTooltip() {
  tooltipVisible.value = false;
}

// Show context menu on right-click
function showContextMenu(event, record) {
  // Only show context menu if actor is not N/A
  if (!record.actor || record.actor === 'N/A') {
    return;
  }
  
  event.preventDefault();
  selectedRecord.value = record;
  contextMenuPosition.value = {
    top: event.clientY,
    left: event.clientX
  };
  contextMenuVisible.value = true;
}

// Close context menu
function closeContextMenu() {
  contextMenuVisible.value = false;
  selectedRecord.value = null;
}

// Create/update Backpack2 record
async function createBackpack2Record(exceptionValue = 2) {
  if (!selectedRecord.value || !selectedRecord.value.actor) {
    return;
  }

  try {
    const response = await fetch('/api/pb/backpack2-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actor: selectedRecord.value.actor,
        exceptionValue: exceptionValue
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create/update Backpack2 record');
    }

    const result = await response.json();
    console.log('Backpack2 operation result:', result);
    
    // Show success feedback
    alert(`${result.message} with exception value: ${exceptionValue}`);
  } catch (err) {
    console.error('Error creating Backpack2 record:', err);
    error.value = err.message || 'Failed to create/update Backpack2 record';
  } finally {
    closeContextMenu();
  }
}

onMounted(async () => {
  await fetchProjectHistory();
  
  // Close context menu when clicking outside
  document.addEventListener('click', (e) => {
    if (contextMenuVisible.value && !e.target.closest('.context-menu')) {
      closeContextMenu();
    }
  });
});
</script>

<template>
  <div class="p-6 space-y-8 pt-24 min-h-screen bg-gray-50">
    <div class="container mx-auto">
      <h1 class="text-3xl font-bold mb-6">Historique du projet</h1>

      <div v-if="isLoading" class="text-center"></div>

      <div v-else-if="error" class="alert alert-error shadow-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>

      <div v-else-if="sortedProjectHistory && sortedProjectHistory.historyByBackpack">
        <div v-for="(historyRecords, backpackId) in sortedProjectHistory.historyByBackpack" :key="backpackId" class="mb-8">
          <div class="mb-4 flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-semibold mb-1">
                <span v-if="sortedProjectHistory.backpackRecords[backpackId]">
                  {{ sortedProjectHistory.backpackRecords[backpackId].name }}
                </span>
              </h2>
              <p class="text-sm text-gray-500">Backpack ID: {{ backpackId }}</p>
            </div>
            <button 
              class="btn btn-primary btn-sm"
              @click="downloadUserPdf(backpackId, historyRecords[0]?.actor)"
              :disabled="isLoading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>

          <div class="overflow-x-auto rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
            <table class="table w-full bg-white">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Date</th>
                  <th>Activité</th>
                  <th>Réponse</th>
                  <th>Acteur</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in historyRecords"
                  :key="record.id"
                  class="cursor-pointer border-b border-gray-200 bg-white hover:bg-gray-100"
                  @mouseover="showTooltip($event, record.answer, $event.currentTarget.closest('.table'))"
                  @mouseleave="hideTooltip"
                  @contextmenu="showContextMenu($event, record)"
                >
                  <td class="text-center">
                    <span class="txt-md">{{ record.index || 0 }}</span>
                  </td>
                  <td>{{ formatDate(record.updated) }}</td>
                  <td>{{ record.activityTitle }}</td>
                  <td>
                    <span class="truncate max-w-[200px] block transparent">
                      {{ trimAnswer(record.answer) }}
                    </span>
                  </td>
                  <td>
                    <span class="txt-md">{{ extractActorName(record.actor) }}</span>
                  </td>
                  <td>
                    <span class="txt-md">{{ record.registration || 'N/A' }}</span>
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

      <!-- Enhanced Tooltip -->
      <div 
        v-if="tooltipVisible"
        class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[60vh] overflow-hidden tooltip-container"  
        :style="{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: `${tooltipPosition.width}px`,
            position: 'fixed'
        }"
        @mouseenter="tooltipVisible = true"
        @mouseleave="hideTooltip"
        >
            <div class="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <h4 class="text-sm font-semibold text-gray-700">Contenu de la réponse</h4>
            </div>
            <div class="p-3 max-h-[50vh] overflow-y-auto">
              <div v-html="tooltipContent" class="ql-editor ql-snow text-sm leading-relaxed tooltip-content"></div>
            </div>
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

    <!-- Context Menu for Backpack2 -->
    <div 
      v-if="contextMenuVisible"
      class="context-menu fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden"
      :style="{
        top: `${contextMenuPosition.top}px`,
        left: `${contextMenuPosition.left}px`,
      }"
    >
      <div class="py-1">
        <div class="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
          Actor: {{ selectedRecord ? extractActorName(selectedRecord.actor) : '' }}
        </div>
        <button 
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
          @click="createBackpack2Record(2)"
        >
          Set Exception = 2
        </button>
        <button 
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
          @click="createBackpack2Record(0)"
        >
          Set Exception = 0
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-width: 100%;
}

.tooltip-container {
  animation: fadeIn 0.2s ease-in-out;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.context-menu {
  min-width: 200px;
  animation: fadeIn 0.15s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for tooltip */
.tooltip-container .overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.tooltip-container .overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tooltip-container .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.tooltip-container .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Ensure tooltip content is properly formatted */
.tooltip-container .ql-editor {
  font-size: 0.875rem;
  line-height: 1.5;
}

.tooltip-container .ql-editor p {
  margin-bottom: 0.5rem;
}

.tooltip-container .ql-editor p:last-child {
  margin-bottom: 0;
}

/* Fix Quill editor list styling in tooltip - Aggressive approach */
.tooltip-content ol {
  padding-left: 0 !important;
  margin-bottom: 0.5rem !important;
}

.tooltip-content ol li {
  margin-bottom: 0.25rem !important;
  position: relative !important;
  padding-left: 2rem !important;
}

.tooltip-content ol li:last-child {
  margin-bottom: 0 !important;
}


.tooltip-content ol li[data-list="bullet"]::before {
  content: "•" !important;
  position: absolute !important;
  left: 0 !important;
  color: #6b7280 !important;
  font-size: 0.75rem !important;
}


.tooltip-content ol li[data-list="ordered"]::before {
  content: counter(list-counter) "." !important;
  position: absolute !important;
  left: 0 !important;
  color: #6b7280 !important;
  font-size: 0.75rem !important;
  counter-increment: list-counter !important;
}

/* Handle Quill indent classes with !important */
.tooltip-content ol li.ql-indent-1 {
  padding-left: 3.5rem !important;
}

.tooltip-content ol li.ql-indent-1::before {
  left: 1.5rem !important;
}

.tooltip-content ol li.ql-indent-2 {
  padding-left: 5rem !important;
}

.tooltip-content ol li.ql-indent-2::before {
  left: 3rem !important;
}

.tooltip-content ol li.ql-indent-3 {
  padding-left: 6.5rem !important;
}

.tooltip-content ol li.ql-indent-3::before {
  left: 4.5rem !important;
}

/* Reset counter for each list */
.tooltip-content ol {
  counter-reset: list-counter !important;
}

/* Handle Quill's ql-ui spans */
.tooltip-content .ql-ui {
  display: none !important;
}

/* Style raw HTML markup without Quill classes */
.tooltip-content p {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.tooltip-content ol {
  padding-left: 0;
  margin-bottom: 0.5rem;
  list-style: none;
}

.tooltip-content ol li {
  margin-bottom: 0.5rem;
  position: relative;
  padding-left: 2rem;
  list-style: none;
}

.tooltip-content ol li:last-child {
  margin-bottom: 0;
}

/* Style bullet lists */
.tooltip-content ol li[data-list="bullet"] {
  list-style: none;
}

.tooltip-content ol li[data-list="bullet"]::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #6b7280;
  font-size: 0.75rem;
}

/* Style numbered lists */
.tooltip-content ol li[data-list="ordered"] {
  list-style: none;
}

.tooltip-content ol li[data-list="ordered"]::before {
  content: counter(list-counter) ".";
  position: absolute;
  left: 0;
  color: #6b7280;
  font-size: 0.75rem;
  counter-increment: list-counter;
}

/* Reset counter for each list */
.tooltip-content ol {
  counter-reset: list-counter;
  padding-left: 10px !important;
}

/* Hide Quill UI elements */
.tooltip-content .ql-ui {
  display: none;
}

/* Handle indent classes */
.tooltip-content ol li.ql-indent-1 {
  padding-left: 3.5rem;
}

.tooltip-content ol li.ql-indent-1::before {
  left: 1.5rem;
}

.tooltip-content ol li.ql-indent-2 {
  padding-left: 5rem;
}

.tooltip-content ol li.ql-indent-2::before {
  left: 3rem;
}

.tooltip-content ol li.ql-indent-3 {
  padding-left: 6.5rem;
}

.tooltip-content ol li.ql-indent-3::before {
  left: 4.5rem;
}

/* Ensure proper spacing for nested lists */
.tooltip-content ol ol {
  margin-top: 0.25rem !important;
  margin-bottom: 0.25rem !important;
}

span .ql-ui::before {
    content: "•" !important;
    display: inline-block;
    font-size: 30px ;
    font-weight: 700;
    margin-left: -1.5em;
    margin-right: .3em;
    text-align: right;
    white-space: nowrap;
    width: 1.2em;
}


</style>