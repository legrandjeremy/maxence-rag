<template>
  <div class="q-mb-md row items-center">
      <q-input class="col" v-model="modelValueProxy" debounce="300" filled dense clearable :label="$t('common.input_filtered')" v-bind="$attrs">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn v-if="showAddButton" label="Add New" icon="add" color="primary" class="q-ml-md" @click="$emit('addRecord')" :disable="editMode" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    modelValue: string | number | null | undefined,
    editMode?: boolean,
    showAddButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  showAddButton: true
});

const emit = defineEmits(['update:modelValue', 'addRecord']);

const modelValueProxy = computed({
  get: () => props.modelValue,
  set: (val: string | number | null | undefined) => emit('update:modelValue', val)
});
</script>
