<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid'
const { status, signIn, data } = useAuth()
const { checkout, tiers, navigateToStripeDashboard } = useStripe()

const yearlyEnabled = ref(false)
const filteredTiers = computed(() => {
  return tiers.filter(tier =>
    yearlyEnabled.value ? tier.type === 'yearly' : tier.type === 'monthly'
  )
})

const handleBuyNow = async (lookupKey: string) => {
  if (data.value?.user?.isSubscribed) {
    await navigateToStripeDashboard()
  } else if (status.value === 'authenticated') {
    await checkout(lookupKey)
  } else {
    signIn('github')
  }
}

const buttonText = computed(() => {
  if (data.value?.user?.isSubscribed) {
    return 'Manage Subscription'
  } else if (status.value === 'authenticated') {
    return 'Buy Now'
  } else {
    return 'Sign In to Buy'
  }
})

</script>

<template>
  <section class="bg-gray-100 py-24 px-8">
    <div class="text-center mb-20">
      <p class="font-medium text-primary mb-8">Pricing</p>
      <h2 class="font-bold text-3xl lg:text-5xl tracking-tight">
        Save hours of repetitive code and ship faster!
      </h2>

      <p
        class="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600"
      >
        Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi
        iusto modi velit ut non voluptas in. Explicabo id ut laborum.
      </p>

      <!-- Yearly toggle -->
      <div class="flex items-center justify-center mt-14 -mb-4">
        <ToggleWithText v-model="yearlyEnabled" />
      </div>

    </div>

    <div class="flex flex-col lg:flex-row justify-center gap-4 items-stretch">
      <div
        v-for="tier in filteredTiers"
        :key="tier.id"
        class="relative w-full max-w-lg sm:max-w-full"
      >
        <!-- Featured Badge -->
        <div
          v-if="tier.isFeatured"
          class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <span
            class="badge text-xs text-primary-content font-semibold border-0 bg-primary"
          >
            POPULAR
          </span>
        </div>

        <!-- Featured Border -->
        <div
          v-if="tier.isFeatured"
          class="absolute -inset-[1px] rounded-[9px] bg-primary z-10"
        ></div>

        <div
          class="relative flex flex-col h-full gap-5 lg:gap-8 bg-base-100 p-8 rounded-lg shadow-lg z-10"
        >
          <!-- Title and Description -->
          <div>
            <p class="text-lg lg:text-xl font-bold">{{ tier.name }}</p>
            <p v-if="tier.description" class="text-base-content/80 mt-2">
              {{ tier.description }}
            </p>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-2 text-primary">
            <p class="text-5xl font-extrabold">${{ tier.price }}</p>
            <span class="text-xs uppercase font-semibold text-base-content/60">
              USD/month
            </span>
          </div>

          <!-- Features -->
          <ul class="space-y-2.5 leading-relaxed text-base flex-1">
            <li
              v-for="feature in tier.features"
              :key="feature.name"
              class="flex items-center gap-2"
            >
              <CheckIcon
                class="h-5 w-5 text-primary shrink-0"
                aria-hidden="true"
              />
              {{ feature.name }}
            </li>
          </ul>

          <!-- Actions -->
          <div>
            <button
              @click="handleBuyNow(tier.id)"
              :class="[
                tier.isFeatured
                  ? 'bg-primary text-white shadow-sm hover:bg-secondary'
                  : 'bg-white text-black ring-1 ring-primary hover:ring-primary-focus',
                'w-full py-3 px-5 rounded-lg font-medium',
              ]"
            >
              {{ buttonText}}
            </button>
            <p
              class="mt-2 text-sm text-center text-base-content/80 font-medium"
            >
              Pay once. Access forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
