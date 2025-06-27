import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type User } from '@auth0/auth0-vue'
import { type UserMetaData } from '@uci-tech/uci-users'

// Player Management scopes
const PLAYER_MANAGEMENT_ADMIN_SCOPE = 'maijin-defi-challenge:admin'
const PLAYER_MANAGEMENT_TEAM_MANAGER_SCOPE = 'maijin-defi-challenge:team-manager'
const PLAYER_MANAGEMENT_USER_SCOPE = 'maijin-defi-challenge:user'

interface Role {
  role: string
  details: {
    name: string
    countryId?: string
    countryCode?: string
  }
}

interface AppMetadata {
  roles: Role[]
  displayName: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isSignedIn = ref(false)
  const isReady = ref(false)
  const userScopes = ref<string[]>([])
  const user = ref<User | undefined>(undefined)
  const userEmail = ref('')
  const appMetadata = ref<AppMetadata>({
    roles: [],
    displayName: ''
  })

  const setReady = () => {
    isReady.value = true
  }

  const setData = (accessToken: string, userObject: User | undefined, email: string, metadata?: UserMetaData) => {
    try {
      userEmail.value = email
      user.value = userObject
      isSignedIn.value = true
      token.value = accessToken
      if (metadata) {
        appMetadata.value = metadata as unknown as AppMetadata
      }
      const splittedAccessToken = accessToken.split('.')[1] ?? ''
      const payload = JSON.parse(atob(splittedAccessToken))
      userScopes.value = payload.scope ? payload.scope.split(' ') : []
    } catch (error) {
      console.error('Failed to fetch Auth0 token:', error)
    }
  }

  async function waitUntilReady() {
    while (!isReady.value) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const hasAccessToPlayerManagement = computed(() => {
    return userHasSpecificScope(PLAYER_MANAGEMENT_ADMIN_SCOPE) ||
           userHasSpecificScope(PLAYER_MANAGEMENT_TEAM_MANAGER_SCOPE) ||
           userHasSpecificScope(PLAYER_MANAGEMENT_USER_SCOPE)
  })

  const hasPlayerManagementAdminAccess = computed(() => {
    return userHasSpecificScope(PLAYER_MANAGEMENT_ADMIN_SCOPE)
  })

  const hasPlayerManagementTeamManagerAccess = computed(() => {
    return userHasSpecificScope(PLAYER_MANAGEMENT_TEAM_MANAGER_SCOPE) ||
           userHasSpecificScope(PLAYER_MANAGEMENT_ADMIN_SCOPE)
  })

  const userHasSpecificScope = (scopeToCheck: string) => {
    return userScopes.value.some(scope => scope === scopeToCheck)
  }

  const displayName = computed(() => {
    return appMetadata.value.displayName ?? ''
  })

  const hasRole = (role: string) => {
    return appMetadata.value.roles ? appMetadata.value.roles.some(r => r.role === role) : false
  }

  const getCountryIdForRole = (role: string) => {
    if (appMetadata.value.roles) {
      return appMetadata.value.roles.find(r => r.role === role)?.details.countryId ?? ''
    }
    return ''
  }

  return {
    userEmail,
    user,
    isSignedIn,
    isReady,
    token,
    userScopes,
    displayName,
    appMetadata,
    getCountryIdForRole,
    hasRole,
    setData,
    setReady,
    waitUntilReady,
    userHasSpecificScope,
    hasAccessToPlayerManagement,
    hasPlayerManagementAdminAccess,
    hasPlayerManagementTeamManagerAccess
  }
})
