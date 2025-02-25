<script setup>
import { ref, onMounted } from 'vue'

import { OhVueIcon, addIcons } from "oh-vue-icons";
import { CoSun, BiMoonStars } from "oh-vue-icons/icons";

addIcons(CoSun, BiMoonStars);

const defaultLightTheme = 'mytheme'
const darkTheme = 'dark'

// Get theme from localStorage or set to default light theme
const theme = ref(localStorage.getItem('theme') || defaultLightTheme)

const toggleTheme = () => {
  theme.value = theme.value === defaultLightTheme ? darkTheme : defaultLightTheme
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<template>
  <label class="flex items-center cursor-pointer">
    <input type="checkbox" class="hidden" @change="toggleTheme" :checked="theme === darkTheme" />
    <div class="relative w-14 h-8 bg-base-300 rounded-full shadow-inner transition-colors duration-300">
      <div
        class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"
        :class="{ 'translate-x-6': theme === darkTheme }"
      >
        <div class="absolute inset-0 flex items-center justify-center text-yellow-500 transition-opacity duration-300"
             :class="{ 'opacity-0': theme === darkTheme }">
          <!-- <SunIcon size="16" /> -->
          <OhVueIcon name="co-sun" />

        </div>
        <div class="absolute inset-0 flex items-center justify-center text-blue-500 transition-opacity duration-300"
             :class="{ 'opacity-0': theme !== darkTheme }">
          <!-- <MoonIcon size="16" /> -->
          <OhVueIcon name="bi-moon-stars" />

        </div>
      </div>
    </div>
  </label>
</template>
