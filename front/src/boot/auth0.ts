import { defineBoot } from '#q-app/wrappers'
import { type Auth0VueClient, createAuth0 } from '@auth0/auth0-vue'
import { useAuthStore } from 'src/stores/authStore'
import { watch } from 'vue'
import { Loading } from 'quasar'
import Api from 'src/services/api'
import UserHelper from 'src/utils/UserHelper'

declare module 'vue' {
  interface ComponentCustomProperties {
    $auth0: Auth0VueClient
  }
}

const mergedScopes = [
  ...Api.SCOPES,
]

const auth0Client = createAuth0({
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: window.location.origin + '/callback',
    audience: 'https://defi.maijin',
    scope: mergedScopes.join(' ')
  },
  cacheLocation: 'localstorage'
})

export default defineBoot(async ({ app }) => {
  app.config.globalProperties.$auth0 = auth0Client
  app.use(auth0Client)

  Loading.show({
    message: '... mAIjin Defi - Secure Loading ...',
    customClass: 'loader-bg'
  })

  const authStore = useAuthStore()

  await new Promise((resolve) => {
    const stopWatching = watch(
      () => auth0Client.isLoading.value,
      async (isLoading) => {
        if (!isLoading) {
          stopWatching()
          Loading.hide()

          authStore.setReady()

          if (auth0Client.isAuthenticated.value) {
            try {
              const accessToken = await auth0Client.getAccessTokenSilently()
              const userHelper = new UserHelper(accessToken)
              const customEmail = userHelper.getEmail()
              const appMetadata = userHelper.getAppMetadata() ?? {}
              
              authStore.setData(accessToken, auth0Client.user.value, customEmail, appMetadata)
            } catch (error) {
              console.error('Auth0 token error:', error)
                
              // Log out the use to manage the token expiration (also new scopes implemented)
              await auth0Client.logout({
                logoutParams: {
                  returnTo: window.location.origin,
                },
              })
            }
            
          }
          resolve(true)
        }
      },
      { immediate: true }
    )
  })
})
