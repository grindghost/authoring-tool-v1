export default defineNuxtRouteMiddleware((to, from) => {
  const { session, status } = useAuth(); // Use your custom useAuth composable

  // Wait for session loading to complete
  if (status.value === "loading") {
    console.log("Session is loading...");
    return; // Do nothing until the session is resolved
  }

  // Redirect if the user is unauthenticated
  if (status.value === "unauthenticated" && to.path !== "/login") {
    console.log("Redirecting to login...");
    return navigateTo("/login");
  } 

  if (status.value === "authenticated" && to.path == "/login") {
    console.log("Redirecting to dashboard...");
    return navigateTo("/dashboard");
  }

  });
  