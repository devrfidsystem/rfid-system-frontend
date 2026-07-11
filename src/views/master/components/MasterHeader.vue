<template>
    <div
        class="flex flex-col justify-between gap-4 px-4 py-3 sm:flex-row sm:items-center"
    >
        <div>
            <h3 class="text-lg font-semibold text-text">
                {{ title }} List
            </h3>
        </div>
        <div
            class="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
            <Input
                v-model="localKeyword"
                placeholder="Search data..."
                class="w-full sm:max-w-xs"
                object-id="txt_MasterHeaderSearch"
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>
            <div class="grid grid-cols-3 items-center gap-2 sm:flex">
                <Button
                    variant="outline"
                    class="px-3 w-full sm:w-auto justify-center"
                    object-id="btn_MasterHeaderFilter"
                >
                    <Icon :icon="Filter" :size="14" />
                    Filter
                </Button>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Refresh"
                    object-id="btn_MasterHeaderRefresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>
            </div>
            <Button
                variant="primary"
                :disabled="!canAdd"
                object-id="btn_MasterHeaderAdd"
                @click="$emit('add')"
            >
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
import {
    Search,
    Filter,
    RefreshCw,
    Plus,
} from "lucide-vue-next";

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
