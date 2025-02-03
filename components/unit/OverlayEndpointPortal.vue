<template>
    <div class="overlay" @click="handleClick">
      <div :class="['overlay-content', { 'fade-in': coverLoaded }]">
        
        <div class="profile">
          <OhVueIcon name="fa-book" />
          <span>
            Mon journal de bord
          </span>
        </div>

        <!-- Left part with the text -->
        <div class="left">
          <!-- Top part with the text -->
          <div class="top">
            <h1 v-html="header"></h1>
            <p v-html="body"></p>
          </div>
          <!-- Bottom part with the text -->
          <div class="bottom">
            <p class="file-info">
              <span class="text-accent">{{ pdfFilename.length > 30 ? pdfFilename.slice(0, 30) + '... ' : pdfFilename }}.pdf</span>
              <br />
              <span class="file-size">~{{ pdfFileSize }}</span>
            </p>
            <button class="download-button">
              {{ button }}
            </button>
          </div>
        </div>

        <!-- Right part with the image cover -->
        <div class="image-container">
        <div :class="['cover-container', { 'fade-in': coverLoaded }]" ref="coverImageContainer">
          <img :src="pdfCoverImgUrl" :onload="setCoverLoaded" alt="" ref="coverImage" class="cover-image" />
        </div>
      </div>

      </div>
    </div>
  </template>
  
  <script setup>
  import { set } from 'date-fns';
  import { useAppStateStore } from '/stores/appState';
  import { useStatusStore } from '/stores/status';

  import { OhVueIcon, addIcons } from "oh-vue-icons";
  import { FaBook } from "oh-vue-icons/icons";
  addIcons(FaBook);
  
  const statusStore = useStatusStore();
  const appStore = useAppStateStore();
  
  const coverImage = ref(null);
  const coverImageContainer = ref(null);
  const coverLoaded = ref(false);
  const imgReady = ref(false);

    // Get the text from the unit profile locales
    const locale = computed (() => {
        return appStore.unitProfile.locale.endpointView;
    });

    const { header, body, button } = locale.value;

    // Get the pdf infos from the unt profile, in the project profile
    const { pdfCoverImgUrl, pdfFilename, pdfFileSize } = appStore.unitProfile.project.profile;

  const handleClick = () => {
      appStore.downloadFilledPdf();
  }
  
  function setCoverLoaded() {
    coverLoaded.value = true;
    
    adjustHandPositions();
    // store.statusMessage = statusStore.status[statusStore.locale].loadCover;
    appStore.statusMessage = statusStore.status[appStore.lang].loadCover;

  
    setTimeout(() => {
        appStore.isLoading = false;   
    }, 1000)
  }
  
  function adjustHandPositions() {
    
    if (coverImage.value) {
      
      setTimeout(() => {
        imgReady.value = true;   
      }, 500)


    }
  }
  </script>
  
  
  <style scoped>

  .overlay {
    cursor: pointer;
  }
  
  .overlay-content {
    width: 100%;
    height: 100%;
    padding: 3rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
    opacity: 0;
    cursor: pointer;
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

  .left {
    height: 100dvh;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 1.8rem;

  }
  
  .top {
    /*  */
  }
  
  .bottom {
    /*  */
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1.12;
    text-align: left; 
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
    text-align: left;
    font-family: var(--theme-font) !important; 
    color: #fff;
  }
  
  .file-info {
    line-height: 120%;
    margin-top: auto;
    font-weight: 500;
    font-family: var(--theme-font) !important;
  }
  
  .text-accent {
    /* Define your accent color if needed */
    font-family: var(--theme-font) !important;
    color: var(--color-theme-accent);
  }
  
  .file-size {
    font-size: 16px;
    font-family: var(--theme-font) !important;
  }
  
  .download-button {
    float: left;
    margin-top: 14px;
  }
  
  .image-container {
    /* width: 80%; */
    margin-right: 50px;
  }
  
  .cover-container {
    height: fit-content;
    width: fit-content;
    max-height: 455px;
    opacity: 0;
    background-color: rgb(255, 255, 255);
    box-shadow: 0px 0px 10px 11px rgba(0,0,0,.17);
    
  }
  
  .cover-image {
    min-width: 100px;
    max-height: 455px;
    /* opacity: 0; */
  
    -webkit-mask-image: linear-gradient(45deg,#000 25%,rgba(0,0,0,.2) 50%,#000 75%);
    mask-image: linear-gradient(45deg,#000 25%,rgba(0,0,0,.2) 50%,#000 75%);
    -webkit-mask-size: 800%;
    mask-size: 800%;
    -webkit-mask-position: 0;
    mask-position: 0;
  
  }

  @media only screen and (max-width: 700px) {
      .overlay-content {
        flex-direction: column-reverse;
        height: 100dvh;

    }

    h1 {
      font-size: 2.1rem;
      font-weight: 600;
      line-height: 1.12;
      text-align: center; 
      margin-bottom: 20px; 
      /* white-space: pre; */
      font-family: var(--theme-font) !important;
      color: #fff;
    }

    p {
      text-align: center;
    }

    .left {
      height: auto;
    }

    .top {
      width: 100%;
    }

    .bottom {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .image-container {
      margin-right: 0;
      max-width: 30%;
    }

    .cover-image {
      height: auto;
      min-height: 1px;
      min-width: 1px;
    }

    .download-button {
      width: 100%;
    }


  }

  
  .fade-in {
    animation: fadeIn 0.8s ease-in forwards; /* Adjust duration as desired */
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95); /* Optional: Adds a slight zoom-in effect */
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .cover-image:hover {
      transition: mask-position 1.5s ease,-webkit-mask-position 1.5s ease;
      -webkit-mask-position: 120%;
      mask-position: 120%;
      opacity: 1;
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
  
  </style>
  