<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <h1 class="text-h3 q-mb-md">Maxence Chat</h1>
      
      <!-- Player Management Navigation Test -->
      <div v-if="authStore.hasAccessToPlayerManagement" class="q-mt-lg">
        <div class="q-gutter-md">
          <q-btn 
            v-if="authStore.hasPlayerManagementAdminAccess"
            color="secondary" 
            label="Chat"
            @click="$router.push('/chat')"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()
</script>
