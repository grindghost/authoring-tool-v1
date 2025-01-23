<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckIcon } from '@heroicons/vue/20/solid'
import { useStripe } from '@/composables/useStripe'

const { status, data } = useAuth()
const { checkout, tiers } = useStripe()

// Filter the first 3 tiers
const displayedTiers = computed(() => tiers.slice(0, 3))

// Manage the currently selected tier separately
const selectedTierIndex = ref(0) // Default to the first tier
const featuredTier = computed(() => displayedTiers.value[selectedTierIndex.value])


const handleBuyNow = async (lookupKey: string) => {
  if (status.value === 'authenticated') {
    await checkout(lookupKey)
  }
}

</script>

<template>
  <section class="bg-white py-12 px-6 lg:py-16 lg:px-12 rounded-lg shadow-lg border border-t-8 border-t-primary">
    <div
      class="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-center justify-center lg:items-start lg:justify-start"
    >
      <!-- Left Column (Text) -->
      <div class="lg:w-3/5 flex flex-col justify-center text-center w-3/4 lg:text-left">
        <p class="font-medium text-primary text-lg mb-4">Bienvenue {{ data?.user?.name }} 👋</p>
        <h3 class="text-2xl md:text-3xl w-full lg:w-3/4 font-bold mb-6">
          Commencez par choisir un plan pour ajouter des projets
        </h3>
        <p class="text-base md:text-lg text-base-content/80 mb-6">
          Notre plan <span class="font-bold">{{ featuredTier?.name }}</span> est parfait pour 
          commencer votre voyage d'apprentissage. Il vous offre toutes les fonctionnalités 
          dont vous avez besoin pour structurer vos réflexions et consolider vos idées.
        </p>
        <div class="flex items-center justify-center lg:justify-start gap-4">
          <a href="/#pricing" class="link text-primary text-sm">
            En savoir plus sur les forfaits...
          </a>
        </div>
      </div>

      <!-- Right Column (Price Card) -->
      <div class="lg:w-2/5 flex flex-col items-center">
        <div class="relative w-full max-w-sm">
          <!-- Featured Badge -->
          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <span class="badge text-xs text-primary-content font-semibold border-0 bg-primary">
              RECOMMANDÉ
            </span>
          </div>

          <!-- Price Card -->
          <div class="bg-base-100 border border-primary rounded-lg p-6 shadow-lg flex flex-col gap-4">
            <!-- Title and Description -->
            <div>
              <p class="text-lg font-bold text-center">{{ featuredTier?.name }}</p>
              <p v-if="featuredTier?.description" class="text-base-content/80 text-center mt-2">
                {{ featuredTier?.description }}
              </p>
            </div>

            <!-- Price -->
            <div class="text-center">
              <p class="text-4xl font-extrabold text-primary">${{ featuredTier?.price }}</p>
              <span class="text-xs uppercase font-semibold text-base-content/60">
                CA/{{ yearlyEnabled ? 'an' : 'mois' }}
              </span>
            </div>

            <!-- Action Button -->
            <button
              @click="handleBuyNow(featuredTier?.id)"
              class="w-full py-3 px-5 rounded-lg font-medium bg-primary text-white shadow-sm hover:bg-secondary"
            >
              Commencer maintenant
            </button>
          </div>
        </div>

        <!-- Dots for Plan Selection -->
        <div class="flex justify-center mt-4 space-x-2">
          <span
            v-for="(tier, index) in displayedTiers"
            :key="index"
            class="w-3 h-3 bg-primary rounded-full cursor-pointer hover:opacity-80"
            :class="{'bg-secondary': index === selectedTierIndex}"
            @click="selectedTierIndex = index"
          ></span>
        </div>
      </div>
    </div>
  </section>
</template>


