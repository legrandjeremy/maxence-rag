<template>
    <div>
        <q-input v-if="editMode" v-model="modelValueProxy" v-bind="$attrs" outlined clearable dense>
            <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="formattedDate" :mask="dateFormat" v-bind="$attrs">
                            <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                        </q-date>
                    </q-popup-proxy>
                </q-icon>
            </template>
        </q-input>
        <span v-else>{{ displayValueProxy }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { date } from "quasar";

interface Props {
    modelValue: string | number | Date | null | undefined,
    editMode?: boolean,
    displayValue?: string | number | Date | null | undefined,
    dateFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
    editMode: false,
    dateFormat: 'DD/MM/YYYY',
    displayValue: null
});

const displayValueRef = ref<string | number | Date | null | undefined>(props.displayValue ?? null);

const emit = defineEmits(['update:modelValue']);

const modelValueProxy = computed({
    get: () => props.modelValue
        ? date.formatDate(props.modelValue, props.dateFormat)
        : '',
    set: (val: string | number | Date | null | undefined) => emit('update:modelValue', val)
});

const displayValueProxy = computed(() => {
    return displayValueRef.value
        ? date.formatDate(displayValueRef.value, props.dateFormat)
        : props.modelValue
            ? date.formatDate(props.modelValue, props.dateFormat)
            : props.modelValue;
})

const formattedDate = ref<string>(
    props.modelValue
        ? date.formatDate(props.modelValue, props.dateFormat)
        : ''
);

// Watch for changes from parent and update formattedDate
watch(
    () => props.modelValue,
    (newVal) => {
        formattedDate.value = newVal
            ? date.formatDate(newVal, props.dateFormat)
            : '';
    }
);

// Watch for changes in formattedDate and emit ISO string
watch(formattedDate, (newDateValue) => {
    if (!newDateValue) {
        emit("update:modelValue", null);
        return;
    }
    const newDate = date.extractDate(newDateValue, props.dateFormat);
    emit("update:modelValue", newDate ? newDate.toUTCString() : null);
});
</script>