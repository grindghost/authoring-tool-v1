<script setup>
    
    import { useAppStateStore } from '/stores/appState';
    
    const store = useAppStateStore();

    const props = defineProps({
        profile: {
            type: Object,
            required: true,
        },
    });

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

    /*
    const computedTheme = computed(() => { 
        
        const useCustomTheme = store.unitProfile?.project?.profile?.useCustomTheme;
        const customTheme = store.unitProfile?.project?.profile?.customTheme;
        const theme = store.unitProfile?.project?.profile?.theme;

      if (useCustomTheme == false) {
        if (theme == "brio" || theme == "ul-yellow" || theme == "ul-red") {
          // return the actual theme
          return theme;  
        } 
      } else {
      // Return the default theme, with accent color
    // const root = document.documentElement;
        
    // root.style.setProperty("--color-theme", customTheme);
    // root.style.setProperty("--color-theme-light", customTheme);
    // root.style.setProperty("--color-theme-accent", customTheme);
    // root.style.setProperty("--color-theme-button", customTheme);
    // root.style.setProperty("--color-theme-button-hover", customTheme);  
    // return "default";

    applyCustomTheme(customTheme);
    return "custom"

    }
  });
    */
  // ****************************************;
    /*
  const applyCustomTheme = (customTheme) => {
  // Define the styles dynamically using the custom theme
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
    }
  `;

  // Create a new style element
  let styleElement = null;
    try {
      styleElement = document.getElementById("custom-theme-style");     
    } catch (error) {
      // ...
    }
  if (styleElement == null) {

    styleElement = document.createElement("style");
    styleElement.id = "custom-theme-style";
    document.head.appendChild(styleElement);
    // Set the style content
    styleElement.innerHTML = styleContent;
  }


};

*/

const computedTheme = computed(() => {
  // const useCustomTheme = store.unitProfile?.project?.profile?.useCustomTheme;
  const useCustomTheme = props.profile?.project?.profile?.useCustomTheme;
  // const customTheme = store.unitProfile?.project?.profile?.customTheme;
  const customTheme = props.profile?.project?.profile?.customTheme;
  // const theme = store.unitProfile?.project?.profile?.theme;
  const theme = props.profile?.project?.profile?.theme;

  console.log("useCustomTheme", useCustomTheme);
  console.log("customTheme", customTheme);
  console.log("theme", theme);

  if (!useCustomTheme) {
    if (theme === "brio" || theme === "ul-yellow" || theme === "ul-red") {
      return theme;
    }
  } else {
    if (process.client) {
      applyCustomTheme(customTheme);
    }
    console.log("custom theme");
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

// onMounted(() => {
//     import ("assets/css/unit.css");
// });

</script>

<template>
    <!-- Main container -->
    <div class="wrapper" :class="`theme-${computedTheme}`">  

        <!-- Overlays container-->
        <transition name="fade">
        <div class="overlays-container noselect" v-if="store.overlayVisible" >  
            <UnitOverlayLoading v-if="store.currentOverlay === 'loading'" />
            <UnitOverlayMaintenance v-else-if="store.currentOverlay === 'maintenance'" />
            <UnitOverlayCompleted v-else-if="store.currentOverlay === 'completed'" />
            <UnitOverlayEndpoint v-else-if="store.currentOverlay === 'isEndpoint'" />
        </div>
        </transition>
    
    <!-- Editor container -->
    <div class="acitivity-container" :class="store.overlayVisible ? 'transparent' : ''">

        <!-- Quill editor -->
        <UnitQuillEditor2 v-model:content="store.editorContent" contentType="html" :placeholder="placeholder" />

        <!-- Footer -->
        <div class="footer noselect">

            <div class="maxchar">
            
            <span id="count">
                <strong>{{ answerLength }}</strong>
                {{ charCount }}
            </span>
            
            {{ allowedChar }}
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

  /* Disable text selection */
  .noselect {
      -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
          -moz-user-select: none; /* Old versions of Firefox */
            -ms-user-select: none; /* Internet Explorer/Edge */
                user-select: none; /* Non-prefixed version, currently
                                      supported by Chrome, Edge, Opera and Firefox */
    }

  .transparent {
    -webkit-filter: blur(5px);
    -moz-filter: blur(5px);
    -o-filter: blur(5px);
    -ms-filter: blur(5px);
    filter: blur(4px);
    opacity: 1;
  }

  .footer {
      width: 100%;
      height: 150px;
      padding: 0 30px;
      background-color: #f4f6f8;
      display: flex;
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
  }

  .footer div .options:hover {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transform: scale(1.1);
  }

  .maxchar {
    font-size: 14px;
  }

  button {
    -webkit-border-radius: 6;
    -moz-border-radius: 6;
    border-radius: 6px;
    border: none;
    font-family: 'Overpass', 'sans-serif';
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
    