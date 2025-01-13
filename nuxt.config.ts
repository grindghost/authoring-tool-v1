// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@sidebase/nuxt-auth', '@nuxt/image'],
  runtimeConfig: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET_KEY: process.env.STRIPE_WEBHOOK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  auth: {
    originEnvKey: 'AUTH_ORIGIN',
    baseURL: `${process.env.NEXTAUTH_URL}/api/auth`,
    provider: {
      type: 'authjs',
      defaultProvider: 'github',
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
  nitro: {
    routeRules: {
      '/api/auth/**': { ssr: true }, // Ensure server-side rendering for these routes
    },
  },
  css: ['~/assets/css/tailwind.css'],
})