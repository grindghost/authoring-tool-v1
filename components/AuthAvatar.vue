<script lang="ts" setup>

interface Props {
  src: string | null | undefined,
  plan: string | null | undefined,
}
defineProps<Props>()
</script>

<template>
  <img
    v-if="src"
    class="inline-block h-10 w-10 rounded-full bg-gray-500"
        :class="{
      'border-indigo-500 border-2': plan?.includes('tier-freelance'),
      'border-red-500 border-2': plan?.includes('tier-startup'),
      'border-green-500 border-2': plan?.includes('tier-enterprise'),
    }"
    :src="src"
    alt="User avatar"
  />
  <span
    v-else
    class="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100"
  >
    <svg
      class="h-full w-full text-gray-300"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </span>
</template>