<template>
    <main class="flex items-center justify-center h-screen">
      <article class="max-w-md text-center">
        <h1 class="text-5xl font-bold mb-4">429</h1>
        <p class="text-gray-500 mb-4">Trop de requêtes. Essayez plus tard...</p>
        <NuxtLink
          to="/"
          class="inline-block py-2 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Retour à l'accueil
        </NuxtLink>
      </article>
    </main>
  </template>
  
  <script setup>
  useHead(() => ({
    status: 429,
    title: "Too Many Requests",
  }));
  </script>
  