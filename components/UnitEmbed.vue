<script setup>
    
    import { useAppStateStore } from '/stores/appState';

    const store = useAppStateStore();

    const props = defineProps({
        profile: {
            type: Object,
            required: true,
        },
    });
    
    // Watch for changes in the profile, reassign the value to the store
    watch(() => props.profile, (newValue) => {
      if (newValue) {
        Object.assign(props.profile, newValue);
      }
    }, { deep: true });

    const isAnswerEmpty = ref(true);
    const answerLength = ref(0);

    const stripHtml = (html) => {
      if (process.client) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
      }
      return ''; // Return empty string during SSR
    };


    const checkIfEmpty = (html) => {
      const textContent = stripHtml(html).trim();
      answerLength.value = textContent.length;
      return textContent.length === 0;
    };

  const computedTheme = computed(() => {

    const useCustomTheme = props.profile?.project?.profile?.useCustomTheme;
    const customTheme = props.profile?.project?.profile?.customTheme;
    const theme = props.profile?.project?.profile?.theme;

    if (!useCustomTheme) {

      // In the case the project doesn't exist, 
      // or the app is in global maintenance mode...
      if (!theme) {
        return "brio";
      }

      if (theme === "brio" || theme === "ul-yellow" || theme === "ul-red") {
        return theme;
      }
    } else {
      if (process.client) {
        applyCustomTheme(customTheme);
      }
      return "custom";
  }
});

const applyCustomTheme = (customTheme) => {
  if (process.client) {
    
    const styleContent = `
      .theme-custom {
        --color-theme: ${customTheme};
        --color-theme-light: ${customTheme};
        --color-theme-white: #fff;
        --color-theme-accent: ${customTheme};
        --color-theme-button: ${customTheme};
        --color-theme-button-hover: ${customTheme};
        --color-theme-button-disabled: #d1d7d8;
        --color-theme-textarea-bg: #F8F9FA;
        --color-theme-container-gradient: linear-gradient(0deg, rgba(228, 233, 234, 1) 65%, rgba(255,255,255,1) 100%);
        --color-theme-overlays-gradient: linear-gradient(0deg, rgba(41, 40, 40, 0.85) 0%, rgba(0, 0, 0, 0.7) 70%, rgba(1, 1, 1, 0.59) 100%);
        --theme-font: 'Overpass', sans-serif;
      }
    `;

    let styleElement = document.getElementById("custom-theme-style");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "custom-theme-style";
      document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = styleContent;
  }
};


  // ****************************************

  // Get the placeholder value
  const placeholder = computed(() => {

    if (store.unitProfile?.activity?.useCustomPlaceholder) {
      return store.unitProfile?.activity?.customPlaceholder;
    } else {
      return store.unitProfile?.locale?.placeholder;
    }
  });

  // 

  const maximumChar = computed(() => {    
    if (store.unitProfile?.activity?.useCharactersLimit == true) {  
      return store.unitProfile?.activity?.maxCharactersAllowed
    } else {
        ""
    }
  });

  const charCountPhrase = computed(() => {
    if (store.unitProfile?.activity?.useCharactersLimit == true) {
      return (store.unitProfile?.locale?.editorView?.charCount || "") + " " + (store.unitProfile?.locale?.editorView?.
      allowedChar || "");
    }  else {
        return (store.unitProfile?.locale?.editorView?.charCount || "");
    }
  });

  // 

  const charCount = computed(() => {    
    if (store.unitProfile?.activity?.useCharactersLimit == true) {  
        return "";
    } else {
        store.unitProfile?.locale?.editorview?.charCount;
    }
  });

  const allowedChar = computed(() => {
    if (store.unitProfile?.activity?.useCharactersLimit == true) {
      return " / " + store.unitProfile?.activity?.maxCharactersAllowed  + " " + (store.unitProfile?.locale?.editorView?.charCount || "") + " " + (store.unitProfile?.locale?.editorView?.
      allowedChar || "");
    }  else {
        return "";
    }
});

const editorContent = computed(() => {
    return store.editorContent;
})

// Watch the `answer` ref from the store and update `isAnswerEmpty`
watch(() => store.editorContent, (newAnswer) => {
    isAnswerEmpty.value = checkIfEmpty(newAnswer);
});



const handleSubmit = () => {
    store.submitEditor();
}

const handleRestoreDefaultText = () => {
    store.RestoreDefaultText();
}


</script>

