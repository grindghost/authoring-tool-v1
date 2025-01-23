<script setup lang="ts">

const { status, signIn, signOut } = useAuth()
</script>

<template>
    <Hero />
    <!-- <Problem /> -->
    <RoadmapSection />
    <PricingSection />
    <!-- <FeaturesAccordion /> -->
</template>