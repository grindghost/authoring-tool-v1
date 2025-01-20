<script setup>

    // Disable layout
    definePageMeta({
      layout: false,
    });

    defineProps({
      profile: {
        type: Object,
        required: false,
      },
      profileProvided: {
        type: Boolean,
        required: true,
      },
    });


  onMounted(async () => {

    initializeScaler();

     });
</script>


<template>
  
  <!-- Main container -->
  <div
      class="wrapper"
      :class="`theme-${computedTheme}`"
  > 
      <!-- Overlays container-->

      <!-- Activity container -->
      <div
        class="acitivity-container">
        
        <!-- Quill editor -->
        <QuillEditor contentType="html" placeholder="hey" />
        
        <!-- Footer -->
        <div class="footer noselect">

          <div class="maxchar">
            
            <span id="count">
              <strong>{{ answerLength }}</strong>
              {{ store.useCharactersLimit == true ? "" : store.localeDict?.editorView?.charCount || "" }}
            </span>
            
            {{
              store.useCharactersLimit == true
                ? " / " + store.maxCharAllowed + " " + (store.localeDict?.editorView?.charCount || "") + " " + (store.localeDict?.editorView?.allowedChar || "")
                : ""
            }}
          </div>

          <div class="options-container">
            <span class="options" @click="store.RestoreDefaultText">
              {{ store.localeDict?.editorView?.restoreDefaultText || "" }}
            </span>
          </div>

          <!-- Submit button -->
          <button 
              @click="store.SaveAnswer" 
              :disabled="isAnswerEmpty || store.endpoint || store.completedOverlay || store.answer === store.defaultText"
          >
              {{ store.mode === "edition" 
                  ? store.localeDict?.editorView?.buttons?.correct || "..." 
                  : store.localeDict?.editorView?.buttons?.submit || "..." 
              }}
          </button>
        </div>
      </div>

    </div>

  </template>
  
  
  <style scoped>
  /* ... */
  .fade-enter-active {
    opacity: 0;
    animation: fadeIn 0.5s forwards;
    /* animation-delay: 1s; */
  }

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  } 

  100% {
    opacity: 1;
    transform: scale(1);
  } 

}
  </style>
  