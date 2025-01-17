export function useStripe() {
    
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
      const tiers = [
        {
          name: 'Solo',
          id: 'tier-freelancer-monthly',
          lookupKey: 'tier-freelancer-monthly',
          price: 24,
          description: 'Les essentiels pour offrir votre meilleur à vos apprenants.',
          features: [
            { name: '2 projets' },
            { name: '50 réponses / projets' },
            { name: 'Analytique de base' },
            { name: 'Temps de réponse de support de 48 heures' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        {
          name: 'Innovateur',
          id: 'tier-startup-monthly',
          lookupKey: 'tier-startup-monthly',
          price: 32,
          description: 'Un plan qui s’adapte à la croissance rapide de votre formation.',
          features: [
            { name: '10 projets' },
            { name: '100 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse de support de 24 heures' },
          ],
          isFeatured: true,
          type: 'monthly',
        },
        {
          name: 'Élite',
          id: 'tier-enterprise-monthly',
          lookupKey: 'tier-enterprise-monthly',
          price: 48,
          description: 'Support et infrastructure dédiés pour votre formation.',
          features: [
            { name: '25 projets' },
            { name: '200 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse dédié de 1 heure' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        // Yearly
        {
          name: 'Solo',
          id: 'tier-freelancer-yearly',
          lookupKey: 'tier-freelancer-yearly',
          price: 150,
          description: 'Les essentiels pour offrir votre meilleur travail à vos apprenants.',
          features: [
            { name: '2 projets' },
            { name: '50 réponses / projets' },
            { name: 'Analytique de base' },
            { name: 'Temps de réponse de support de 48 heures' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
        {
          name: 'Innovateur',
          id: 'tier-startup-yearly',
          lookupKey: 'tier-startup-yearly',
          price: 200,
          description: 'Un plan qui s’adapte à la croissance rapide de votre formation.',
          features: [
            { name: '5 projets' },
            { name: '100 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse de support de 24 heures' },
          ],
          isFeatured: true,
          type: 'yearly',
        },
        {
          name: 'Élite',
          id: 'tier-enterprise-yearly',
          lookupKey: 'tier-enterprise-yearly',
          price: 400,
          description: 'Support et infrastructure dédiés pour votre formation.',
          features: [
            { name: '25 projets' },
            { name: '200 réponses / projets' },
            { name: 'Analytique avancée' },
            { name: 'Temps de réponse dédié de 1 heure' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
      ];
      
      /*
      const tiers = [
        {
          name: 'Freelancer',
          id: 'tier-freelancer-monthly',
          lookupKey: 'tier-freelancer-monthly',
          price: 24,
          description: 'The essentials to provide your best work for clients.',
          features: [
            { name: '5 products' },
            { name: 'Up to 1,000 subscribers' },
            { name: 'Basic analytics' },
            { name: '48-hour support response time' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        {
          name: 'Startup',
          id: 'tier-startup-monthly',
          lookupKey: 'tier-startup-monthly',
          price: 32,
          description: 'A plan that scales with your rapidly growing business.',
          features: [
            { name: '25 products' },
            { name: 'Up to 10,000 subscribers' },
            { name: 'Advanced analytics' },
            { name: '24-hour support response time' },
            { name: 'Marketing automations' },
          ],
          isFeatured: true,
          type: 'monthly',
        },
        {
          name: 'Enterprise',
          id: 'tier-enterprise-monthly',
          lookupKey: 'tier-enterprise-monthly',
          price: 48,
          description: 'Dedicated support and infrastructure for your company.',
          features: [
            { name: 'Unlimited products' },
            { name: 'Unlimited subscribers' },
            { name: 'Advanced analytics' },
            { name: '1-hour, dedicated support response time' },
            { name: 'Marketing automations' },
          ],
          isFeatured: false,
          type: 'monthly',
        },
        // Yearly
        {
          name: 'Freelancer',
          id: 'tier-freelancer-yearly',
          lookupKey: 'tier-freelancer-yearly',
          price: 150,
          description: 'The essentials to provide your best work for clients.',
          features: [
            { name: '5 products' },
            { name: 'Up to 1,000 subscribers' },
            { name: 'Basic analytics' },
            { name: '48-hour support response time' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
        {
          name: 'Startup',
          id: 'tier-startup-yearly',
          lookupKey: 'tier-startup-yearly',
          price: 200,
          description: 'A plan that scales with your rapidly growing business.',
          features: [
            { name: '25 products' },
            { name: 'Up to 10,000 subscribers' },
            { name: 'Advanced analytics' },
            { name: '24-hour support response time' },
            { name: 'Marketing automations' },
          ],
          isFeatured: true,
          type: 'yearly',
        },
        {
          name: 'Enterprise',
          id: 'tier-enterprise-yearly',
          lookupKey: 'tier-enterprise-yearly',
          price: 400,
          description: 'Dedicated support and infrastructure for your company.',
          features: [
            { name: 'Unlimited products' },
            { name: 'Unlimited subscribers' },
            { name: 'Advanced analytics' },
            { name: '1-hour, dedicated support response time' },
            { name: 'Marketing automations' },
          ],
          isFeatured: false,
          type: 'yearly',
        },
      ]
      */

      return { checkout, navigateToStripeDashboard, tiers }
}