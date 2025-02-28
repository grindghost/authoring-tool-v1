<!-- components/Footer.vue -->
<template>
    <footer class="bg-gray-900 text-gray-300 relative bottom-0" :class="projectStore.isLoading || projectStore.projectIsBeingCreated ? 'transparent' : ''">
      <div class="max-w-7xl mx-auto px-4 py-12 sm:px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Company Info -->
          <div class="space-y-4">
            <div class="flex items-center gap-1">
              <OhVueIcon name="fa-book" fill="white" />
              <h3 class="text-white text-lg font-semibold">Mon journal de bord</h3>
            </div>
            <div class="flex flex-col space-y-2 max-w-64">
              <span class="text-gray-400 text-[0.9rem]">Supporter l'apprentissage une réflexion à la fois.</span>
            </div>
            <a class="inline-block mt-4 text-sm border border-white/30 hover:border-white/70 hover:border-1 hover:text-base-content/90 duration-200 cursor-pointer rounded text-base-content/80 px-2 py-1" href="https://nuxt.com/" target="_blank">
              <div class="flex gap-1 items-center">
                <span class="text-white">Built with</span>
                <span class="font-bold text-white flex gap-0.5 items-center tracking-tight">
                  <img alt="ShipFast logo" fetchpriority="high" width="20" height="20" decoding="async" data-nimg="1" class="w-5 h-5" style="color:transparent" src="/logos/nuxt.svg">Nuxt
                </span>
              </div>
            </a>
          </div>
  
          <!-- Resources -->
          <div class="space-y-4">
            <h3 class="text-white text-lg font-semibold">Ressources</h3>
            <div class="flex flex-col space-y-2">
              <NuxtLink to="/login" class="hover:text-white transition-colors">Connexion</NuxtLink>
              <NuxtLink to="/#pricing" class="hover:text-white transition-colors">Tarifs et forfaits</NuxtLink>
              <NuxtLink to="/docs" class="hover:text-white transition-colors">Documentation</NuxtLink>
            </div>
          </div>
  
          <!-- Social Links -->
          <div class="space-y-4">
            <h3 class="text-white text-lg font-semibold">Légal</h3>
            <div class="flex flex-col space-y-2">
              <NuxtLink to="/tos" class="hover:text-white transition-colors">Conditions d'utilisation
              </NuxtLink>
              <NuxtLink to="/privacy-policy" class="hover:text-white transition-colors">Confidentialité</NuxtLink>
            </div>
          </div>
        </div>
  
        <!-- Copyright -->
        <div class="mt-12 pt-8 border-t border-gray-700">
          <p class="text-center text-sm">
            © {{ new Date().getFullYear() }} Mon journal de bord. Tous droits reservés.
          </p>
        </div>
      </div>
    </footer>
  </template>
  
  <script setup>
  // No additional setup needed for this component

  import { useProjects } from '/stores/projects';
  import { OhVueIcon, addIcons } from "oh-vue-icons";
  import { FaBook } from "oh-vue-icons/icons";

  addIcons(FaBook);

  const projectStore = useProjects();
  </script>