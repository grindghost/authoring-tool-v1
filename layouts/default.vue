<script setup lang="ts">
const { status, signIn } = useAuth()

import { OhVueIcon, addIcons } from "oh-vue-icons";
import { FaBook } from "oh-vue-icons/icons";
addIcons(FaBook);

</script>

<template>
  <div>
    <div class="navbar bg-base-100 shadow fixed z-50">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost hover:bg-transparent normal-case text-xl">
          <OhVueIcon name="fa-book" />
          <span>Mon journal de bord</span>
          <div class="badge badge-primary badge-outline">v1.1</div>  
        </NuxtLink>
        <!-- <span class="border-l-2 border-gray-200 mx-2 pl-5">{{ authStore.currentProject?.name }}</span> -->
      </div>

      <div class="right-4 absolute">
      <AuthMenu v-if="status === 'authenticated'" />
      <button v-else @click="() => signIn('github', { callbackUrl: '/dashboard' })">Sign In</button>
    </div>

    </div>
    <!-- Content -->
    <NuxtPage />
    <!-- Content -->
  </div>
</template>