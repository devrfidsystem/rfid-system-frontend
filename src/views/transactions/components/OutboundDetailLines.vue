<template>
    <Card no-padding object-id="wdg_OutboundDetailLines">
        <div class="px-6 py-5 border-b border-border">
            <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
                <ToolbarTitle title="Line Execution" :description="note" />
                <Badge :tone="readOnly ? 'neutral' : 'warning'">
                    {{ readOnly ? "Review Only" : "Draft" }}
                </Badge>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
                <thead class="bg-surface-secondary">
                    <tr>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold text-text-secondary"
                        >
                            Product
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold text-text-secondary"
                        >
                            Origin Location
                        </th>
                        <th
                            class="px-6 py-3 text-right text-xs font-semibold text-text-secondary"
                        >
                            Qty
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold text-text-secondary"
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border bg-surface">
                    <tr v-for="(line, idx) in lines" :key="line.id ?? idx">
                        <td class="px-6 py-4 text-sm text-text">
                            <div class="font-medium">
                                {{
                                    line.product?.name ??
                                    line.productName ??
                                    line.productId ??
                                    "-"
                                }}
                            </div>
                            <div class="text-xs text-text-secondary">
                                {{
                                    line.product?.code ??
                                    line.productCode ??
                                    "-"
                                }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-text-secondary">
                            <div>
                                {{
                                    line.sourceLocation?.name ??
                                    line.sourceLocation?.code ??
                                    line.fromLocation?.name ??
                                    line.fromLocation?.code ??
                                    line.location?.name ??
                                    line.location?.code ??
                                    line.sourceLocationId ??
                                    line.fromLocationId ??
                                    line.locationId ??
                                    "-"
                                }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right text-sm text-text">
                            <div class="font-medium">
                                {{
                                    line.expectedQty ??
                                    line.qty ??
                                    line.actualQty ??
                                    "-"
                                }}
                            </div>
                            <div class="text-xs text-text-secondary">
                                {{ line.uom?.code ?? line.uomId ?? "" }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-text-secondary">
                            <Badge :tone="readOnly ? 'neutral' : 'warning'">
                                {{ readOnly ? "Review Only" : "Draft" }}
                            </Badge>
                        </td>
                    </tr>
                    <tr v-if="!lines.length">
                        <td
                            colspan="4"
                            class="px-6 py-6"
                        >
                            <StatusPanel
                                title="No line items"
                                description="No outbound line execution rows are available."
                                :icon="FileText"
                                tone="neutral"
                                class="border-0 bg-transparent py-2"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Badge from "@/components/atoms/Badge.vue";
import Card from "@/components/molecules/Card.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import { FileText } from "lucide-vue-next";

type OutboundDetailLine = {
    id?: string;
    product?: { name?: string; code?: string };
    productName?: string;
    productCode?: string;
    productId?: string;
    location?: { name?: string; code?: string };
    locationId?: string;
    sourceLocation?: { name?: string; code?: string };
    sourceLocationId?: string;
    fromLocation?: { name?: string; code?: string };
    fromLocationId?: string;
    qty?: number;
    expectedQty?: number;
    actualQty?: number;
    uom?: { code?: string };
    uomId?: string;
};

const props = defineProps<{
    lines: OutboundDetailLine[];
    readOnly: boolean;
    status: string;
}>();

const note = computed(() =>
    props.readOnly
        ? "This outbound document is read-only in web admin. Review the line details and execution state below."
        : "This outbound draft can still be posted or canceled from web admin.",
);
</script>
