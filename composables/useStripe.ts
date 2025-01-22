export function useStripe() {
  
  const config = useRuntimeConfig();
  
  // Parse the tiers JSON string into an object
  const tierData = JSON.parse(config.public.NUXT_PUBLIC_TIERS);
    
  const checkout = async (lookupKey: string) => {
    const PRICE_LOOKUP_KEY = 'monthly_standard'

    const res = await $fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        lookup_key: lookupKey,
      },
    })

    if (res) {
      await navigateTo(res.url, {
        external: true,
      })
    }
  }

    const navigateToStripeDashboard = async () => {
        const res = await $fetch('/api/stripe/create-portal-session', {
          method: 'POST',
        })
    
        if (res && 'url' in res) {
          await navigateTo(res.url, {
            external: true,
          })
        } else {
          console.error('Error creating portal session:', res.error)
        }
      }
      // Map the tier data into the required format
      const tiers = [
        // Monthly tiers
        {
          name: tierData.tier1.name,
          id: tierData.tier1.id,
          lookupKey: tierData.tier1.id,
          price: tierData.tier1.price,
          description: 'Les essentiels pour offrir votre meilleur à vos apprenants.',
          features: [
            { name: `${tierData.tier1.limit} projets` },
            { name: '50 réponses / projets' },
            { name: 'Analytique de base' },
            { name: 'Temps de réponse de support de 48 heures' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        {
          name: tierData.tier2.name,
          id: tierData.tier2.id,
          lookupKey: tierData.tier2.id,
          price: tierData.tier2.price,
          description: 'Un plan qui s’adapte à la croissance rapide de votre formation.',
          features: [
            { name: `${tierData.tier2.limit} projets` },
            { name: '100 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse de support de 24 heures' },
          ],
          isFeatured: true,
          type: 'monthly',
        },
        {
          name: tierData.tier3.name,
          id: tierData.tier3.id,
          lookupKey: tierData.tier3.id,
          price: tierData.tier3.price,
          description: 'Support et infrastructure dédiés pour votre formation.',
          features: [
            { name: `${tierData.tier3.limit} projets` },
            { name: '200 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse dédié de 1 heure' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        // Yearly tiers
        {
          name: tierData.tier4.name,
          id: tierData.tier4.id,
          lookupKey: tierData.tier4.id,
          price: tierData.tier4.price,
          description: 'Les essentiels pour offrir votre meilleur travail à vos apprenants.',
          features: [
            { name: `${tierData.tier4.limit} projets` },
            { name: '50 réponses / projets' },
            { name: 'Analytique de base' },
            { name: 'Temps de réponse de support de 48 heures' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
        {
          name: tierData.tier5.name,
          id: tierData.tier5.id,
          lookupKey: tierData.tier5.id,
          price: tierData.tier5.price,
          description: 'Un plan qui s’adapte à la croissance rapide de votre formation.',
          features: [
            { name: `${tierData.tier5.limit} projets` },
            { name: '100 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse de support de 24 heures' },
          ],
          isFeatured: true,
          type: 'yearly',
        },
        {
          name: tierData.tier6.name,
          id: tierData.tier6.id,
          lookupKey: tierData.tier6.id,
          price: tierData.tier6.price,
          description: 'Support et infrastructure dédiés pour votre formation.',
          features: [
            { name: `${tierData.tier6.limit} projets` },
            { name: '200 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse dédié de 1 heure' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
      ];


      return { checkout, navigateToStripeDashboard, tiers }
}