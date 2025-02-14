<template>
    <section class="relative">
      <div class="py-8 lg:py-16 mx-auto max-w-screen-xl px-8">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-10">Nos amis</h2>
        <div class="grid grid-cols-3 gap-12 text-gray-500 sm:gap-12 max-w-[450px] m-auto mb-8">
          <a 
            v-for="(logo, index) in logos" 
            :key="index" 
            :href="logo.link" 
            class="flex justify-center items-center"
          >
            <img 
              :src="`/logos/${logo.filename}`" 
              :alt="logo.alt" 
              class="h-16 hover:scale-110 transition-transform duration-300"
            />
          </a>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  
  const logos = ref([]);
  
  onMounted(async () => {
    // Simule une liste des logos (en vrai, tu pourrais charger dynamiquement ces données depuis une API)
    logos.value = [
      { filename: "logo1.svg", alt: "Logo 1", link: "#" },
      { filename: "logo2.png", alt: "Logo 1", link: "#" },
      { filename: "logo3.svg", alt: "Logo 1", link: "#" },
    ];
  });
  </script>
  
  <style scoped>
img {
  max-width: 100%;
  height: auto;
  filter: grayscale(100%); /* Applique le filtre noir et blanc */
  transition: filter 0.3s ease, transform 0.3s ease;
}

a:hover img {
  filter: grayscale(0%); /* Retire le filtre au survol */
  transform: scale(1.1); /* Zoom léger pour un effet dynamique */
}
  </style>
  