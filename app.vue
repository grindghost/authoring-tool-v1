<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt'
</script>

<template>
  <slot name="layout">  
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </slot>
</template>
