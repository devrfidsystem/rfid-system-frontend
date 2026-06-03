<template>
    <div
        class="relative min-h-screen overflow-hidden bg-workspace-bg text-gray-900"
    >
        <div
            class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8"
        >
            <div
                class="grid gap-6 rounded-[28px] border border-border-default bg-white p-6 shadow-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-10"
            >
                <section class="hidden flex-col gap-6 text-gray-900 lg:flex">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary-600"
                    >
                        ALIR Smart System
                    </p>
                    <h1
                        class="text-3xl font-semibold leading-tight text-gray-900 lg:text-4xl"
                    >
                        {{ asideTitle }}
                    </h1>
                    <p class="text-sm text-text-secondary">
                        {{ asideDescription }}
                    </p>

                    <div class="space-y-4">
                        <div
                            v-for="feature in features"
                            :key="feature.title"
                            class="flex items-start gap-3"
                        >
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600 ring-1 ring-primary-100"
                            >
                                <component
                                    :is="feature.icon"
                                    size="18"
                                    stroke-width="1.8"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-900">
                                    {{ feature.title }}
                                </p>
                                <p class="text-xs text-text-secondary">
                                    {{ feature.description }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        class="rounded-md border border-border-default bg-workspace-bg p-4 text-xs text-text-secondary mt-auto"
                    >
                        <p class="font-semibold text-gray-900">
                            Enterprise-ready stack
                        </p>
                        <p class="mt-1 text-[13px] leading-relaxed">
                            Integrasi dengan audit trail, role-based access, dan
                            reporting pipeline sudah siap diimplementasikan.
                        </p>
                    </div>
                </section>

                <section
                    class="rounded-[20px] bg-white lg:bg-transparent lg:border-l lg:border-border-default lg:pl-10 p-6 text-gray-900 sm:p-10 lg:p-0"
                >
                    <header class="mb-8 space-y-2">
                        <p class="text-sm font-medium text-gray-500 mb-1">
                            Secure access
                        </p>
                        <h2
                            class="text-3xl font-semibold leading-tight text-gray-900"
                        >
                            {{ formTitle }}
                        </h2>
                        <p
                            v-if="formSubtitle"
                            class="text-sm text-text-secondary"
                        >
                            {{ formSubtitle }}
                        </p>
                    </header>

                    <div class="space-y-6">
                        <slot />
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";
import {
    ShieldCheck,
    Fingerprint,
    Layers,
    LayoutDashboard,
} from "lucide-vue-next";
import type { Component } from "vue";

const props = defineProps<{
    formTitle: string;
    formSubtitle?: string;
    asideTitle?: string;
    asideDescription?: string;
}>();

const features: Array<{ title: string; description: string; icon: Component }> =
    [
        {
            title: "Governed onboarding",
            description:
                "Pemisahan tugas dan approval audit-ready untuk setiap akses modul.",
            icon: ShieldCheck,
        },
        {
            title: "Adaptive insights",
            description:
                "Shortcut KPI, alerts, dan log aggregator tetap dalam satu view.",
            icon: LayoutDashboard,
        },
        {
            title: "Identity-resilient",
            description:
                "Password policy + device fingerprinting siap dikaitkan ke service Anda.",
            icon: Fingerprint,
        },
        {
            title: "Modular orchestration",
            description:
                "Integrasi micro-frontends, APIs, dan workflows sesuai SLA.",
            icon: Layers,
        },
    ];

const asideTitle = computed(
    () => props.asideTitle ?? "Command center operasional industri 4.0",
);
const asideDescription = computed(
    () =>
        props.asideDescription ??
        "Dashboard, workflows, dan security layer tersusun agar tim Anda bisa mendesain proses secara presisi.",
);

const { formTitle, formSubtitle } = toRefs(props);
</script>
