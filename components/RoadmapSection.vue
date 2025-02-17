<template>
    <section class="py-12 px-6 lg:py-16 lg:px-12 relative bg-slate-200 bg-opacity-25">
      <div class="max-w-7xl mx-auto">
        <!-- Title -->
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">Roadmap & Fonctionnalités</h2>
  
        <!-- Features Grid -->
        <ul
          class="grid gap-0 sm:gap-4 max-w-5xl m-auto sm:grid-cols-2 lg:grid-cols-3"
        >
        <li
          v-for="(feature, index) in roadmapFeatures"
           :key="index"
            class="flex items-center gap-4 bg-base-100 p-4 border-b-2 border-gray sm:border-none sm:rounded-lg shadow-md cursor-default 
         first:rounded-t-lg last:rounded-b-lg last:border-none 
         hover:border-none hover:rounded-lg hover:scale-105 hover:shadow-[0px_3px_16px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out"
>
            <!-- Checkmark -->
            <div
              class="flex items-center justify-center w-8 h-8 rounded-full border-2"
              :class="feature.done ? 'border-primary bg-primary text-white' : 'border-base-content/30'"
            >
              <span v-if="feature.done">
                <OhVueIcon name="bi-check" class="h-8 w-8 pt-1" />
              </span>
            </div>
  
            <!-- Feature Description -->
            <div class="flex-1">
                <p
                    class="text-base md:text-md leading-tight"
                    :class="feature.done ? 'text-primary' : 'text-base-content/50'"
                    style="line-height: 1.25 !important;"

                >
                    {{ feature.description }}
                </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </template>
  
  <script setup>
  import { OhVueIcon, addIcons } from "oh-vue-icons";
  import { BiCheck } from "oh-vue-icons/icons";
  
  // Register the icons
  addIcons(BiCheck);
  
  const roadmapFeatures = [
    { description: "Intégrer un tableau de bord intuitif", done: true },
    { description: "Améliorer les options de personnalisation", done: false },
    { description: "Support pour plus de langues", done: false },
    { description: "Ajout d’une API pour les intégrations tierces", done: false },
    { description: "Optimisation des performances globales", done: true },
    { description: "Ajout d'outils analytiques", done: false },
    { description: "Support hors ligne", done: false },
    { description: "Notifications personnalisées", done: true },
  ];
  </script>
  
  <style scoped>
  /* Add a little margin between grid items for a clean look */
  </style>
  