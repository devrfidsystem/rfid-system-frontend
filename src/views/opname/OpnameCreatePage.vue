<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            tagline="Transactions"
            back-link
            @back="handleBack"
        />

        <InlineAlert
            v-if="error"
            variant="error"
            title="Unable to create opname node"
            :description="error"
        />

        <form @submit.prevent="saveNode">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="md:col-span-1" object-id="wdg_OpnameCreateDetails">
                    <div class="mb-4 border-b border-border pb-3">
                        <ToolbarTitle :title="sectionHeading" />
                    </div>

                    <div class="space-y-4">
                        <div
                            class="rounded-md border border-border bg-surface-secondary px-4 py-3 text-sm text-text"
                        >
                            <div class="font-medium text-text">
                                {{
                                    selectedParent
                                        ? `Parent: ${selectedParent.title}`
                                        : "Root node"
                                }}
                            </div>
                            <div>Warehouse: {{ selectedWarehouseLabel }}</div>
                        </div>

                        <Input
                            v-model="formState.docNumber"
                            label="Opname ID Number"
                            placeholder="OP-0001"
                            required
                            object-id="txt_OpnameCreateDocNumber"
                        />

                        <Input
                            v-model="formState.title"
                            :label="titleLabel"
                            :placeholder="titlePlaceholder"
                            required
                            object-id="txt_OpnameCreateTitle"
                        />

                        <Select
                            v-model="selectedWarehouseId"
                            :options="warehouseOptions"
                            label="Warehouse"
                            placeholder="Select warehouse"
                            required
                            object-id="cmb_OpnameCreateWarehouse"
                        />

                        <Select
                            v-if="mode !== 'group'"
                            v-model="selectedParentId"
                            :options="parentOptions"
                            label="Parent"
                            placeholder="Select parent"
                            required
                            searchable
                            object-id="cmb_OpnameCreateParent"
                        />

                        <Input
                            v-model="formState.notes"
                            label="Notes"
                            placeholder="Add notes"
                            object-id="txt_OpnameCreateNotes"
                        />
                    </div>
                </Card>

                <Card
                    class="md:col-span-2 flex flex-col"
                    no-padding
                    object-id="wdg_OpnameCreateSummary"
                >
                    <div class="border-b border-border px-6 py-5">
                        <ToolbarTitle
                            :title="summaryHeading"
                            description="Review the node details before saving it to the opname branch."
                        />
                    </div>

                    <div class="flex-1 px-6 py-5 space-y-4">
                        <div
                            class="rounded-md border border-border bg-surface-secondary px-4 py-3 text-sm text-text"
                        >
                            <div class="font-medium text-text">
                                Document Number:
                                <span class="font-semibold">
                                    {{ formState.docNumber || "-" }}
                                </span>
                            </div>
                            <div class="mt-1">
                                Title:
                                <span class="font-semibold text-text">
                                    {{ formState.title || "-" }}
                                </span>
                            </div>
                            <div class="mt-1">
                                Type:
                                <span class="font-semibold text-text">
                                    {{ mode }}
                                </span>
                            </div>
                            <div class="mt-1">
                                Parent:
                                <span class="font-semibold text-text">
                                    {{ parentLabel }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        class="mt-auto flex justify-end gap-3 border-t border-border px-6 py-3"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            :disabled="submitting"
                            object-id="btn_OpnameCreateCancel"
                            @click="handleBack"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            :disabled="submitting"
                            object-id="btn_OpnameCreateSubmit"
                        >
                            {{
                                submitting ? "Creating..." : primaryActionLabel
                            }}
                        </Button>
                    </div>
                </Card>
            </div>
        </form>
    </section>
</template>

<script setup lang="ts">
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import { useOpnameCreate } from "./composables/useOpnameCreate";

const {
    error,
    submitting,
    formState,
    mode,
    pageTitle,
    pageDescription,
    sectionHeading,
    summaryHeading,
    titleLabel,
    titlePlaceholder,
    parentLabel,
    primaryActionLabel,
    warehouseOptions,
    parentOptions,
    selectedWarehouseId,
    selectedParentId,
    selectedWarehouseLabel,
    selectedParent,
    handleBack,
    saveNode,
} = useOpnameCreate();
</script>
