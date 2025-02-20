<template>
      <div class="overlay-content fadeInScale">
        
        <div class="profile" @click="handleClick">
          <OhVueIcon name="fa-book" />
          <span>
            Mon journal de bord
          </span>
        </div>

        <fa icon="fa-solid fa-laptop-code" class="fa-beat overlay-icon" @click="handleIconClick" />
        <div class="text-wrapper">
          <h1 v-html="header"></h1>
          <p v-html="body"></p>
        </div>
      </div>
  </template>

<script setup>
    import { OhVueIcon, addIcons } from "oh-vue-icons";
    import { FaBook } from "oh-vue-icons/icons";
    import { useAppStateStore } from '/stores/appState';
    const appStore = useAppStateStore();

    addIcons(FaBook);

    // Get the text from the unit profile locales
    const locale = computed (() => {
      return appStore.unitProfile.locale.maintenanceView;
    });

    // const { header, body } = locale.value;
    // Don't destructure the values from the computed property, it will break the reactivity
    const header = computed(() => {
      return locale.value.header;
    });

    const body = computed(() => {
      return locale.value.body;
    });


    const projectId = computed(() => {
      return appStore.unitProfile.project.id
    })

    const handleClick = () => {
      window.open('https://monjournaldebord.ca', '_blank');
    }

    const handleIconClick = () => {
      window.location.reload();
    }

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

  .text-wrapper {
    margin: 0 auto;
    max-width: 450px;
    /* width: 100%; */
  }

  @media only screen and (max-width: 600px) {
    .text-wrapper {
      margin: 0 2.2rem;
    }
  }

  .overlay-icon {
    color: #fff;
    font-size: 50px;
    cursor: pointer;
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.12;
    text-align: center; 
    margin-bottom: 20px; 
    /* white-space: pre; */
    font-family: var(--theme-font) !important;
    color: #fff;
  }

  p {
    font-size: 1.3rem; 
    font-weight: 300; 
    line-height: 140%; 
    /* white-space: pre; */
    text-align: center;
    font-family: var(--theme-font) !important; 
    color: #fff;
  }

  .profile {
    color: #fff;
    font-size: 0.8rem;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: absolute;
    top: 10px;
    right: 20px;
  }

  .overlay-icon {
    color: #fff;
    font-size: 50px;
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