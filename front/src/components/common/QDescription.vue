<template>
  <div>
    <div class="row items-center no-wrap">
      <span>
        <template v-if="typeof modelValue === 'string'">
          {{ modelValue.length > 60 ? modelValue.slice(0, 40) + '...' : modelValue }}
        </template>
        <template v-else>
          {{ modelValue || '' }}
        </template>
      </span>
      <q-btn v-if="!editMode && modelValue" flat dense icon="visibility" size="sm" class="q-ml-xs"
        @click="showDialog" />
      <q-icon v-if="editMode" name="edit" size="20px" class="q-ml-xs cursor-pointer" color="primary"
        @click="showDialog" />
      <q-icon v-if="editMode && modelValue" name="cancel" size="20px" class="q-ml-xs cursor-pointer" color="negative"
        @click.stop="clearValue" />
    </div>
    <q-dialog v-model="dialogProxy" transition-show="flip-down" transition-hide="flip-up">
      <q-card style="min-width: 500px; max-width: 90vw;">
        <q-bar>
          <div class="text-h6">Description</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section>
          <div v-if="!editMode" style="white-space: pre-line; min-width: 400px; min-height: 180px;">
            {{ modelValue || '' }}
          </div>
          <q-input v-else v-model="inputProxy" type="textarea" autogrow filled label="Description"
            placeholder="Enter description here..." style="min-width: 400px; min-height: 180px;" v-bind="$attrs" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Clear" color="negative" @click="clearValue" />
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  modelValue: string | number | null | undefined
  editMode?: boolean
  dialog?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  dialog: false
})

const emit = defineEmits(['update:modelValue', 'update:dialog'])

const dialogProxy = computed({
  get: () => props.dialog ?? false,
  set: (val: boolean) => emit('update:dialog', val)
})

const inputProxy = ref(props.modelValue)

watch(
  () => props.modelValue,
  val => { inputProxy.value = val }
)

watch(
  () => props.dialog,
  val => { if (val) inputProxy.value = props.modelValue }
)

watch(
  inputProxy,
  val => { if (props.editMode) emit('update:modelValue', val) }
)

function showDialog() {
  dialogProxy.value = true
}

function clearValue() {
  emit('update:modelValue', '')
}
</script>
