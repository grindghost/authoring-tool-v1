<template>
    <div v-if="isClient" class="quill-container">
      <div ref="editorContainer" class="ql-container ql-snow"></div>
    </div>
  </template>
  
  <script setup>

  // Version 1.0.0
  
  import { useAppStateStore } from '/stores/appState';
  const store = useAppStateStore();
  import 'quill/dist/quill.snow.css';
  
  const isClient = ref(false); // Client-side detection
  let quill;
  let lastValidContent = ''; // Store the last valid content
  
  const props = defineProps({
    content: String,
    placeholder: String,
  });

  const computedPlaceholder = computed(() => props.placeholder ?? '');

  const emit = defineEmits(['update:content']);
  
  const editorContainer = ref(null);
  
  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
  ];
  
  onMounted(async () => {

    isClient.value = true;
  
    if (isClient.value) {

      try {   
        const Quill = (await import('quill')).default;

        // Fix: add some delay to allow the placeholder to hydrate
        // setTimeout(() => {
        
          quill = new Quill(editorContainer.value, {
            theme: 'snow',
            placeholder: computedPlaceholder.value,
            modules: {
              toolbar: toolbarOptions,
            },
          });
        
        

        setTimeout(() => {
          setQuillPlaceholderText(computedPlaceholder.value); 
        }, 1000);

        if (props.content) {
          const delta = quill.clipboard.convert(props.content);
          quill.setContents(delta, 'silent');
          lastValidContent = quill.root.innerHTML; // Set initial valid content
        }

        // Add a custom matcher for text nodes when pasting text
        quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
          const plainText = quill.getText(); // Get current plain text
          const currentLength = plainText.trim().length; // Count existing characters
          const maxAllowed = store.unitProfile.activity.maxCharactersAllowed;

          if (store.unitProfile.activity.useCharactersLimit) {
            const pastedText = delta.ops.map(op => op.insert).join(''); // Extract pasted text
            const allowedLength = maxAllowed - currentLength - 2;
            console.log('Allowed length:', allowedLength);

            if (allowedLength <= 0) {
              return null; // Block the paste completely if already at the limit
            }

            if (pastedText.length > allowedLength) {
              const trimmedText = pastedText.substring(0, allowedLength); // Trim excess characters
              return { ops: [{ insert: trimmedText }] }; // Replace the delta with the trimmed text
            }
          }
          return delta; // Allow paste as-is if below the limit
        });
    
        quill.on('text-change', () => {
          const plainText = quill.getText(); // Get plain text content
          const currentLength = plainText.trim().length; // Trim to remove trailing newline characters

          if (store.unitProfile?.activity?.useCharactersLimit && currentLength > store.unitProfile?.activity?.maxCharactersAllowed) {
            // Revert to the last valid state
            quill.root.innerHTML = lastValidContent;
            quill.setSelection(store.unitProfile.activity.maxCharactersAllowed); // Adjust selection to the limit
          } else {
            lastValidContent = quill.root.innerHTML; // Update the last valid state
            emit('update:content', quill.root.innerHTML);
          }
        });

    
        setTimeout(() => {

          applyHeaderStyles();

          // Logic to add a mask to the top of the editor, when overflo
          const container = document.querySelector(".ql-container");
          const editorZone = document.querySelector(".ql-editor");

          const updateMask = () => {
            if (editorZone.scrollTop > 0) {
              container.style.webkitMaskImage = "linear-gradient(to top, black 20%, transparent 100%)";
              container.style.maskImage = "linear-gradient(to top, black 20%, transparent 100%)";
            } else {
              container.style.webkitMaskImage = "none";
              container.style.maskImage = "none";
            }
          };
          
          if (editorZone) {
            editorZone.addEventListener("scroll", updateMask);
            updateMask(); // Initialize on mount
          }

        }, 1500);

        //}, 1000)
      } catch (error) {
        // console.log('Error loading the editor:', error);
      }
    }
    
  });
  
  watch(() => props.content, (newContent) => {    
    if (quill && newContent !== quill.root.innerHTML) {      
      // quill.root.innerHTML = newContent; // Set the raw HTML directly
      quill.clipboard.dangerouslyPasteHTML(newContent);
      lastValidContent = newContent; // Update the last valid state
    }
  });

  // Watch for placeholder changes
  watch(() => props.placeholder, (newPlaceholder) => {
    setQuillPlaceholderText(newPlaceholder); // Apply CSS fix
  });
  
  onBeforeUnmount(() => {
    if (quill) {
      quill = null;
    }
  });
  
