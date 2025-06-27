<template>
  <div>
    <q-toggle v-if="editMode" v-model="modelValueProxy" v-bind="$attrs" dense />
    <q-chip v-else :color="chipColor" text-color="white" size="sm" v-bind="$attrs">
      {{ chipLabel }}
    </q-chip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean | null | undefined
  editMode?: boolean
  invert?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  invert: false,
  modelValue: null
})

const emit = defineEmits(['update:modelValue'])

const modelValueProxy = computed({
  get: () => props.modelValue ?? false,
  set: val => emit('update:modelValue', val)
})

const chipColor = computed(() =>
  (props.modelValue ? !props.invert : props.invert) ? 'green' : 'red'
)

const chipLabel = computed(() => (props.modelValue ? 'Yes' : 'No'))
</script>
