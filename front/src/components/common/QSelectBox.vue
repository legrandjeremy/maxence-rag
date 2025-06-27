<template>
    <div>
        <q-select v-if="editMode" v-model="modelValueProxy" :options="filteredAndSortedOptions" clearable emit-value
            v-bind="$attrs" use-input input-debounce="300" @update:model-value="handleChange"
            @filter="filterHandler">
            <template v-slot:no-option>
                <q-item>
                    <q-item-section class="text-grey">No results</q-item-section>
                </q-item>
            </template>
        </q-select>
        <span v-else>{{ displayValueProxy }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { type ListOption } from 'src/dtos/ListOption';

interface Props {
    modelValue?: string | number | null | undefined
    editMode?: boolean
    displayValue?: string | number | null | undefined
    defaultSort?: boolean
    options?: ListOption[]
    handleChange?: (value: string | number | null) => void
    handleFilter?: (option: ListOption, filter: string) => boolean
    sortFunction?: (a: ListOption, b: ListOption) => number
}

const props = withDefaults(defineProps<Props>(), {
    editMode: false,
    displayValue: null,
    defaultSort: true,
    options: () => [],
    handleChange: () => { },
    handleFilter: (option: ListOption, filter: string) =>
        option.label.toLowerCase().includes(filter.toLowerCase()),
    sortFunction: (a: ListOption, b: ListOption) => a.label.localeCompare(b.label)
})

const filterValue = ref('');
const displayValueRef = ref<string | number | null | undefined>(props.displayValue ?? null);

const filteredAndSortedOptions = computed(() => {
    const sorted = props.defaultSort ? [...props.options].sort(props.sortFunction) : [...props.options];
    if (!filterValue.value) return sorted
    return sorted.filter(option =>
        props.handleFilter(option, filterValue.value)
    )
})

const filterHandler = (val: string, update: (fn: () => void) => void) => {
    update(() => {
        filterValue.value = val
    })
}

const emit = defineEmits(['update:modelValue'])

const modelValueProxy = computed({
    get: () => props.modelValue,
    set: (val: string | number | null) => {
        emit('update:modelValue', val);
        displayValueRef.value = props.options.find(option => option.value === val)?.displayValue
            ?? props.displayValue
            ?? props.options.find(option => option.value === val)?.label
            ?? props.options.find(option => option.value === val)?.value
            ?? null;
    }
});

const displayValueProxy = computed(() => {
    return displayValueRef.value
        ?? props.options.find(option => option.value === props.modelValue)?.displayValue
        ?? props.displayValue
        ?? props.options.find(option => option.value === props.modelValue)?.label
        ?? props.options.find(option => option.value === props.modelValue)?.value
        ?? null;
})

const handleChange = (val: string | number | null) => {
    props.handleChange?.(val);
}
</script>