<template>
  <div>
    <q-btn v-if="!isAuthenticated" @click="btnLogin" color="positive" :label="$t('auth.login')" />
    <q-btn v-else @click="btnLogout" color="negative" :label="$t('auth.logout')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'

const auth0 = useAuth0()

const btnLogin = async () => {
  await auth0.loginWithRedirect()
}

const btnLogout = async () => {
  await auth0.logout({
    logoutParams: {
      returnTo: window.location.origin,
    },
  })
}

const isAuthenticated = computed(() => auth0.isAuthenticated.value)
</script>
