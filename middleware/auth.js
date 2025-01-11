export default defineNuxtRouteMiddleware((to, from) => {
    const { session } = useAuth();
  
    if (!session.value?.user && to.path !== '/login') {
      return navigateTo('/login');
    }
  });
  