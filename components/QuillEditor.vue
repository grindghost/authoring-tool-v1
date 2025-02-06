<template>
  <div class="wrapper">
    <div class="quill-editor" v-if="isClient">
      <div ref="editor" class="editor"></div>
    </div>
    <div class="editor-buttons">
      <button class="btn bg-primary rounded-md text-white" @click="save">Save</button>
      <button class="btn rounded-md" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onBeforeMount } from 'vue';
import 'quill/dist/quill.snow.css';

let Quill; // Declare Quill
const editor = ref(null);
const quill = ref(null);
const isClient = ref(false);

const props = defineProps({
  content: String, // Content from the parent component
});

const emit = defineEmits(['save', 'cancel']); // Emitting save and cancel events

const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['code-block']
  ];

function save() {
  const htmlContent = quill.value.root.innerHTML;
  emit('save', htmlContent); // Emit save event with content
}

onBeforeMount(() => {
  if (process.client) {
    isClient.value = true;
  }
});

onMounted(async () => {
  if (process.client) {
    // Dynamically import Quill
    const { default: ImportedQuill } = await import('quill');
    
    Quill = ImportedQuill;

    quill.value = new Quill(editor.value, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions,
      },
    });

    // Set initial content if provided by parent
    if (props.content) {
      quill.value.root.innerHTML = props.content;
    }
  }
});

// Watch for content updates from the parent
watch(
  () => props.content,
  (newValue) => {
    if (quill.value && newValue !== quill.value.root.innerHTML) {
      quill.value.root.innerHTML = newValue;
    }
  }
);
</script>
  
  <style scoped>


  .wrapper {
    height: auto;
  }

  .ql-container {
    height: auto;
    height: 100%;
    overflow-y: scroll;  
  }

  .quill-editor {
    position: relative;
    height: 100%;
    margin: 10px;
    margin-bottom: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #ccc; 
    border-radius: 6px;
    padding-bottom: 0.5rem;
    overflow-y: scroll;
    min-height: 500px;
    max-height: 500px;
  }
  
  .editor-buttons {
    margin-top:2rem;
    margin-bottom: 0.8rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  </style>
  