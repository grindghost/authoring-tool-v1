// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@sidebase/nuxt-auth', '@nuxt/image', '@pinia/nuxt'],

  app: {
    head: {
      title: 'Mon journal de bord', // Default website title
      meta: [
        { name: 'description', content: 'This is the default description for my website.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
      ],

      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;700&display=swap",
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.svg' },
      ],
    },
  },

  runtimeConfig: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET_KEY: process.env.STRIPE_WEBHOOK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  
    public: {
      NUXT_PUBLIC_TIERS: process.env.NUXT_PUBLIC_TIERS,
    }

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
      enablePeriodically: false,
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