<script setup>
import { useProjects } from '~/stores/projects'; // Adjust import based on your structure
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { MdWarningamberRound, MdCalendarmonthRound, MdVisibilityoff, HiStatusOnline, MdDeleteforeverRound, BiPersonCircle, IoCalendarOutline, CoCalendar } from "oh-vue-icons/icons";
import { isBefore, set, startOfDay } from "date-fns";
import { computed } from "vue";

const { status, data } = useAuth();
const config = useRuntimeConfig();

// Parse the tiers JSON string into an object
const tiers = JSON.parse(config.public.NUXT_PUBLIC_TIERS);

const projectStore = useProjects();
const router = useRouter();

// Register the icons
addIcons(MdDeleteforeverRound, BiPersonCircle, IoCalendarOutline, CoCalendar, MdVisibilityoff, HiStatusOnline, MdWarningamberRound, MdCalendarmonthRound);

const emit = defineEmits(['deleteProject']);

const props = defineProps({
title: {
  type: String,
  required: true,
},
project: {
  type: Object,
  required: true,
},
});

const answersLimit = computed(() => {

  const userPlan = data.value?.user?.plan;
  if (userPlan) {
    const plan = Object.values(tiers).find((tier) => tier.id === userPlan);
    return plan.answersLimit;
  }
  return 50; // Default limit
})

async function deleteProject() {
  emit('deleteProject', props.project.id);
}

function editProject() {
  router.push(`/editor/${props.project.id}`);
}

const projectName = computed(() => {
const maxLength = 30; // Define the max length for the truncated text
const text = props.project.profile.name || '';

return text.length > maxLength 
? text.substring(0, maxLength) + '...' 
: text;
});

const historyCount = computed(() => {
  const count = props.project.historyCount || 0;
  return count;
});

const isPublished = computed(() => {
  return props.project.profile.published;
})

const formattedExpirationDate = computed(() => {

  if (!props.project.profile.useExpirationDate) return 'N/A';

  const date = props.project.profile.expirationDate;
  return date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
})

const isDateExpired = computed(() => {

  if (!props.project.profile.useExpirationDate) return false;

  if (!props.project.profile.expirationDate) return false; // If no date is selected, it's not expired
  const today = startOfDay(new Date()); // Get today's date at the start of the day
  const selectedDate = new Date(props.project.profile.expirationDate);
  console.log(selectedDate, today);
  return isBefore(selectedDate, today); // Check if the selected date is before today
});

const author = computed(() => { 
  return props.project?.expand?.author?.name || props.project?.author?.id ;
});

const description = computed(() => { 
try {
  return props.project.profile.description.length > 0 ? props.project.profile.description.slice(0, 30) + '...' : '';
} catch (error) {
  return "lorem ipsum dolor sit amet...";
}
});

const createdAt = computed(() => {
const date = new Date(props.project.updated);
const options = { year: 'numeric', month: 'long', day: 'numeric' };
return date.toLocaleDateString('fr-FR', options);
});

</script>


<template>
    <div class="card bg-base-100 rounded-md cursor-pointer shadow-md hover:shadow-xl transition-all duration-200" :class="{ 'opacity-50 grayscale': isDateExpired }" >

      <!-- Small circle in top-left corner -->
      <div v-if="isDateExpired" class="absolute top-3 left-3 w-8 h-8 bg-white rounded-full z-20 shadow-lg flex justify-center items-center">
        <OhVueIcon name="md-visibilityoff" />
      </div>


      <figure class="overflow-hidden">

        <img 
          :src="project.profile.pdfCoverImgUrl" 
          class="absolute top-3 right-3 max-w-24 z-10 !shadow-md hover:scale-105 transition-all duration-200"
          alt="">

        <img
          :src="project.profile.pdfCoverImgUrl"
          alt="preview"
          class="w-full h-40 object-cover transparent"
        />
      <!-- Gradient Overlay -->
      <div 
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
      </div>
   
      </figure>
      <div class="card-body p-4 gap-0">
        <h2 class="card-title text-lg font-semibold mb-2 leading-tight">
          {{ projectName }}
        </h2>
        <!-- <div class="text-sm  text-gray-300 leading-3 font-semibold flex gap-1 items-center">
          <OhVueIcon name="bi-person-circle" />
          <span>{{ author }}</span>
        </div> -->

        <div class="text-sm  text-gray-300 leading-3 font-semibold flex gap-1 items-center mb-1">
          <OhVueIcon :name="isPublished ?'hi-status-online' : 'md-warningamber-round'" :class="isPublished ? 'text-primary' : 'text-gray-300 mb-0.5'"
          />
          <span :class="isPublished ? 'text-primary' : 'text-gray-300'">{{ isPublished ? "Publié" : "Brouillon"  }}</span>
        </div>

        <div class="text-sm  text-gray-300 font-semibold mb-4 flex gap-1">
          <OhVueIcon name="md-calendarmonth-round" />
          <!-- <span>{{ createdAt }}</span>  -->
          <span>{{ formattedExpirationDate }}</span> 

        </div>
        <!-- <p class="text-sm text-gray-500 mb-4">
          {{ description }}
        </p> -->
        
        <!-- Progress Bar -->
        <div class="tooltip [--tooltip-color:#fff] tooltip-bottom" :data-tip="answersLimit - historyCount + ' réponses restantes'">

          <div class="flex justify-center items-center">
            <div class="w-full bg-gray-200 rounded-full h-1.5 mr-3 dark:bg-gray-700">
              <div class="bg-green-500 h-1.5 rounded-full max-w-full dark:bg-green-500" :style="{ width: (historyCount / answersLimit)*100 + '%' }"></div>
            </div>
            <p class="text-xs scale-x-95 tracking-tighter">{{ historyCount }}/{{ answersLimit }}</p>
          </div>

        </div>


        <div class="card-actions flex justify-between mt-auto">
          <button @click.stop="editProject" class="btn bg-primary rounded-md text-white">Modifier</button>
          <button @click.stop="deleteProject" class="btn bg-white rounded-md">
            <OhVueIcon name="md-deleteforever-round" />
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>

  figure {
    margin: 0;
    padding: 0;
    position: relative;
    height: 120px;
    min-height: 100px;

  }
  
  img {
    display: block;
  }

  .tooltip::before {
    @apply drop-shadow-lg;
    border: 1px solid #e4e4e4;
    /* box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3); */

  }

  </style>
  