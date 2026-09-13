<template>
    <div
        class="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        object-id="wdg_UsersToolbar"
    >
        <ToolbarTitle title="Users List" />

        <div
            class="flex w-full flex-1 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end"
        >
            <Input
                :model-value="keyword"
                placeholder="Search email or name"
                aria-label="Search email or name"
                label="Search users"
                label-class="sr-only"
                class="w-full sm:max-w-xs"
                object-id="txt_UsersSearch"
                @update:model-value="
                    (value) => emit('update:keyword', String(value))
                "
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>

            <Button
                variant="outline"
                class="w-full justify-center px-2 sm:w-auto"
                title="Refresh"
                object-id="btn_UsersRefresh"
                @click="emit('refresh')"
            >
                <Icon :icon="RefreshCw" :size="16" />
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import Input from "@/components/atoms/Input.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import { RefreshCw, Search } from "lucide-vue-next";

defineProps<{
    keyword: string;
}>();

const emit = defineEmits<{
    (event: "update:keyword", value: string): void;
    (event: "refresh"): void;
}>();
</script>
