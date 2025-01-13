<script setup lang="ts">

const { status, data } = useAuth()

definePageMeta({
    middleware: ["auth"],
});

onMounted(() => {
    console.log(data.value["user"])
})

</script>

<template>
    <div class="pt-40">dashboard
    </div>
</template>