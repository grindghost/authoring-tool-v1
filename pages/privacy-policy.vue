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
          Politique de Confidentialité
        </h1>
        
        <div class="privacy-content leading-relaxed">
          <p class="text-sm text-gray-600 mb-4">Dernière mise à jour: 29 juin 2024</p>
          
          <p class="mb-4">Votre vie privée est importante pour nous. La politique de <strong>Mon journal de bord</strong> est de respecter votre vie privée concernant toute information que nous pourrions collecter auprès de vous sur notre site web et autres sites que nous possédons et exploitons.</p>
          
          <p class="mb-4">Nous ne demandons des informations personnelles que lorsque nous en avons réellement besoin pour vous fournir un service. Nous les collectons par des moyens justes et légaux, avec votre connaissance et votre consentement. Nous vous informons également des raisons pour lesquelles nous les collectons et de la façon dont elles seront utilisées.</p>
          
          <p class="mb-4">Vous pouvez vous inscrire avec votre compte Google ou Github, ainsi le nom d'utilisateur de votre compte <strong>Mon journal de bord</strong> sera prérempli avec votre nom et votre photo de profil publique.</p>
          
          <p class="mb-4">Nous ne conservons les informations collectées que le temps nécessaire pour vous fournir le service demandé. Les données que nous stockons sont protégées par des moyens commercialement acceptables pour prévenir la perte et le vol, ainsi que l'accès, la divulgation, la copie, l'utilisation ou la modification non autorisés.</p>
          
          <p class="mb-4">Nous ne partageons aucune information permettant de vous identifier personnellement publiquement ou avec des tiers, sauf lorsque la loi l'exige.</p>
          
          <p class="mb-4">Nous agissons en qualité de responsable du traitement des données et de sous-traitant concernant les données personnelles traitées via <strong>Mon journal de bord</strong> et les services conformément aux lois applicables sur la protection des données, y compris le Règlement général sur la protection des données (RGPD) de l'UE.</p>
          
          <p class="mb-4">Notre site web peut contenir des liens vers des sites externes qui ne sont pas exploités par nous. Veuillez noter que nous n'avons aucun contrôle sur le contenu et les pratiques de ces sites et que nous ne pouvons pas accepter la responsabilité ou l'obligation concernant leurs politiques de confidentialité respectives.</p>
          
          <p class="mb-4">Vous êtes libre de refuser notre demande d'informations personnelles, en sachant que nous pourrions ne pas être en mesure de vous fournir certains des services que vous désirez.</p>
          
          <p class="mb-4">Votre utilisation continue de notre site web sera considérée comme une acceptation de nos pratiques en matière de confidentialité et d'informations personnelles. Si vous avez des questions sur la façon dont nous traitons les données des utilisateurs et les informations personnelles, n'hésitez pas à nous contacter.</p>
          
          <p class="mt-8 font-medium">Cette politique est en vigueur à partir du 29 juin 2024.</p>
        </div>
      </div>
    </main>
  </template>
  
  <script setup>
  const config = {
    appName: 'Mon journal de bord'
  }
  const router = useRouter();

  definePageMeta({
        // layout: false,
        auth: false,

    });
  
  useHead({
    title: `Privacy Policy | ${config.appName}`,
    meta: [
      {
        name: 'description',
        content: `Privacy Policy for ${config.appName}`
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: `${config.siteUrl}/privacy-policy`
      }
    ]
  });
  
  const goBack = () => {
    router.back();
  };

// Hook that runs when the component is mounted
onMounted(() => {
  // Smooth scroll to top when the page loads
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

  </script>

<style>
/* Add page transition animations */
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