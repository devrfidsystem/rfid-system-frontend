<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-950 text-white">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_45%)]" aria-hidden="true"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.25),_transparent_40%)]" aria-hidden="true"></div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-6 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-lg lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <section class="hidden flex-col gap-6 text-white lg:flex">
          <p class="text-xs font-semibold uppercase tracking-[0.5em] text-sky-200">RFID Intelligence</p>
          <h1 class="text-3xl font-semibold leading-tight text-white lg:text-4xl">{{ asideTitle }}</h1>
          <p class="text-sm text-slate-200">{{ asideDescription }}</p>

          <div class="space-y-4">
            <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                <component :is="feature.icon" size="18" stroke-width="1.8" aria-hidden="true" />
              </div>
              <div>
                <p class="text-sm font-semibold text-white">{{ feature.title }}</p>
                <p class="text-xs text-slate-200">{{ feature.description }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/30 bg-white/5 p-4 text-xs text-slate-200">
            <p class="font-semibold text-white">Enterprise-ready stack</p>
            <p class="mt-1 text-[13px] leading-relaxed">
              Integrasi dengan audit trail, role-based access, dan reporting pipeline sudah siap diimplementasikan.
            </p>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:p-10">
          <header class="mb-6 space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Secure access</p>
            <h2 class="text-3xl font-semibold leading-tight text-slate-900">{{ formTitle }}</h2>
            <p v-if="formSubtitle" class="text-sm text-slate-500">{{ formSubtitle }}</p>
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
import { computed, toRefs } from 'vue';
import { ShieldCheck, Fingerprint, Layers, LayoutDashboard } from 'lucide-vue-next';
import type { Component } from 'vue';

const props = defineProps<{
  formTitle: string;
  formSubtitle?: string;
  asideTitle?: string;
  asideDescription?: string;
}>();

const features: Array<{ title: string; description: string; icon: Component }> = [
  {
    title: 'Governed onboarding',
    description: 'Pemisahan tugas dan approval audit-ready untuk setiap akses modul.',
    icon: ShieldCheck
  },
  {
    title: 'Adaptive insights',
    description: 'Shortcut KPI, alerts, dan log aggregator tetap dalam satu view.',
    icon: LayoutDashboard
  },
  {
    title: 'Identity-resilient',
    description: 'Password policy + device fingerprinting siap dikaitkan ke service Anda.',
    icon: Fingerprint
  },
  {
    title: 'Modular orchestration',
    description: 'Integrasi micro-frontends, APIs, dan workflows sesuai SLA.',
    icon: Layers
  }
];

const asideTitle = computed(() => props.asideTitle ?? 'Command center untuk operasional RFID');
const asideDescription = computed(
  () =>
    props.asideDescription ??
    'Dashboard, workflows, dan security layer sudah tersusun agar tim Anda bisa mulai mendesain proses secara presisi.'
);

const { formTitle, formSubtitle } = toRefs(props);
</script>
