
<script setup lang="ts">
  const router = useRouter();
  const { path } = useRoute();

  const redirectIfPagePathIsInvalid = () => {
  // Replace this "false" your own logic to verify if the path is valid
    const isPathValid = (path) => false;
    if (!isPathValid(path)) {
      router.push({ path: "/404" });
    }
  };
  redirectIfPagePathIsInvalid();
</script>