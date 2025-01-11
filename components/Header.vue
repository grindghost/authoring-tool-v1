<template>
    <header class="bg-base-200">
      <nav
        class="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        <!-- Your logo/name on large screens -->
        <div class="flex lg:flex-1">
          <NuxtLink
            class="flex items-center gap-2 shrink-0"
            to="/"
            :title="`${config.appName} homepage`"
          >
            <img
              :src="logo"
              :alt="`${config.appName} logo`"
              class="w-8"
              width="32"
              height="32"
            />
            <span class="font-extrabold text-lg">{{ config.appName }}</span>
          </NuxtLink>
        </div>
  
        <!-- Burger button to open menu on mobile -->
        <div class="flex lg:hidden">
          <button
            type="button"
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            @click="isOpen = true"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 text-base-content"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
  
        <!-- Your links on large screens -->
        <div class="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          <NuxtLink
            v-for="link in links"
            :key="link.href"
            :to="link.href"
            class="link link-hover"
            :title="link.label"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
  
        <!-- CTA on large screens -->
        <div class="hidden lg:flex lg:justify-end lg:flex-1">
          <ButtonSignin text="Sign In" extraStyle="btn-primary" />
        </div>
      </nav>
  
      <!-- Mobile menu -->
      <div :class="['relative z-50', isOpen ? '' : 'hidden']">
        <div
          class="fixed inset-y-0 right-0 z-10 w-full px-8 py-4 overflow-y-auto bg-base-200 sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300"
        >
          <!-- Your logo/name on small screens -->
          <div class="flex items-center justify-between">
            <NuxtLink
              class="flex items-center gap-2 shrink-0"
              to="/"
              :title="`${config.appName} homepage`"
            >
              <img
                :src="logo"
                :alt="`${config.appName} logo`"
                class="w-8"
                width="32"
                height="32"
              />
              <span class="font-extrabold text-lg">{{ config.appName }}</span>
            </NuxtLink>
            <button
              type="button"
              class="-m-2.5 rounded-md p-2.5"
              @click="isOpen = false"
            >
              <span class="sr-only">Close menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
  
          <!-- Your links on small screens -->
          <div class="flow-root mt-6">
            <div class="py-4">
              <div class="flex flex-col gap-y-4 items-start">
                <NuxtLink
                  v-for="link in links"
                  :key="link.href"
                  :to="link.href"
                  class="link link-hover"
                  :title="link.label"
                >
                  {{ link.label }}
                </NuxtLink>
              </div>
            </div>
            <div class="divider"></div>
            <!-- Your CTA on small screens -->
            <div class="flex flex-col">
              <ButtonSignin text="Sign In" extraStyle="btn-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import ButtonSignin from "./ButtonSignin.vue"; // Adjust the path to match your project structure
  import config from "../config.js";
  
  // Define your state variables and props here
  const isOpen = ref(false);
  
  const logo = "logo.png"; // Replace with your logo path
  const links = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    // Add more links as needed
  ];
  </script>
  