<template>
    
    <div style="padding: 2px;">
        <!-- This is the embed unit component -->
        <UnitEmbed
            :profile=profile 
        />
    </div>
</template>

<script setup>
    import { initializeScaler } from '~/utils/scaler';
    import { useAppStateStore } from '/stores/appState';

    const store = useAppStateStore();
    const config = useRuntimeConfig();

    const profile = ref({});

    definePageMeta({
        layout: false,
        auth: false,

    });

    onMounted(async() => {
        
        
        // Scaling logic, specific to this embedable page
        initializeScaler();

        // Step 1: Get the query parameters
        const queryParams = new URLSearchParams(window.location.search); 
        
        // Step 2: Get the token, and the language from the query parameters
        const token = queryParams.get('token') || 'U2FsdGVkX19V6ijt6Qvi7ZPkpc9h44HR3CIIdxmJ/1nvAHpWzgswKlRFOrTWeTcXgO4Mqcpe0hK/cgx22UWM84mb+vhtqWnQ4QWRvx9B3O/7uOAoeNZD0+ezhimNzoiD5m74niJv0U7KRNLAJJK9bQ==';
        
        const lang = queryParams.get('lang') || 'fr';

        // Get the actor from the query parameters (from xAPI)
        const actor = queryParams.get('actor');

        // Console log the actor
        const decodedActor = decodeURIComponent(actor);
        const decryptedActor = atob(decodedActor);
        console.log("xAPIActor:", decryptedActor);
        
        // Logic to assign, of remotely retrieve the unit profile (from db)
        profile.value = await store.GetUnitProfile(token, lang, actor); 
        
        await store.SetUnitStateOnArrival(profile.value);
    });

</script>




    
 