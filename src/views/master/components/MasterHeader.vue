<template>
    <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
            <h3 class="text-base font-semibold text-gray-900">
                {{ title }} List
            </h3>
        </div>
        <div class="flex flex-wrap items-center gap-3">
            <Input
                v-model="localKeyword"
                placeholder="Search data..."
                class="w-full max-w-xs"
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>
            <div class="flex items-center gap-2">
                <Button variant="outline" class="px-3">
                    <Icon :icon="Filter" :size="14" />
                    Filter
                </Button>
                <Button variant="outline" class="px-3">
                    <Icon :icon="ArrowUpDown" :size="14" />
                    Sort
                </Button>
                <Button
                    variant="outline"
                    class="px-2"
                    title="Refresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>
            </div>
            <Button variant="primary" :disabled="!canAdd" @click="$emit('add')">
                <Icon :icon="Plus" :size="14" />
                Add {{ title }}
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search, Filter, ArrowUpDown, RefreshCw, Plus } from "lucide-vue-next";

const props = defineProps<{
    title: string;
    keyword: string;
    canAdd: boolean;
}>();

const emit = defineEmits<{
    (e: "update:keyword", value: string): void;
    (e: "refresh"): void;
    (e: "add"): void;
}>();

const localKeyword = computed({
    get: () => props.keyword,
    set: (value) => emit("update:keyword", value),
});
</script>
