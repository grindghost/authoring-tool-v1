<template>
  <div v-if="hasErrors" class="validation-summary bg-red-50 border border-red-200 rounded-md p-4 mb-4">
    <div class="flex items-center mb-2">
      <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <h3 class="text-red-800 font-semibold">Erreurs de validation ({{ totalErrors }})</h3>
    </div>
    
    <div class="space-y-2">
      <!-- Project level errors -->
      <div v-if="projectErrors.length > 0">
        <h4 class="text-red-700 font-medium text-sm">Paramètres du projet:</h4>
        <ul class="list-disc list-inside text-red-600 text-sm ml-2">
          <li v-for="error in projectErrors" :key="error.field" class="mb-1">
            <span class="font-medium">{{ getFieldLabel(error.field) }}:</span> {{ error.message }}
          </li>
        </ul>
      </div>
      
      <!-- Activity level errors -->
      <div v-if="activityErrors.length > 0">
        <h4 class="text-red-700 font-medium text-sm">Activités:</h4>
        <div v-for="activityError in activityErrors" :key="activityError.activityId" class="ml-2">
          <h5 class="text-red-600 font-medium text-sm">Activité {{ activityError.activityIndex }}:</h5>
          <ul class="list-disc list-inside text-red-600 text-sm ml-2">
            <li v-for="error in activityError.errors" :key="error.field" class="mb-1">
              <span class="font-medium">{{ getFieldLabel(error.field) }}:</span> {{ error.message }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useProjectModelStore } from '~/stores/projectModel';

const props = defineProps({
  validationErrors: {
    type: Object,
    default: () => ({})
  },
  sortedActivities: {
    type: Array,
    default: () => []
  }
});

const projectModelStore = useProjectModelStore();

const hasErrors = computed(() => {
  return Object.keys(props.validationErrors).length > 0;
});

const totalErrors = computed(() => {
  let count = 0;
  Object.keys(props.validationErrors).forEach(key => {
    if (key.startsWith('activity_')) {
      count += Object.keys(props.validationErrors[key]).length;
    } else {
      count += 1;
    }
  });
  return count;
});

const projectErrors = computed(() => {
  const errors = [];
  Object.keys(props.validationErrors).forEach(key => {
    if (!key.startsWith('activity_')) {
      errors.push({
        field: key,
        message: props.validationErrors[key]
      });
    }
  });
  return errors;
});

const activityErrors = computed(() => {
  const errors = [];
  Object.keys(props.validationErrors).forEach(key => {
    if (key.startsWith('activity_')) {
      const activityId = key.replace('activity_', '');
      const activityIndex = props.sortedActivities.findIndex(activity => activity.id === activityId) + 1;
      const activityErrors = props.validationErrors[key];
      
      const errorList = Object.keys(activityErrors).map(field => ({
        field,
        message: activityErrors[field]
      }));
      
      errors.push({
        activityId,
        activityIndex,
        errors: errorList
      });
    }
  });
  return errors;
});

function getFieldLabel(fieldName) {
  // Try to get label from project params
  if (projectModelStore.projectParams[fieldName]) {
    return projectModelStore.projectParams[fieldName].label;
  }
  
  // Try to get label from activity params
  if (projectModelStore.activitiesParams[fieldName]) {
    return projectModelStore.activitiesParams[fieldName].label;
  }
  
  // Fallback to field name
  return fieldName;
}
</script> 