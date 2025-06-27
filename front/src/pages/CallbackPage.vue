<template>
    <div class="callback-page">
      <q-spinner color="primary" size="3em" />
      <div>Loading...</div>
    </div>
  </template>

  <script setup lang="ts">
    import { onMounted } from 'vue'
    import { useRouter } from 'vue-router'

    const router = useRouter()

    onMounted(async () => {
        try {
            const target = '/profile'
            await router.push(target)
        } catch (e) {
            console.error('Authentication error:', e)
        }
    });
  </script>
