<template>
    <section class="space-y-6">
        <PageHeader
            title="Tag Registration"
            description="Capture new RFID tags."
            tagline="Log"
        />

        <FormRoot @submit="onSubmit">
            <FormSection
                title="Tag Info"
                subtitle="Identitas tag"
                variant="card"
            >
                <FormGrid>
                    <TextField
                        name="epc"
                        label="EPC"
                        required
                        field-id="epc"
                        placeholder="Enter EPC"
                    />
                    <span
                        v-if="fieldErrors['epc']"
                        class="text-red-500 text-sm"
                        >{{ fieldErrors["epc"] }}</span
                    >
                    <SelectField
                        name="tagType"
                        label="Tag Type"
                        required
                        field-id="tagType"
                        placeholder="Select type"
                        :options="tagTypeOptions"
                    />
                    <SelectField
                        v-if="companyOptions.length > 1"
                        name="companyId"
                        label="Company"
                        required
                        field-id="companyId"
                        placeholder="Select company"
                        :options="companyOptions"
                    />
                </FormGrid>
            </FormSection>

            <FormSection
                title="Item Info"
                subtitle="Detail item terkait"
                description="Gunakan informasi ini untuk track lokasi."
                variant="card"
            >
                <FormGrid>
                    <SelectField
                        name="productId"
                        label="Product"
                        required
                        field-id="productId"
                        placeholder="Select product"
                        :options="productOptions"
                    />
                    <TextField
                        name="location"
                        label="Location"
                        field-id="location"
                        hint="Optional storage location"
                        placeholder="Warehouse aisle"
                    />
                    <TextareaField
                        name="notes"
                        label="Notes"
                        full
                        field-id="notes"
                        placeholder="Short memo"
                    />
                </FormGrid>
            </FormSection>

            <FormActions>
                <Button variant="outline" type="button" @click="resetForm()"
                    >Reset</Button
                >
                <Button
                    type="submit"
                    :loading="isSubmitting"
                    :disabled="isSubmitting || !meta.valid"
                    >Simpan</Button
                >
            </FormActions>
        </FormRoot>
        <div v-if="submitError" class="mt-2 text-sm text-rose-600">
            {{ submitError }}
        </div>

        <Card no-padding>
            <div class="px-6 py-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900">
                            Registered Tags
                        </h3>
                    </div>
                    <div
                        class="flex flex-wrap items-end justify-end gap-3 flex-1"
                    >
                        <Input
                            v-model="tagSearch"
                            placeholder="Search by EPC"
                            class="w-full max-w-xs"
                        >
                            <template #icon>
                                <Icon :icon="Search" :size="16" />
                            </template>
                        </Input>
                        <div class="flex items-center gap-2">
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                @click="handleTagSearch"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                        </div>
                    </div>
                </div>
                <p
                    v-if="tagsError && !tagsLoading"
                    class="text-xs text-rose-600 mt-4"
                >
                    {{ tagsError }}
                </p>
            </div>

            <div v-if="tagsLoading" class="px-6 pb-5">
                <LoadingState />
            </div>

            <div v-else-if="!displayTags.length" class="px-6 pb-5">
                <EmptyState :variant="tagEmptyStateVariant" />
            </div>

            <div v-else>
                <AppTable
                    :columns="tagColumns"
                    :rows="displayTags"
                    class="border-none shadow-none rounded-none"
                />
                <div class="border-t border-gray-200 px-6 py-4">
                    <Pagination
                        :page="pagination.page"
                        :page-size="pagination.limit"
                        :total="pagination.total"
                        :page-size-options="pageSizeOptions"
                        @update:page="setPage"
                        @update:page-size="setLimit"
                    />
                </div>
            </div>
        </Card>
    </section>
</template>

<script setup lang="ts">
import Button from "@/components/atoms/Button.vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import AppTable from "@/components/organisms/Table.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search, RefreshCw } from "lucide-vue-next";
import {
    FormRoot,
    FormSection,
    FormGrid,
    FormActions,
} from "@/components/ui/form";
import { SelectField, TextField, TextareaField } from "@/components/ui/fields";
import { useTagRegistration } from "../composables/useTagRegistration";

const {
    tagTypeOptions,
    companyOptions,
    productOptions,
    isSubmitting,
    meta,
    fieldErrors,
    submitError,
    onSubmit,
    resetForm,
    tagsLoading,
    tagsError,
    tagSearch,
    tagEmptyStateVariant,
    tagColumns,
    displayTags,
    pagination,
    pageSizeOptions,
    setPage,
    setLimit,
    handleTagSearch,
} = useTagRegistration();
</script>
