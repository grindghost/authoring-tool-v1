<script setup lang="ts">

import { OhVueIcon, addIcons } from "oh-vue-icons";
import { FaBook } from "oh-vue-icons/icons";
import { useProjects } from "~/stores/projects";
import { useRouter, useRoute } from "vue-router";


addIcons(FaBook);

const { status, signIn } = useAuth();
const router = useRouter();
const route = useRoute();

const projectStore = useProjects();

const handleSignIn = () => {
    // signIn("github"); // Replace "github" with your provider name
    router.push("/login");
  };

const handleLogoClick = () => {
  const currentPage = route.name;
  if (status === "authenticated" && currentPage !== "dashboard") {
    return "/dashboard";
  } else {
    return "/";
  }

}

</script>

<template>
  <div>
    <!-- Global loading screen -->
    <LoadingScreen :show="projectStore.isLoading" />
    
    <div class="navbar bg-base-100 shadow fixed z-50">
      <div class="flex-1">
        <NuxtLink :to="status === 'authenticated' && route.name !== 'dashboard' ? '/dashboard' : '/'" class="btn btn-ghost hover:bg-transparent normal-case text-xl">
          <OhVueIcon name="fa-book" />
          <span>Mon journal de bord</span>
          <div class="badge badge-primary badge-outline max-sm:hidden">v1.1</div>  
          <span class="border-l-2 border-gray-200 mx-4 pl-5 font-medium text-sm"> {{ projectStore.currentProject?.name }} </span>
        </NuxtLink>
        <!-- <span class="border-l-2 border-gray-200 mx-2 pl-5">{{ authStore.currentProject?.name }}</span> -->
      </div>

      <div class="right-4 absolute">
      <AuthMenu v-if="status === 'authenticated'" />
      <button v-else @click="handleSignIn">{{ route.name !== "login" ? "Connexion" : "" }}</button>
    </div>

    </div>
    
    <!-- Content -->
    <NuxtPage />
    <!-- Content -->
  
    <Footer />

  </div>
</template>