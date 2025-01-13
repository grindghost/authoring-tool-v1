<template>
    <transition name="fade">
      <div v-if="show" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ projectStore.statusMessage }}...</p>
      </div>
    </transition>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  import { useProjects } from '~/stores/projects';

  const projectStore = useProjects();
  
  // Accept a `show` prop to control visibility
  defineProps({
    show: {
      type: Boolean,
      required: true,
    },
  });
  </script>
  
  <style scoped>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  p {
    margin-top: 1rem;
    color: white;
    font-size: 1.2rem;
    text-align: center;
  }
  </style>
  