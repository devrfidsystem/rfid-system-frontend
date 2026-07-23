<template>
    <Card no-padding object-id="wdg_OutboundDetailLines">
        <div class="px-6 py-5 border-b border-gray-100">
            <div
                class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
                <div>
                    <h3 class="text-base font-semibold text-gray-900">
                        Line Execution
                    </h3>
                    <p class="mt-2 text-sm text-gray-500">
                        {{ note }}
                    </p>
                </div>
                <Badge :tone="readOnly ? 'neutral' : 'warning'">
                    {{ readOnly ? "Review Only" : "Draft" }}
                </Badge>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                            Product
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                            Origin Location
                        </th>
                        <th
                            class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                            Qty
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="(line, idx) in lines" :key="line.id ?? idx">
                        <td class="px-6 py-4 text-sm text-gray-900">
                            <div class="font-medium">
                                {{
                                    line.product?.name ??
                                    line.productName ??
                                    line.productId ??
                                    "-"
                                }}
                            </div>
                            <div class="text-xs text-gray-500">
                                {{
                                    line.product?.code ??
                                    line.productCode ??
                                    "-"
                                }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
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
                        <td class="px-6 py-4 text-right text-sm text-gray-900">
                            <div class="font-medium">
                                {{
                                    line.expectedQty ??
                                    line.qty ??
                                    line.actualQty ??
                                    "-"
                                }}
                            </div>
                            <div class="text-xs text-gray-500">
                                {{ line.uom?.code ?? line.uomId ?? "" }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                            <Badge :tone="readOnly ? 'neutral' : 'warning'">
                                {{ readOnly ? "Review Only" : "Draft" }}
                            </Badge>
                        </td>
                    </tr>
                    <tr v-if="!lines.length">
                        <td
                            colspan="4"
                            class="px-6 py-8 text-center text-sm text-gray-500"
                        >
                            No line items found.
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
