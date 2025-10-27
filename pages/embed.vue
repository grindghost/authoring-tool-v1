<template>
    
    <div style="padding: 2px;">
        <!-- Embed unit component -->
        <UnitEmbed
            :profile=profile 
        />
    </div>
</template>

<script setup>
    import { initializeScaler } from '~/utils/scaler';
    import { useAppStateStore } from '/stores/appState';

    const store = useAppStateStore();
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

        // Get the actor and registration from the query parameters
        let actorParam = queryParams.get('actor');
        let registrationParam = queryParams.get('registration');
        
        // Values to be used in the store
        let actor = null;
        let registration = null;

        // Default registration string
        const defaultRegistration = 'unknown-registration';
        
        // Default actor object
        const defaultActor = {
            mbox: 'mailto:unknown@example.com',
            name: 'Unknown User',
        };

        // Check if the registrationParam exists, and is valid
        if (registrationParam) {
            try {
                const decodedRegistration = decodeURIComponent(registrationParam);
                const decryptedRegistration = atob(decodedRegistration);
                console.log("Registration:", decryptedRegistration);
                
                // Assume the registration is valid, and assign it to the registration variable as a plain string
                registration = decryptedRegistration;
            } catch (error) {
                registration = defaultRegistration;
                console.warn("Malformed registration parameter, using default value.");
            }
        } else {
            // Use the default registration string to be used in the store
            registration = defaultRegistration;
            console.warn("Registration query parameter is missing, using default values.");
        }

        // Check if the actorParam exists, and is valid
        if (actorParam) {
            try {
                const decodedActor = decodeURIComponent(actorParam);
                const decryptedActor = atob(decodedActor);
                console.log("Actor:", decryptedActor);
                
                // Assume the actor is valid, and assign it to the actor variable
                actor = actorParam;
            } catch (error) {
                actor = btoa(JSON.stringify(defaultActor));
                console.warn("Malformed actor query parameter, using default values.");
            }
        } else {
            // Encrypt the default actor object to be used in the store
            actor = btoa(JSON.stringify(defaultActor));
            console.warn("Actor query parameter is missing, using default values.");
        }
        
        // Logic to assign, or remotely retrieve the unit profile (from db)
        profile.value = await store.GetUnitProfile(token, lang, actor, registration); 
        await store.SetUnitStateOnArrival(profile.value);
    });

</script>




    
 