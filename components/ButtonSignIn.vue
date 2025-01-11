<template>
    <div>
      <!-- Authenticated state -->
      <NuxtLink
        v-if="session && session.value?.user"
        :to="callbackUrl"
        :class="['btn', extraStyle]"
      >
        <img
          v-if="session.value.user?.image"
          :src="session.value.user.image"
          :alt="session.value.user.name || 'Account'"
          class="w-6 h-6 rounded-full shrink-0"
          referrerpolicy="no-referrer"
          width="24"
          height="24"
        />
        <span
          v-else
          class="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0"
        >
          {{ session.value.user?.name?.charAt(0) || session.value.user?.email?.charAt(0) }}
        </span>
        {{ session.value.user?.name || session.value.user?.email || "Account" }}
      </NuxtLink>
  
      <!-- Unauthenticated state -->
      <button
        v-else
        :class="['btn', extraStyle]"
        @click="handleSignIn"
      >
        {{ text }}
      </button>
    </div>
  </template>
  
  <script setup>
  import { useAuth } from "@/composables/useAuth";
  import { ref } from "vue";
  
  const { session, signIn } = useAuth();
  const text = ref("Get started");
  const extraStyle = ref("btn-primary");
  const callbackUrl = "/dashboard"; // Change to your callback URL
  
  const handleSignIn = () => {
    signIn("github"); // Replace "github" with your provider name
  };
  </script>
  