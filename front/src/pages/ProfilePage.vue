<template>
  <q-page padding>
    <q-card v-if="authStore.user" class="q-mt-md text-center">
      <q-card-section>
        <div class="text-h6">Welcome {{ authStore.displayName }}</div>

        <div v-if="loading">
          Loading...
        </div>

        <div class="q-mt-md text-left" v-if="authStore.hasRole(ROLE_DR__NATIONAL_FEDERATION_STAFF__ADMIN) && !loading">
          
          You are connected as a Federation Staff Member for <country-flag :country="countryFlagValue" size="large" class="q-mr-xs q-mb-xs" style="vertical-align: bottom;" /> {{ countryIoc }} - {{ countryName }}<br /><br />

          The UCI is currently developing its new DataRide system, which will introduce in the coming months several features aimed at enhancing both internal and external processes, as well as overall operational efficiency.<br /><br />

          The first release is the new Rider & Staff Registration module, replacing the old UCI RegOnline platform. This will allow you to register your riders and staff for UCI competitions in a more streamlined way.<br /><br />

          The first events using this module will be:<br /><br />

          <strong>
          - UCI BMX Racing World Championships - Challenge & Masters (Registration: 23 June to 7 July 2025)<br /><br />
          - UCI Trials World Youth Games (Registration: 4 to 17 July 2025)<br /><br />
        </strong>

          Please note that this is the first version of the new system. Enhancements and visual improvements will be introduced progressively.<br /><br />

          Thank you for your understanding, and we hope you have a smooth registration experience.<br /><br />

          mAIjin Defi v2 Project Team<br /><br />

          <q-btn
            class="q-mt-md"
            color="primary"
            label="RegOnline"
            @click="router.push('/regonline')"
          />

          <br /><br />

          <q-btn
            class="q-mt-md"
            color="primary"
            label="Competition Requests"
            @click="router.push('/competition-requests')"
          />
        </div>

        <div class="q-mt-md" style="margin-top: 300px">
          <q-btn 
            color="primary" 
            :label="showDebug ? 'Hide Debug Info' : 'Show Debug Info'"
            @click="showDebug = !showDebug" 
            icon-right="bug_report"
            size="sm"
          />
        </div>
      </q-card-section>
    </q-card>
    <div v-if="showDebug" class="q-mt-ml">
      <div class="text-h6">DEBUG Informations</div>
      <div>RAW Token: {{ authStore.token }}</div>
      <br />
      <div>User Email: {{ authStore.userEmail }}</div>
      <br />User Scopes from the roles From Auth0 :<br />
      <pre>
      {{ authStore.userScopes }}
      </pre>
                <br />App Metadata from Auth0 :<br />
      <pre>
      {{ authStore.appMetadata }}
      </pre>
    </div>
  </q-page>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from '../stores/authStore'
  import { ROLE_DR__NATIONAL_FEDERATION_STAFF__ADMIN } from '@uci-tech/uci-users'
  import Clarity from '@microsoft/clarity'
  import { useRouter } from 'vue-router'
  import CountryFlag from 'vue-country-flag-next'

  const authStore = useAuthStore()
  const showDebug = ref(false)
  const router = useRouter()

  const countryFlagValue = ref('FRA3')
  const countryName = ref('France3')
  const countryIoc = ref('FRA2')
  const loading = ref(true)

  
  onMounted(() => {
    Clarity.identify(authStore.userEmail)

    loading.value = false
  })
</script>
