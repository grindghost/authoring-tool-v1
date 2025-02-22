<template>
    <section class="relative">
      <div class="py-8 lg:py-8 mx-auto max-w-screen-xl px-12 sm:px-16">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
          Notre boîte à outils
        </h2>
        
        <!-- Reduced max-width and gap sizes -->
        <div class="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-6 max-w-2xl mx-auto">
          <a
            v-for="tool in tools"
            :key="tool.name"
            :href="tool.link"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex flex-col items-center gap-2 p-2 transition-all duration-300 hover:-translate-y-1"
          >
            <div class="relative h-14 w-14 md:h-16 md:w-16 rounded-lg">
              <img
                :src="tool.logo"
                :alt="`${tool.name} logo`"
                class="h-full w-full object-contain transition-all duration-500 filter grayscale group-hover:grayscale-0"
              />
            </div>
            <div class="text-center">
              <h3 class="font-medium text-sm">{{ tool.name }}</h3>
              <p class="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {{ tool.description }}
              </p>
            </div>
          </a>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const tools = ref([
    {
      name: 'Nuxt.js',
      logo: '/logos/nuxt.svg',
      link: 'https://nuxt.com',
      description: 'The Intuitive Vue Framework'
    },
    {
      name: 'Tailwind CSS',
      logo: '/logos/tailwind.png',
      link: 'https://tailwindcss.com',
      description: 'A utility-first CSS framework'
    },
    {
      name: 'Auth.js',
      logo: '/logos/authjs.png',
      link: 'https://authjs.dev/',
      description: 'Authentication for the Web'
    },
    {
      name: 'PocketBase',
      logo: '/logos/pocketbase.png',
      link: 'https://pocketbase.io',
      description: 'Open Source backend in 1 file'
    },
    {
      name: 'PDFLib',
      logo: '/logos/pdflib.svg',
      link: 'https://pdflib.com',
      description: 'PDF generation and manipulation'
    },
    {
      name: 'Vercel',
      logo: '/logos/vercel.png',
      link: 'https://vercel.com/',
      description: 'Cloud to deploy web applications'
    }
  ])
  </script>
  
  <style scoped>
  .group:hover img {
    transform: scale(1.1);
  }
  </style>