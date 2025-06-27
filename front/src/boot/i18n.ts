import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
import { defineBoot } from '#q-app/wrappers'

export default defineBoot(({ app }) => {
  // Create I18n instance
  const i18n = createI18n({
    locale: 'en-US',
    legacy: false, // comment this out if not using Composition API
    messages
  })

  // Tell app to use the I18n instance
  app.use(i18n)
});