<template>
    <!-- Main container -->
    <div class="wrapper" :class="`theme-${computedTheme}`">  

      <!-- Overlays container-->
      <transition name="fade">
      <div class="overlays-container noselect" v-if="store.overlayVisible" >  
          <UnitOverlayMessage v-if="store.currentOverlay === 'message'" />
          <UnitOverlayLoading v-else-if="store.currentOverlay === 'loading'" />
          <UnitOverlayMaintenance v-else-if="store.currentOverlay === 'maintenance'" />
          <UnitOverlayCompleted v-else-if="store.currentOverlay === 'completed'" />
          <UnitOverlayEndpoint v-else-if="store.currentOverlay === 'isEndpoint'" />
      </div>
      </transition>
    
      <!-- Editor container -->
      <div class="acitivity-container" :class="store.overlayVisible ? 'transparent' : ''">

        <!-- Quill editor -->
        <UnitQuillEditor v-model:content="store.editorContent" contentType="html" :placeholder="placeholder" />

        <!-- Footer -->
        <div class="footer noselect">

            <div class="maxchar">

              <span class="count">
                  <strong>{{ answerLength }}</strong>
              </span>
              <span v-if="store.unitProfile?.activity?.useCharactersLimit">
                /
              </span>
              <span>
                {{ maximumChar }}
              </span>
              <span :class="store.unitProfile?.activity?.useCharactersLimit ? 'allowedChar' : ''"> 
                {{ charCountPhrase }} 
              </span>

            <!-- <span class="count">
                <strong>{{ answerLength }}</strong>
                {{ charCount }}
            </span>
            
            {{ allowedChar }} -->
            </div>

            <div class="options-container">
                <span class="options" @click="handleRestoreDefaultText">
                {{ store.unitProfile?.locale?.editorView?.restoreDefaultText || "" }}
                </span>
            </div>

            <!-- Submit button -->
            <button 
                @click="handleSubmit" 
                :disabled="!store.enableEditor || isAnswerEmpty"
            >
                {{ store.mode === "edition" 
                    ? store.unitProfile?.locale?.editorView?.buttons?.correct || "..." 
                    : store.unitProfile?.locale?.editorView?.buttons?.submit || "..." 
                }}
            </button>
        </div>

    </div>

    </div>
  
</template>
    
 
<style scoped>
.wrapper {
    border-radius: 8px;
    box-shadow: 0 0 2px 1px rgba(0,0,0,.17);
    background-color: white;
    width: 796px;
    height: 444px;
    max-width: 796px;
    max-height: 444px;
    position: relative;
    overflow: hidden;
  }

  .acitivity-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .overlays-container {
    width: 100%;
    height: 100%;
    z-index: 3000;
    position: absolute;
    top: 0;
    left: 0;
    visibility: visible;
    background: var(--color-theme-overlays-gradient);   
  }

  .footer {
      width: 100%;
      height: 150px;
      padding: 0 30px;
      background-color: #f4f6f8;
      display: flex;
      margin-top: auto;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
  }

  .options-container {
    display: flex;
    flex-grow: 1;
    justify-content: flex-end;
    align-items: center;
    padding-right: 1.2rem;
  }

  .footer .options {
    font-size: 0.8rem;
    color: #ccc;
    transition: ease-in-out 0.15s;
    font-family: var(--theme-font) !important;
  }

  .footer div .options:hover {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transform: scale(1.1);
    font-family: var(--theme-font) !important;
  }

  .count {
    font-family: var(--theme-font) !important;
  }

  .allowedChar {
    font-family: var(--theme-font) !important;
  }

  .maxchar {
    font-size: 14px;
    display: flex;
    gap: 0.15rem;
    flex-direction: row;
    font-family: var(--theme-font) !important;
  }

  button {
    -webkit-border-radius: 6;
    -moz-border-radius: 6;
    border-radius: 6px;
    border: none;
    font-family: var(--theme-font) !important;
    color: #ffffff;
    font-size: 1.5rem;
    text-align: center;
    background: var(--color-theme-button);
    background-color: var(--color-theme-button);
    padding: 16px 20px 16px 20px;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.15s linear, background-color 0.3s;
  } 

  button:hover {
      background: var(--color-theme-button-hover);
      background-color: var(--color-theme-button-hover);
      text-decoration: none;
      transform: scale(1.1);
      cursor: pointer;
  }


  button:disabled {
      background: var(--color-theme-button-disabled);
      cursor: not-allowed;
      text-decoration: none;
  }

  /* Define the fade transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }

</style>
    