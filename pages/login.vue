<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useProjects } from "~/stores/projects";

const router = useRouter();
const { session, signIn } = useAuth();
const projectStore = useProjects();
const errorMessage = ref(""); 

definePageMeta({
  middleware: ["auth"],
});

const handleGithubSignIn = () => {
    try {
        projectStore.startLoading();
        errorMessage.value = "";
        signIn("github"); // Replace "github" with your provider name
        router.push("/dashboard");
    } catch (error) {  
        errorMessage.value = "Une erreur s'est produite lors de la connexion avec Github.";
        console.error("Github login error:", error);
    } finally {
        projectStore.stopLoading();

    }
  };

</script>

<template>
  
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6" :class="{ transparent: projectStore.isLoading }">
    <div class="max-w-4xl w-full">
      <!-- Main Card Container -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="flex flex-col md:flex-row">
          <!-- Image Section -->
          <div class="w-full md:w-1/2 relative">
            <img
              src="/assets/login.jpg"
              alt="Login illustration"
              class="w-full h-full object-cover"
              style="min-height: 300px;"
            />
            <!-- Optional overlay for better text visibility -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-6">
              <h2 class="text-white text-xl font-bold"></h2>
            </div>
          </div>

          <!-- Login Section -->
          <div class="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <!-- Header Section -->
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Connectez-vous</h2>
              <p class="text-gray-600">Pour accéder à votre espace personnel</p>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {{ errorMessage }}
            </div>

            <!-- Auth Buttons -->
            <div class="space-y-4">
              <button
                @click="handleGithubSignIn"
                :disabled="projectStore.isLoading"
                class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span class="text-gray-700 font-medium">Continuer avec Google</span>
              </button>

              <button
                @click="handleGithubSignIn"
                :disabled="projectStore.isLoading"
                class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#333333" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span class="text-gray-700 font-medium">Continuer avec GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>