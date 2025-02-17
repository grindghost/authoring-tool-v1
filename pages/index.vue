<script setup lang="ts">

const { status, signIn, signOut } = useAuth()
</script>

<template>
    <!-- Background pattern container with gradient -->
    <div class="fixed inset-0 z-[0]" 
            style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPgo8L3N2Zz4='); clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)">
        <!-- Gradient overlay for fade-out effect -->
        <div class="absolute inset-0" 
                style="background: linear-gradient(to bottom, 
                                                rgba(255,255,255,0) 0%, 
                                                rgba(255,255,255,0.5) 50%, 
                                                rgba(255,255,255,1) 100%);">
        </div>
    </div>

    <Hero />
    <!-- <Customers /> -->
    <TechStack />
    <!-- <problem /> -->
    <QuoteBanner
        quote="Ce n'est pas l'expérience qui nous apprend quelque chose, c'est la réflexion sur l'expérience."
        author="John Dewey"
        backgroundImage="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        imageAlt="Inspiring workspace"
        :parallaxStrength="0.15"

    />

    <RoadmapSection />
    <!-- <PricingSection /> -->
    <!-- <FeaturesAccordion /> -->
</template>