<script setup>
import { useProjects } from '~/stores/projects'; // Adjust import based on your structure
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { MdDeleteforeverRound, BiPersonCircle, IoCalendarOutline, CoCalendar } from "oh-vue-icons/icons";
import { computed } from "vue";

const projectStore = useProjects();
const router = useRouter();

// Register the icons
addIcons(MdDeleteforeverRound, BiPersonCircle, IoCalendarOutline, CoCalendar);

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

async function deleteProject() {
  emit('deleteProject', props.project.id);
}

function editProject() {
  router.push(`/editor/${props.project.id}`);
}

const projectName = computed(() => {
const maxLength = 20; // Define the max length for the truncated text
const text = props.project.profile.name || '';

return text.length > maxLength 
? text.substring(0, maxLength) + '...' 
: text;
});

const author = computed(() => { 
  return props.project?.expand?.author?.name || props.project?.author?.id ;
});

const description = computed(() => { 
try {
  return props.project.profile.description.slice(0, 30) + '...';
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
    <div class="card bg-base-100 rounded-md cursor-pointer shadow-md hover:shadow-xl transition-all duration-200">
      
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
        <h2 class="card-title text-lg font-semibold mb-1 leading-tight">
          {{ projectName }}
          
        </h2>
        <h3 class="text-sm  text-gray-300 font-semibold mb-1 flex gap-1">
          <OhVueIcon name="bi-person-circle" />
          <span>{{ author }}</span>
        </h3>
        <p class="text-sm  text-gray-300 font-semibold mb-4 flex gap-1">
          <OhVueIcon name="co-calendar" fill="blue" />
          <span>{{ createdAt }}</span> 
        </p>
        <p class="text-sm text-gray-500 mb-4">
          {{ description }}
        </p>
        <div class="card-actions mt-4 flex justify-between">
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

  }
  
  img {
    display: block;
  }

  </style>
  