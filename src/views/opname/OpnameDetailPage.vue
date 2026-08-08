<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            tagline="Transactions"
            back-link
            @back="handleBack"
        >
            <template #actions>
                <div v-if="selectedNode" class="flex items-center gap-3">
                    <Button
                        variant="outline"
                        v-if="selectedNode.nodeType === 'group'"
                        object-id="btn_OpnameDetailNewProfilePage"
                        @click="openChildCreate('profile')"
                    >
                        New Profile
                    </Button>
                    <Button
                        variant="primary"
                        :disabled="selectedNode.nodeType === 'task'"
                        object-id="btn_OpnameDetailNewTaskPage"
                        @click="openChildCreate('task')"
                    >
                        New Task
                    </Button>
                    <Button
                        v-if="canCancelDoc"
                        variant="outline"
                        class="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        :disabled="docActionLoading"
                        object-id="btn_OpnameDetailCancelDoc"
                        @click="handleCancelDoc"
                    >
                        Cancel Opname
                    </Button>
                    <Button
                        v-if="canStartCounting"
                        variant="primary"
                        :disabled="docActionLoading"
                        object-id="btn_OpnameDetailStartCounting"
                        @click="handleStartCounting"
                    >
                        Start Counting
                    </Button>
                    <Button
                        v-if="canReconcile"
                        variant="primary"
                        :disabled="docActionLoading"
                        object-id="btn_OpnameDetailReconcile"
                        @click="handleReconcile"
                    >
                        Reconcile
                    </Button>
                    <Button
                        v-if="canClose"
                        variant="primary"
                        :disabled="docActionLoading"
                        object-id="btn_OpnameDetailCloseDoc"
                        @click="handleClose"
                    >
                        Close Opname
                    </Button>
                </div>
            </template>
        </PageHeader>

        <ConfirmDialog
            v-model="docConfirmationOpen"
            :title="docConfirmation?.title || 'Confirm Action'"
            :description="docConfirmation?.description || ''"
            :confirm-text="docConfirmation?.confirmText || 'Confirm'"
            cancel-text="Back"
            :variant="docConfirmation?.variant || 'primary'"
            :loading="docActionLoading"
            persistent
            object-id="dlg_OpnameDetailConfirm"
            @confirm="handleConfirmDocAction"
            @cancel="clearDocConfirmation"
        />

        <div v-if="loading" class="px-6">
            <LoadingState :lines="5" />
        </div>

        <div
            v-else-if="error"
            class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
            {{ error }}
        </div>

        <template v-else-if="selectedNode">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card class="md:col-span-1" object-id="wdg_OpnameDetailInfo">
                    <h3
                        class="mb-4 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900"
                    >
                        Node Details
                    </h3>

                    <div class="space-y-4 text-sm">
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Title
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedNode.title }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Document Number
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedNode.profile_id }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Node Type
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedNode.nodeType }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Status
                            </span>
                            <Badge :tone="getStatusTone(selectedNode.status)">
                                {{ getStatusLabel(selectedNode.status) }}
                            </Badge>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Warehouse
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedWarehouseLabel }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Parent
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedNode.parentId ?? "-" }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Location
                            </span>
                            <span class="mt-1 block font-medium text-gray-900">
                                {{ selectedNodeLocation }}
                            </span>
                        </div>
                        <div v-if="selectedNode.description">
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Description
                            </span>
                            <p class="mt-1 text-sm text-gray-600">
                                {{ selectedNode.description }}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card
                    class="md:col-span-2"
                    no-padding
                    object-id="wdg_OpnameDetailChildren"
                >
                    <div class="px-6 py-5 border-b border-gray-100">
                        <h3 class="text-base font-semibold text-gray-900">
                            Line Items
                        </h3>
                        <p class="mt-2 text-sm text-gray-500">
                            Review line items and open the action drawer for
                            each item.
                        </p>
                    </div>

                    <div
                        v-if="selectedDetailLines.length"
                        class="overflow-x-auto"
                    >
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Item
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Location
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        System Qty
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Counted Qty
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Diff
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                <tr
                                    v-for="line in selectedDetailLines"
                                    :key="line.id"
                                >
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        <div class="font-medium">
                                            {{
                                                line.product?.name ??
                                                line.productId
                                            }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {{
                                                line.product?.code ??
                                                line.productId
                                            }}
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{
                                            line.location?.name ??
                                            line.location?.code ??
                                            line.locationId
                                        }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm"
                                    >
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{
                                                line.qtySystem ??
                                                line.system_qty ??
                                                0
                                            }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Raw system quantity
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm"
                                    >
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{
                                                line.qtyCounted ??
                                                line.counted_qty ??
                                                0
                                            }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Physical count
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm"
                                    >
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{
                                                line.qtyDiff ??
                                                line.variance_qty ??
                                                0
                                            }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            Variance
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm"
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            :object-id="`btn_OpnameDetailOpenItem_${line.id}`"
                                            @click="openDetail(line)"
                                        >
                                            Open
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="px-6 py-8">
                        <p class="text-sm text-gray-500">
                            No line items available.
                        </p>
                    </div>
                </Card>
            </div>
        </template>

        <Drawer
            v-model="isItemDrawerOpen"
            title="Stock Opname Adjustment"
            description="Choose an action for the selected line item."
            side="right"
            width="lg"
            object-id="drw_OpnameItemAction"
        >
            <div v-if="selectedLineItem" class="space-y-6">
                <div
                    class="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                >
                    <div class="font-medium text-gray-900">
                        {{
                            selectedLineItem.product?.name ??
                            selectedLineItem.productId
                        }}
                    </div>
                    <div class="mt-1">
                        Product Code:
                        {{
                            selectedLineItem.product?.code ??
                            selectedLineItem.productId
                        }}
                    </div>
                    <div class="mt-1">
                        Location: {{ selectedLineItemLocation }}
                    </div>
                    <div class="mt-1">
                        System Qty:
                        {{
                            selectedLineItem.qtySystem ??
                            selectedLineItem.system_qty ??
                            0
                        }}
                    </div>
                    <div class="mt-1">
                        Counted Qty:
                        {{
                            selectedLineItem.qtyCounted ??
                            selectedLineItem.counted_qty ??
                            0
                        }}
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-gray-900">
                            Action
                        </h4>
                        <div class="flex items-center gap-2 text-xs">
                            <span class="text-gray-500">
                                Current: {{ selectedItemActionLabel }}
                            </span>
                            <span
                                class="rounded-full px-2 py-0.5 font-medium"
                                :class="
                                    selectedItemActionSupported
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                "
                            >
                                {{
                                    selectedItemActionSupported
                                        ? "Backend supported"
                                        : "Preview only"
                                }}
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <Button
                            v-for="action in drawerActions"
                            :key="action.key"
                            size="sm"
                            :variant="
                                selectedItemAction === action.key
                                    ? 'primary'
                                    : 'outline'
                            "
                            class="w-full justify-center"
                            :disabled="
                                submittingItemAction &&
                                selectedItemAction === action.key
                            "
                            :object-id="`btn_OpnameItemAction_${action.key}`"
                            @click="selectItemAction(action.key)"
                        >
                            {{ action.label }}
                        </Button>
                    </div>

                    <div
                        class="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                    >
                        {{ selectedItemActionHint }}
                    </div>
                </div>

                <div
                    class="rounded-md border border-gray-200 bg-white px-4 py-4"
                >
                    <div class="text-sm font-semibold text-gray-900">
                        Action Details
                    </div>

                    <div class="mt-4 space-y-4">
                        <template v-if="selectedItemAction === 'match'">
                            <div class="grid grid-cols-2 gap-3">
                                <Input
                                    v-model="activeActionForm.expectedQty"
                                    label="Expected Qty"
                                    type="number"
                                    placeholder="120"
                                    object-id="txt_OpnameItemActionExpectedQty"
                                />
                                <Input
                                    v-model="activeActionForm.actualQty"
                                    label="Actual Qty"
                                    type="number"
                                    placeholder="118"
                                    object-id="txt_OpnameItemActionActualQty"
                                />
                            </div>
                        </template>

                        <template v-else-if="selectedItemAction === 'unmatch'">
                            <Input
                                v-model="activeActionForm.reason"
                                label="Reason"
                                placeholder="Explain why this line is not matched"
                                object-id="txt_OpnameItemActionReason"
                            />
                        </template>

                        <template v-else>
                            <Input
                                v-model="activeActionForm.reason"
                                label="Reason"
                                placeholder="Explain why this line is not matched"
                                object-id="txt_OpnameItemActionReasonAlt"
                            />
                        </template>

                        <div>
                            <label
                                class="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Note
                            </label>
                            <textarea
                                v-model="activeActionForm.note"
                                rows="3"
                                class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                placeholder="Add a short note"
                            />
                        </div>
                    </div>

                    <div
                        class="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700"
                    >
                        <div class="font-medium text-gray-900">
                            {{
                                selectedItemAction === "match"
                                    ? "Count Adjustment"
                                    : "Mismatch Review"
                            }}
                        </div>
                        <p class="mt-1">
                            {{
                                selectedItemAction === "match"
                                    ? "Use this action when the physical count is aligned with the recorded stock."
                                    : "Use this action when the line item needs correction before posting."
                            }}
                        </p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_OpnameItemActionClose"
                        @click="closeItemDrawer"
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        :disabled="
                            submittingItemAction || !selectedItemActionSupported
                        "
                        object-id="btn_OpnameItemActionSubmit"
                        @click="submitItemAction"
                    >
                        <span v-if="selectedItemActionSupported">
                            Submit {{ selectedItemActionLabel }}
                        </span>
                        <span v-else>Preview Only</span>
                    </Button>
                </div>
            </template>
        </Drawer>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Badge from "@/components/atoms/Badge.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";
import { useOpnameDetail } from "./composables/useOpnameDetail";

const {
    loading,
    error,
    selectedWarehouseLabel,
    pageTitle,
    pageDescription,
    selectedNode,
    selectedDetailLines,
    selectedNodeLocation,
    isItemDrawerOpen,
    selectedLineItem,
    selectedLineItemLocation,
    drawerActions,
    selectedItemAction,
    selectedItemActionLabel,
    selectedItemActionDescription,
    selectedItemActionSupported,
    selectedItemActionHint,
    activeActionForm,
    submittingItemAction,
    getStatusLabel,
    getStatusTone,
    handleBack,
    openChildCreate,
    openDetail,
    closeItemDrawer,
    selectItemAction,
    submitItemAction,
    refresh,
    docActionLoading,
    docConfirmation,
    canStartCounting,
    canReconcile,
    canClose,
    canCancelDoc,
    handleStartCounting,
    handleReconcile,
    handleClose,
    handleCancelDoc,
    clearDocConfirmation,
    handleConfirmDocAction,
} = useOpnameDetail();

const docConfirmationOpen = computed({
    get: () => Boolean(docConfirmation.value),
    set: (value: boolean) => {
        if (!value) clearDocConfirmation();
    },
});

onMounted(() => {
    void refresh();
});
</script>
