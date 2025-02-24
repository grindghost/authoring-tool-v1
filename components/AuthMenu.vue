<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
const { data, signOut } = useAuth()
const { navigateToStripeDashboard } = useStripe()

const router = useRouter()

import { useProjects } from '~/stores/projects';
const projectStore = useProjects();

const navigateToProjectsDashboard = async() => {
  // The following cause a hard reload...
  // navigateTo('/dashboard', {
  //   external: true,
  // })
  router.push({ path: "/dashboard" })
}

const handleNavigateToStripeDashboard = async() => {
  projectStore.startLoading();
  await navigateToStripeDashboard();
}

const handleSignOut = async () => {
  try {
        projectStore.startLoading();
        await signOut();
    } catch (error) {  
        console.error("Github logout error:", error);
    } finally {
        projectStore.stopLoading();
    }
}

const solutions = [
  { name: 'Tableau de bord', fn: navigateToProjectsDashboard },
  { name: 'Mon abonnement', fn: handleNavigateToStripeDashboard },
  { name: 'Déconnexion', fn: handleSignOut },
]

</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900"
    >
      <AuthAvatar :plan="data?.user?.plan" :src="data?.user?.image" />
    </PopoverButton>
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel
        class="absolute left-1/2 z-10 mt-2 flex w-screen max-w-min -translate-x-[90%] px-4"
      >
        <div
          class="w-44 shrink rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-gray-900 shadow-lg ring-1 ring-gray-900/5"
        >
         <button
            v-for="item in solutions"
            :key="item.name"
            @click="() => item.fn()"
            class="block p-2 hover:text-primary"
          >
            {{ item.name }}
          </button>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>