import { defineBoot } from '#q-app/wrappers'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli-vite/boot-files
export default defineBoot(({ app }) => {
  // register <QuillEditor> globally
  app.component('QuillEditor', QuillEditor)
})
