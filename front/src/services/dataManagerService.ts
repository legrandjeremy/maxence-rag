import type { Ref } from 'vue';
import { Dialog } from 'quasar';
import { computed, ref } from 'vue';
import { filterRowsBySearchText } from 'src/utils/searchUtils';
import { type ListOption } from 'src/dtos/ListOption'
import { type ServiceResponseDto } from 'src/dtos/ResponseDto';

export interface DataServiceOptions<T> {
    entityName?: string;
    requiredFields?: (keyof T)[];
    uniqueField?: keyof T;
    defaultValues?: Partial<T>;
    idField?: keyof T;
    search?: Ref<string, string>;
    loading?: Ref<boolean>;
    addRecordFunction?: (newRecord: T) => Promise<unknown>;
    editRecordFunction?: (record: T) => Promise<unknown>;
    deleteRecordFunction?: (record: T) => Promise<unknown>;
}

export type EditableRow<T> = T & { _edit?: boolean; _original?: Partial<T> };

export function getListOptions<T>(options: T[],
    labelFunction: (type: T) => string,
    valueFunction: (type: T) => string | number | null,
    displayValueFunction?: (type: T) => string | number | null,
    filterValueFunction?: (type: T) => string | number | null,
    additionalItems?: ListOption[],
): ListOption[] {
    const response = options || [];

    return [
        ...(additionalItems ?? []),
        ...response.map(type => ({
            label: labelFunction(type),
            value: valueFunction(type),
            displayValue: displayValueFunction ? displayValueFunction(type) : null, 
            filterValue: filterValueFunction ? filterValueFunction(type) : null, 
        }))
    ];
}

