<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const confirmationText = ref('');
const isDeleting = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('error');

definePageMeta({
middleware: ["auth"],
// pageTransition: false,
});

const goBack = () => {
  router.push('/dashboard');
};

const deleteAccount = async () => {
  if (confirmationText.value !== 'SUPPRIMER MON COMPTE') {
    return;
  }
  
  try {
    isDeleting.value = true;
    
    const response = await $fetch('/api/account/delete', {
      method: 'DELETE'
    });
    
    if (response.success) {
      toastType.value = 'success';
      toastMessage.value = 'Votre compte a été supprimé avec succès.';
      showToast.value = true;
      
      // Short delay before redirecting to logout
      setTimeout(() => {
        navigateTo('/logout');
      }, 2000);
    } else {
      throw new Error(response.message || 'Une erreur est survenue.');
    }
  } catch (err) {
    toastType.value = 'error';
    toastMessage.value = err.message || 'Une erreur est survenue lors de la suppression de votre compte.';
    showToast.value = true;
    isDeleting.value = false;
  }
};

// Toast timer
const showToastWithTimeout = () => {
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// Watch for toast changes to trigger timeout
watch(showToast, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }
});
</script>

<template>
    <div class="p-6 space-y-8 pt-24 pb-16 bg-slate-50 wrapper">
      <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center mb-6">
          <OhVueIcon name="fc-delete-database" scale="1.5" class="mr-2" />
          <h1 class="text-2xl font-medium">Supprimer votre compte</h1>
        </div>
  
        <div class="alert bg-white shadow-lg rounded-lg border-none mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-info h-12 w-12 shrink-0 stroke-primary">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <span class="line-clamp-4 leading-5">
              Cette action est permanente et ne peut pas être annulée. Toutes vos données seront supprimées, y compris vos projets, votre abonnement et vos informations personnelles.
            </span>
          </div>
        </div>
  
        <div class="space-y-6">
          <div class="bg-slate-50 p-4 rounded-lg">
            <h3 class="font-medium mb-2">La suppression de votre compte entraînera :</h3>
            <ul class="space-y-2">
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span>La suppression immédiate de tous vos projets</span>
              </li>
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span>L'annulation de votre abonnement Stripe</span>
              </li>
              <li class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span>La suppression de toutes vos données personnelles</span>
              </li>
            </ul>
          </div>
  
          <div class="border-t pt-6">
            <p class="font-medium mb-2">Pour confirmer, veuillez saisir "SUPPRIMER MON COMPTE" ci-dessous :</p>
            <input
              v-model="confirmationText"
              type="text"
              class="border rounded px-4 py-2 w-full mb-4"
              placeholder="Tapez SUPPRIMER MON COMPTE"
            />
            
            <div class="flex gap-3">
              <button 
                @click="goBack" 
                class="btn bg-slate-50 rounded-md text-black"
              >
                Annuler
              </button>
              <button 
                @click="deleteAccount" 
                class="btn bg-primary rounded-md text-white" 
                :disabled="confirmationText !== 'SUPPRIMER MON COMPTE' || isDeleting"
              >
                <span v-if="isDeleting">Suppression en cours...</span>
                <span v-else>Supprimer mon compte</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Toast Notification -->
      <div 
        v-if="showToast" 
        class="toast toast-bottom toast-right z-50"
      >
        <div class="customToast animate-popup alert bg-white text-black shadow-lg pr-8">
          <span class="text-2xl" v-if="toastType === 'success'">👍</span>
          <span class="text-2xl" v-else>⚠️</span>
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </div>
  </template>

  
  <style scoped>
  .animate-popup {
    animation: popup 0.3s ease-out;
  }
  
  @keyframes popup {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .customToast {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  </style>