<template>
    <div>
        <q-input v-if="editMode" v-model="modelValueProxy" v-bind="$attrs" outlined dense />
        <span v-else>{{ displayValue ?? modelValueProxy }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    modelValue: string | number | null | undefined,
    editMode?: boolean,
    displayValue?: string | number | null | undefined
}

const props = withDefaults(defineProps<Props>(), {
    editMode: false
});

const emit = defineEmits(['update:modelValue']);

const modelValueProxy = computed({
    get: () => props.modelValue,
    set: (val: string | number | null | undefined) => emit('update:modelValue', val)
});

</script>