// Function to set the placeholder text dynamically
function setQuillPlaceholderText(placeholderText) {
  // Create a <style> element
  const style = document.createElement('style');
  style.type = 'text/css';

  // Define the CSS rule for the placeholder
  style.innerHTML = `
    .ql-editor.ql-blank::before {
      content: "${placeholderText}" !important;
    }
  `;

  // Append the <style> element to the document's <head>
  document.head.appendChild(style);
}

  watch(() => store.unitProfile?.locale, () => {
    applyHeaderStyles();
  });

  // Get the text from the unit profile locales
  const locale = computed (() => {
      return store.unitProfile?.locale?.editorView;
  });

  const h1 = computed(() => locale.value?.toolbar?.h1 || 'H1');
  const h2 = computed(() => locale.value?.toolbar?.h2 || 'H2');
  const h3 = computed(() => locale.value?.toolbar?.h3 || 'H3');
  const normal = computed(() => locale.value?.toolbar?.normal || 'Normal');

  // Function to apply localized header styles
  function applyHeaderStyles() {

    // const h1 = locale.value.toolbar?.h1 || 'H1';
    // const h2 = locale.value.toolbar?.h2 || 'H2';
    // const h3 = locale.value.toolbar?.h3 || 'H3';
    // const normal = locale.value.toolbar?.normal || 'Normal';
  
    const style = document.createElement('style');
    style.innerHTML = `
      .ql-snow .ql-picker-options .ql-picker-item[data-value="1"]::before {
        content: '${h1.value}' !important;
      }
      .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before {
        content: '${h1.value}' !important;
      }
      .ql-snow .ql-picker-options .ql-picker-item[data-value="2"]::before {
        content: '${h2.value}' !important;
      }
      .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before {
        content: '${h2.value}' !important;
      }
      .ql-snow .ql-picker-options .ql-picker-item[data-value="3"]::before {
        content: '${h3.value}' !important;
      }
      .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before {
        content: '${h3.value}' !important;
      }
      .ql-snow .ql-picker-options .ql-picker-item:not([data-value])::before {
        content: '${normal.value}' !important;
      }
      .ql-snow .ql-picker.ql-header .ql-picker-label:not([data-value])::before {
        content: '${normal.value}' !important;
      }
      /* Re-apply the font to the editor content */
      .ql-editor * {
          font-family: var(--theme-font) !important;
      }
    `;
    document.head.appendChild(style);
  }
  </script>

<style scoped>
  .ql-container {
    /* height: calc(100% - 42px); */
    height: auto;
    height: 100%;
    padding-top: 12px;
    overflow-y: scroll;
    /* Add a fading effect toward the bottom */
    -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  }
  

  .quill-container {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 10px;
    margin-bottom: 18px;
    overflow: hidden;
  }

  .ql-toolbar.ql-snow {
      border-top: 0px solid #ccc !important;
      border-right: 0px solid #ccc !important;
      border-left: 0px solid #ccc !important;
      border-bottom: 1px solid #ccc !important;
      padding-bottom: 16px !important;
  }
  .ql-editor {
      font-size: larger;
      font-weight: 300;
      overflow-y: scroll;
      font-family: var(--theme-font) !important;
  }

  /* Quill editor code block overrides */
  .ql-snow .ql-editor .ql-code-block-container {
    background-color: #f4f6f8 !important;
    color: black !important;
    overflow: visible;
  }

  </style>
  