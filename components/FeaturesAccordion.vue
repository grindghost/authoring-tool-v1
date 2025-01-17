<script setup>
import { ref } from 'vue';

const features = [
  {
    title: "Emails",
    description:
      "Send transactional emails, setup your DNS to avoid spam folder (DKIM, DMARC, SPF in subdomain), and listen to webhook to receive & forward emails",
    type: "video",
    path: "https://d3m8mk7e1mf7xn.cloudfront.net/app/newsletter.webm",
    format: "video/webm",
    emoji: "✉️",
  },
  {
    title: "Payments",
    description:
      "Create checkout sessions, handle webhooks to update user's account (subscriptions, one-time payments...) and tips to setup your account & reduce chargebacks",
    type: "image",
    path: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
    alt: "A computer",
    emoji: "💳",
  },
  {
    title: "Authentication",
    description:
      "Magic links setup, login with Google walkthrough, save user in MongoDB/Supabase, private/protected pages & API calls",
    emoji: "🔒",
    type: "image",
  },
  {
    title: "Style",
    description:
      "Components, animations & sections (like this features section), 20+ themes with daisyUI, automatic dark mode",
    emoji: "🎨",
    type: "image",
  },
];

const featureSelected = ref(0);
</script>

<template>
<section
  class="py-24 md:py-32 space-y-24 md:space-y-32 max-w-7xl mx-auto bg-base-100"
  id="features"
>
  <div class="px-8">
    <h2 class="font-extrabold text-4xl lg:text-6xl tracking-tight mb-12 md:mb-24">
      All you need to ship your startup fast
      <span class="bg-neutral text-neutral-content px-2 md:px-4 ml-1 md:ml-1.5 leading-relaxed whitespace-nowrap">
        and get profitable
      </span>
    </h2>
    <div class="flex flex-col md:flex-row gap-12 md:gap-24">
      <div class="grid grid-cols-1 items-stretch gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
        <ul class="w-full">
          <li
            v-for="(feature, i) in features"
            :key="feature.title"
          >
            <button
              class="relative flex gap-2 items-center w-full py-5 text-base font-medium text-left md:text-lg"
              @click.prevent="featureSelected = i"
              :aria-expanded="featureSelected === i"
            >
              <span :class="{'text-primary': featureSelected === i}">
                {{ feature.emoji }}
              </span>
              <span
                class="flex-1 text-base-content"
                :class="{ 'text-primary font-semibold': featureSelected === i }"
              >
                <h3 class="inline">{{ feature.title }}</h3>
              </span>
            </button>

            <div
              class="transition-all duration-300 ease-in-out text-base-content-secondary overflow-hidden"
              :style="featureSelected === i
                ? { maxHeight: 'none', opacity: 1 }
                : { maxHeight: 0, opacity: 0 }"
            >
              <div class="pb-5 leading-relaxed">{{ feature.description }}</div>
            </div>
          </li>
        </ul>

        <div>
          <div v-if="features[featureSelected]['type'] === 'video'">
            <video
              class="rounded-2xl aspect-square w-full sm:w-[26rem]"
              autoplay
              muted
              loop
              playsinline
              controls
              width="500"
              height="500"
            >
              <source
                :src="features[featureSelected]['path']"
                :type="features[featureSelected]['format']"
              />
            </video>
          </div>
          <img
            v-else-if="features[featureSelected]['type'] === 'image'"
            :src="features[featureSelected]['path']"
            :alt="features[featureSelected]['alt']"
            class="rounded-2xl aspect-square w-full sm:w-[26rem] object-cover object-center"
            width="500"
            height="500"
          />
          <div v-else class="rounded-2xl aspect-square w-full sm:w-[26rem] !border-none"></div>
        </div>
      </div>
    </div>
  </div>
</section>
</template>
