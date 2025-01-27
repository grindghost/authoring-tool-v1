<template>
      <div
        class="overlay-content fadeInScale"
      >
      <div class="profile">
        <OhVueIcon name="fa-book" />
        <span>
          {{ projectId }}
        </span>


      </div>
        <fa icon="fa-circle-check" class="fa-beat overlay-icon" />
        <div style="padding: 0px 130px 0px 130px; color: white">
          <h1 v-html="header"></h1>
          <p v-html="body"></p>
        </div>
        <div>
          <button id="btn-correct-answer" @click="handleClick">
            {{ button }}
          </button>
        </div>
      </div>
  </template>

<script setup>
    import { OhVueIcon, addIcons } from "oh-vue-icons";
    import { FaBook } from "oh-vue-icons/icons";
    import { useAppStateStore } from '/stores/appState';
    
    addIcons(FaBook);
    
    const appStore = useAppStateStore();

    // Get the text from the unit profile locales
    const locale = computed (() => {
      return appStore.unitProfile.locale.completedView;
    });

    const { header, body, button } = locale.value;

    const projectId = computed(() => {
      return appStore.unitProfile.project.id
    })

    const handleClick = () => {
      appStore.hideOverlay();
    };

</script>

<style scoped>

  .overlay-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.8rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.12;
    text-align: center; 
    margin-bottom: 20px; 
    white-space: pre;
    font-family: var(--theme-font) !important;
  }

  p {
    font-size: 1.3rem; 
    font-weight: 300; 
    line-height: 140%; 
    white-space: pre;
    text-align: center;
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
      padding: 12px 20px 10px 20px;
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

  .overlay-icon {
    color: #fff;
    font-size: 50px;
  }

  .profile {
    color: #fff;
    font-size: 0.8rem;
    font-weight: 300;

    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: absolute;
    top: 10px;
    right: 20px;
  }

  .fadeInScale { 
    opacity: 0;
    animation: fadeInScaleAnimation 0.5s forwards;
    /* animation-delay: 4s; */
  }

  .fadeOutScale {
    opacity: 0;
    animation: fadeOutScaleAnimation 0.5s forwards;
    /* animation-delay: 1s; */
  }

  @keyframes fadeInScaleAnimation {
    0% {
      opacity: 0;
      transform: scale(0.5);
    } 

    100% {
      opacity: 1;
      transform: scale(1);
    } 

  }

  @keyframes fadeOutScaleAnimation {
    0% {
      opacity: 1;
      transform: scale(1);
    } 

    100% {
      opacity: 0;
      transform: scale(0.5);

    } 

  }

</style>