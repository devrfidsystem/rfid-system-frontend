<template>
    <div
        class="flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-100 bg-gray-50/50 px-6 py-10 text-center"
        data-testid="empty-placeholder"
    >
        <img
            :src="resolvedImage"
            :alt="resolvedAlt"
            class="w-[180px] max-w-full sm:w-[210px]"
            loading="lazy"
            decoding="async"
        />
        <div class="max-w-md space-y-1">
            <h3 class="text-base font-semibold text-gray-900 sm:text-lg">
                {{ resolvedTitle }}
            </h3>
            <p class="text-sm text-text-secondary">{{ resolvedDescription }}</p>
        </div>

        <slot name="action">
            <Button
                v-if="shouldShowAction"
                variant="outline"
                size="sm"
                type="button"
                data-testid="button-emit-action"
                @click="emit('action')"
            >
                {{ actionText }}
            </Button>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import Button from "@/components/atoms/Button.vue";
import emptyDataIllustration from "@/assets/illustrations/empty-data.svg";
import emptySearchIllustration from "@/assets/illustrations/empty-search.svg";
import emptyFilterIllustration from "@/assets/illustrations/empty-filter.svg";

type EmptyStateVariant = "default" | "search" | "filter";

const props = withDefaults(
    defineProps<{
        title?: string;
        description?: string;
        image?: string;
        alt?: string;
        actionLabel?: string;
        showAction?: boolean;
        variant?: EmptyStateVariant;
    }>(),
    {
        title: undefined,
        description: undefined,
        image: undefined,
        alt: undefined,
        actionLabel: undefined,
        showAction: false,
        variant: "default",
    },
);

const emit = defineEmits<(event: "action") => void>();

const slots = useSlots();

const defaultsByVariant: Record<
    EmptyStateVariant,
    { title: string; description: string; image: string; alt: string }
> = {
    default: {
        title: "Tidak ada data",
        description: "Belum ada data yang dapat ditampilkan",
        image: emptyDataIllustration,
        alt: "Ilustrasi data kosong",
    },
    search: {
        title: "Data tidak ditemukan",
        description: "Coba ubah kata kunci pencarian Anda",
        image: emptySearchIllustration,
        alt: "Ilustrasi hasil pencarian kosong",
    },
    filter: {
        title: "Tidak ada data yang sesuai",
        description: "Coba ubah atau reset filter",
        image: emptyFilterIllustration,
        alt: "Ilustrasi hasil filter kosong",
    },
};

const variantDefaults = computed(() => defaultsByVariant[props.variant]);
const resolvedTitle = computed(
    () => props.title ?? variantDefaults.value.title,
);
const resolvedDescription = computed(
    () => props.description ?? variantDefaults.value.description,
);
const resolvedImage = computed(
    () => props.image ?? variantDefaults.value.image,
);
const resolvedAlt = computed(() => props.alt ?? variantDefaults.value.alt);
const actionText = computed(() => props.actionLabel ?? "Reset");
const shouldShowAction = computed(() => props.showAction && !slots.action);
</script>
