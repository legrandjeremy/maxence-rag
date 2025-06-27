<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn v-if="authStore.isSignedIn" flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>Maxence Chat</q-toolbar-title>

        <q-select
          v-model="locale"
          :options="localeOptions"
          dense
          emit-value
          map-options
          style="min-width: 100px"
          class="q-mr-md"
        />

        <q-tooltip v-if="authStore.isSignedIn" anchor="bottom middle" self="top middle">
          {{ authStore.userEmail }}
        </q-tooltip>
        <q-icon v-if="authStore.isSignedIn" name="person" class="q-mr-sm" @click="router.push('/profile')" style="cursor: pointer;" />

        <AuthButton />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header> Menu </q-item-label>

        <!-- Player Management Dashboard -->
        <q-item v-if="authStore.hasPlayerManagementAdminAccess"
          clickable
          @click="$router.push('/player-dashboard')"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('menu.player_management.dashboard.title') }}</q-item-label>
            <q-item-label caption>
              {{ $t('menu.player_management.dashboard.caption') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Team Manager Dashboard -->
        <q-item v-if="authStore.hasPlayerManagementTeamManagerAccess"
          clickable
          @click="$router.push('/team-manager/dashboard')"
        >
          <q-item-section avatar>
            <q-icon name="supervisor_account" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t('teamManager.dashboard.title') }}</q-item-label>
            <q-item-label caption>
              {{ $t('teamManager.dashboard.subtitle') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- AI Assistant Chat -->
        <q-item v-if="authStore.hasAccessToPlayerManagement"
          clickable
          @click="$router.push('/chat')"
        >
          <q-item-section avatar>
            <q-icon name="smart_toy" />
          </q-item-section>
          <q-item-section>
            <q-item-label>AI Assistant</q-item-label>
            <q-item-label caption>
              Chat with intelligent RAG-powered assistant
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Player Management Admin Section -->
        <q-expansion-item
          v-if="authStore.hasPlayerManagementAdminAccess"
          icon="admin_panel_settings"
          :label="$t('menu.player_management.admin.title')"
          :caption="$t('menu.player_management.admin.caption')"
          clickable
        >
          <q-item
            clickable
            @click="$router.push('/admin/companies')"
          >
            <q-item-section avatar>
              <q-icon name="business" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('menu.player_management.companies.title') }}</q-item-label>
              <q-item-label caption>
                {{ $t('menu.player_management.companies.caption') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            @click="$router.push('/admin/campaigns')"
          >
            <q-item-section avatar>
              <q-icon name="campaign" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('menu.player_management.campaigns.title') }}</q-item-label>
              <q-item-label caption>
                {{ $t('menu.player_management.campaigns.caption') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            @click="$router.push('/admin/lessons')"
          >
            <q-item-section avatar>
              <q-icon name="school" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('menu.player_management.lessons.title') }}</q-item-label>
              <q-item-label caption>
                {{ $t('menu.player_management.lessons.caption') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item
            clickable
            @click="$router.push('/admin/teams')"
          >
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('menu.player_management.teams.title') }}</q-item-label>
              <q-item-label caption>
                {{ $t('menu.player_management.teams.caption') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          
          <q-item v-if="authStore.hasPlayerManagementAdminAccess"
            clickable
            @click="$router.push('/admin/users')"
          >
            <q-item-section
              avatar
            >
              <q-icon name="person" />
            </q-item-section>

            <q-item-section>
              <q-item-label> {{ $t('menu.player_management.users.title') }} </q-item-label>
              <q-item-label caption>
                {{ $t('menu.player_management.users.caption') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>

        
      </q-list>
      <div class="absolute-bottom q-pa-md">
        <q-item>
          <q-item-section>
            <q-item-label>{{ $t('darkMode') || 'Dark Mode' }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="isDark" @update:model-value="toggleDarkMode" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Version {{ version }}</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import AuthButton from 'components/AuthButton.vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import Clarity from '@microsoft/clarity'
import { useI18n } from 'vue-i18n'
import { version } from 'src/config/version'

const projectId = process.env.CLARITY_ID || ''
Clarity.init(projectId)

const authStore = useAuthStore()
const router = useRouter()

const $q = useQuasar()
const isDark = ref(false)

// Function to toggle dark mode
function toggleDarkMode(value: boolean) {
  $q.dark.set(value)
  $q.cookies.set('darkMode', value ? 'true' : 'false', { expires: 365, domain: 'localhost', path:'/' })
}

// Initialize dark mode from cookie on component mount
onMounted(() => {
  const savedDarkMode = $q.cookies.get('darkMode')
  if (savedDarkMode) {
    isDark.value = savedDarkMode === 'true'
    $q.dark.set(isDark.value)
  }
})

const { locale } = useI18n({ useScope: 'global' })

// Watch for changes to the locale and save it to a cookie
watch(locale, (newLocale: string) => {
  $q.cookies.set('locale', newLocale, { expires: 365, domain: 'localhost', path:'/' }); // Save for 1 year
});

if ($q.cookies.has('locale')) {
  locale.value = $q.cookies.get('locale')
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const localeOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'fr-FR', label: 'French' }
]
</script>

<style>
.loader-bg {
  background-color: #1976d2 !important;
}

body.body--dark {
  --q-primary: #1976d2;
  --q-secondary: #26a69a;
  --q-accent: #9c27b0;
  --q-positive: #21ba45;
  --q-negative: #c10015;
  --q-info: #31ccec;
  --q-warning: #f2c037;
}
</style>