export function dataManagerService<T>(rows: Ref<EditableRow<T>[] | undefined>, options: DataServiceOptions<T> = {}) {
    const {
        entityName: entityName = 'Record',
        requiredFields = [],
        uniqueField = 'Id' as keyof T,
        defaultValues = {},
        idField = 'Id' as keyof T,
        search = ref(''),
        loading = ref(false),
        addRecordFunction,
        editRecordFunction,
        deleteRecordFunction
    } = options;

    const isEdit = computed(() => (rows.value ?? []).some(row => row?._edit));
    let isNew = false;
    let isDelete = false;

    const filteredRows = computed(() => {
        const dataToFilter = (rows.value ?? []) as Record<string, unknown>[];
        return filterRowsBySearchText(dataToFilter, search.value) as EditableRow<T>[];
    });

    function addRecord() {
        let maxId = 0;
        const currentRows = rows.value ?? [];

        // Determine if idField should be set (number and not null)
        let shouldSetId = false;
        if (idField && currentRows.length > 0) {
            // Find the first non-null idField value to check its type
            const firstNonNullId = currentRows.find(r => r[idField] !== null && r[idField] !== undefined)?.[idField];
            if (typeof firstNonNullId === 'number') {
                maxId = Math.max(0, ...currentRows.map(r => Number(r[idField]) || 0));
                shouldSetId = true;
            }
        }

        const newRow: EditableRow<T> = {
            ...defaultValues,
            ...(shouldSetId ? { [idField]: (maxId + 1) as T[keyof T] } : {}),
            _edit: true,
        } as EditableRow<T>;

        rows.value = [newRow, ...(rows.value ?? [])];
        isNew = true;
    }

    function editRecord(row: EditableRow<T>) {
        const { ...originalData } = row;
        row._original = originalData as Partial<T>;
        row._edit = true;
    }

    function deleteRecord(rowToDelete: EditableRow<T>) {
        Dialog.create({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
            cancel: true,
            persistent: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
        }).onOk(async () => {

            try {
                loading.value = true;
                const currentRows = rows.value ?? [];
                const index = currentRows.findIndex(r => r === rowToDelete);

                if (index === -1) {
                    console.error(`${entityName} not found for deletion.`);
                    return;
                }

                if (deleteRecordFunction) {
                    try {

                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { _edit, _original, ...recordToDeleteClean } = rowToDelete;
                        const response = await deleteRecordFunction(recordToDeleteClean as T) as ServiceResponseDto<T>;
                        if (response.ok === false) {
                            throw new Error(response.error);
                        }

                        const updatedRows = [...currentRows];
                        updatedRows.splice(index, 1);
                        rows.value = updatedRows;
                        Dialog.create({ message: `${entityName} deleted successfully.`, ok: true });
                        isDelete = true;
                    } catch (error) {
                        Dialog.create({ title: 'Error', message: `${String(error)}`, ok: true });
                        isDelete = false;
                    }
                } else {
                    const updatedRows = [...currentRows];
                    updatedRows.splice(index, 1);
                    rows.value = updatedRows;
                    Dialog.create({ message: `${entityName} removed locally.`, ok: true });
                }
            } catch (error) {
                console.error('Error deleting record:', error);
                Dialog.create({ title: 'Error', message: `${String(error)}`, ok: true });
                loading.value = false;

            }
        });
    }

    async function saveRecord(row: EditableRow<T>) {

        try {
            loading.value = true;

            for (const field of requiredFields) {
                if (!row[field] && row[field] !== 0) {
                    Dialog.create({
                        title: 'Validation Error',
                        message: `${String(field)} is a mandatory field.`,
                        ok: true,
                    });
                    loading.value = false;
                    return;
                }
            }

            if (uniqueField && row[uniqueField]) {
                const isDuplicate = (rows.value ?? []).some(
                    r => r !== row && r[uniqueField] === row[uniqueField]
                );
                if (isDuplicate) {
                    Dialog.create({
                        title: 'Validation Error',
                        message: `${String(uniqueField)} must be unique. Value '${String(row[uniqueField])}' already exists.`,
                        ok: true,
                    });
                    loading.value = false;
                    return;
                }
            }

            if (isNew && addRecordFunction) {
                try {
                    const { ...recordToSave } = row;
                    const response = await addRecordFunction(recordToSave as T) as ServiceResponseDto<T>;
                    if (response.ok === false) {
                       throw new Error(response.error);
                    }

                    delete row._original;
                    Dialog.create({ message: `${entityName} added successfully.`, ok: true });
                } catch (error) {
                    Dialog.create({ title: 'Error', message: `${String(error)}`, ok: true });
                    loading.value = false;
                    return;
                }
            }
            else if (editRecordFunction) {
                {
                    try {
                        const { ...recordToSave } = row;
                        const response = await editRecordFunction(recordToSave as T) as ServiceResponseDto<T>;

                        console.log('Response from editRecordFunction:', response);

                        if (response.ok === false) {
                            throw new Error(response.error);
                        }

                        delete row._original;
                        Dialog.create({ message: `${entityName} saved successfully.`, ok: true });
                    } catch (error) {
                        Dialog.create({ title: 'Error', message: `${String(error)}`, ok: true });
                        loading.value = false;
                        return;
                    }
                }
            }
            else {
                delete row._original;
                Dialog.create({ message: `${entityName} saved locally.`, ok: true });
            }

            row._edit = false;
            loading.value = false;
        } catch (error) {
            console.error('Error saving record:', error);
            Dialog.create({ title: 'Error', message: `${String(error)}`, ok: true });
            loading.value = false;
        }
    }

    function cancelEdit(row: EditableRow<T>) {
        try {
            loading.value = true;
            const isNewRow = !row._original;
            let hasChanges = false;

            if (!isNewRow && row._original) {

                hasChanges = Object.keys(row).some(key => {
                    if (key === '_edit' || key === '_original' || typeof row[key as keyof T] === 'function') {
                        loading.value = false;
                        return false;
                    }

                    try {
                        loading.value = false;
                        return JSON.stringify(row[key as keyof T]) !== JSON.stringify(row._original?.[key as keyof T]);
                    } catch (e) {

                        console.warn('Stringify failed for key:', key, 'Error:', e);
                        loading.value = false;
                        return row[key as keyof T] !== row._original?.[key as keyof T];
                    }
                });
            }

            if (isNewRow || hasChanges) {
                Dialog.create({
                    title: isNewRow ? `Cancel New ${entityName}?` : 'Discard Changes?',
                    message: isNewRow
                        ? `Are you sure you want to discard this new ${entityName.toLowerCase()}?`
                        : 'Are you sure you want to discard your changes?',
                    cancel: true,
                    persistent: true,
                }).onOk(() => {
                    const currentRows = rows.value ?? [];
                    if (isNewRow) {

                        const index = currentRows.findIndex(r => r === row);
                        if (index !== -1) {
                            const updatedRows = [...currentRows];
                            updatedRows.splice(index, 1);
                            rows.value = updatedRows;
                        }
                    } else if (row._original) {

                        Object.assign(row, row._original);
                        delete row._original;
                        row._edit = false;
                    }

                }).onCancel(() => {
                    // Optional: Handle the case where the user cancels the dialog (clicks Cancel)
                    // console.log("Cancellation dialog was cancelled.");
                });
            } else {
                if (row._original) {
                    delete row._original;
                }
                row._edit = false;
            }
            loading.value = false;
        } catch (error) {
            console.error('Error managing row:', error);
            Dialog.create({ title: 'Error', message: `Failed to manage row: ${String(error)}`, ok: true });
            loading.value = false;
        }
    }

    return {
        addRecord,
        editRecord,
        deleteRecord,
        saveRecord,
        cancelEdit,
        isNew,
        isEdit,
        isDelete,
        filteredRows
    };
}
