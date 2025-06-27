<template>
  <div>
    <q-btn v-if="!editMode" icon="edit" label="Edit" size="sm" flat @click="$emit('edit')" />
    <div v-else class="column items-center q-gutter-y-xs">
      <q-btn v-if="saveEnabled" icon="check" label="Save" size="sm" flat @click="$emit('save')" />
      <q-btn icon="cancel" label="Cancel" size="sm" flat color="warning" @click="$emit('cancel')" />
      <q-btn v-if="deleteEnabled" icon="delete" label="Delete" size="sm" flat color="negative"
        @click="$emit('delete')" />
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  editMode?: boolean,
  saveEnabled?: boolean,
  deleteEnabled?: boolean,
}

withDefaults(defineProps<Props>(), {
  editMode: false,
  saveEnabled: true,
  deleteEnabled: true
});

defineEmits(['edit', 'save', 'cancel', 'delete']);

</script>
