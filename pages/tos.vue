<template>
    <main class="max-w-xl mx-auto pt-24 mb-24">
      <div class="p-5">
        <NuxtLink @click.prevent="goBack" class="btn btn-ghost hover:bg-white mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              fill-rule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clip-rule="evenodd"
            />
          </svg>
          Retour
        </NuxtLink>
        <h1 class="text-3xl font-extrabold pb-6">
          Conditions Générales d'Utilisation
        </h1>
        
        <div class="terms-content leading-relaxed">
          <p class="text-sm text-gray-600 mb-4">Dernière mise à jour: 24 février 2025</p>
          
          <h2 class="text-xl font-bold mt-6">1. Introduction</h2>
          <p class="mb-4">En utilisant notre application Web, vous confirmez votre acceptation des présentes conditions générales d'utilisation.</p>
          
          <h2 class="text-xl font-bold mt-6">2. Abonnements et accès</h2>
          <p class="mb-4">Notre application propose trois forfaits d'abonnement, disponibles en paiement mensuel ou annuel. Chaque forfait offre un accès aux fonctionnalités permettant de créer et gérer des unités de collection de réponses dynamiques à partir de fichiers PDF interactifs.</p>
          
          <h2 class="text-xl font-bold mt-6">3. Droit de résiliation</h2>
          <p class="mb-4">Nous nous réservons le droit de résilier tout abonnement en cas de non-respect des présentes conditions.</p>
          
          <h2 class="text-xl font-bold mt-6">4. Remboursements</h2>
          <p class="mb-4">Les abonnements ne sont pas remboursables une fois l'accès au service accordé.</p>
          
          <h2 class="text-xl font-bold mt-6">5. Garanties et limitations de responsabilité</h2>
          <p class="mb-4">Nous ne garantissons pas que l'application répondra à vos besoins spécifiques ou qu'elle fonctionnera sans interruption. Notre responsabilité est limitée au montant payé pour l'abonnement en cours.</p>
          
          <h2 class="text-xl font-bold mt-6">6. Responsabilités des utilisateurs</h2>
          <p class="mb-4">Vous êtes seul responsable de l'utilisation que vous faites de l'application et des contenus générés.</p>
          
          <h2 class="text-xl font-bold mt-6">7. Modifications des prix</h2>
          <p class="mb-4">Nous nous réservons le droit d'ajuster les prix des abonnements pour refléter l'amélioration continue de nos services.</p>
          
          <h2 class="text-xl font-bold mt-6">8. Droit applicable</h2>
          <p class="mb-4">Ces conditions sont régies par les lois applicables en vigueur.</p>
        </div>
      </div>
    </main>
  </template>
  
  <script setup>
  const config = {
    appName: 'Mon journal de bord'
  };
  const router = useRouter();

  definePageMeta({
    auth: false,
  });
  
  useHead({
    title: `Conditions Générales | ${config.appName}`,
    meta: [
      {
        name: 'description',
        content: `Conditions Générales pour ${config.appName}`
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: `${config.siteUrl}/terms-and-conditions`
      }
    ]
  });
  
  const goBack = () => {
    router.back();
  };

  onMounted(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  </script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>