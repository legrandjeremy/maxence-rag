import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
import { defineBoot } from '#q-app/wrappers'
import { Cookies } from 'quasar'

export default defineBoot(({ app }) => {
  // Determine default locale from cookie or browser
  let initialLocale = Cookies.get('locale') as string || null
  if (!initialLocale) {
    initialLocale = 'fr-FR'
  }

  const i18n = createI18n({
    locale: initialLocale,
    legacy: false,
    messages
  })

  app.use(i18n)
});
