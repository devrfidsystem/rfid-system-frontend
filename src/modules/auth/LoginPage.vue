<template>
  <AuthShell
    form-title="Masuk ke Control Room"
    form-subtitle="Gunakan akun perusahaan Anda untuk mengakses laporan dan tindakan RFID."
    aside-title="Koneksi aman industri 4.0"
    aside-description="Single source of truth untuk dashboards, audit, dan access policy dalam satu ruang kerja yang telah distandarisasi."
  >
    <template #default>
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label class="text-sm font-semibold text-slate-600" for="login-email">Email perusahaan</label>
          <input
            id="login-email"
            v-model="form.email"
            @blur="touched.email = true"
            type="email"
            autocomplete="email"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="nama@perusahaan.co.id"
          />
          <p v-if="touched.email && !isEmailValid" class="mt-1 text-xs text-rose-500">Gunakan email valid perusahaan.</p>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-600" for="login-password">Password</label>
          <input
            id="login-password"
            v-model="form.password"
            @blur="touched.password = true"
            type="password"
            autocomplete="current-password"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Minimal 8 karakter"
          />
          <p v-if="touched.password && !isPasswordValid" class="mt-1 text-xs text-rose-500">Password harus terdiri dari minimal 8 karakter.</p>
        </div>

        <div class="flex items-center justify-between text-sm text-slate-500">
          <label class="inline-flex items-center gap-2 text-slate-500">
            <input type="checkbox" v-model="form.remember" class="h-4 w-4 rounded border border-slate-300 text-sky-600" />
            Ingat saya
          </label>
          <RouterLink to="/auth/register" class="font-semibold text-sky-600">Belum punya akun?</RouterLink>
        </div>

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          :disabled="submitting || !canSubmit"
        >
          <span v-if="submitting" class="btn-spinner"></span>
          <span>{{ submitting ? 'Memproses...' : 'Masuk' }}</span>
        </button>

        <p v-if="status" class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">{{ status }}</p>
      </form>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthShell from './AuthShell.vue';
import { sessionService } from '@/services/session';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
  remember: true
});

const touched = reactive({
  email: false,
  password: false
});

const submitting = ref(false);
const status = ref<string | null>(null);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmailValid = computed(() => emailPattern.test(form.email));
const isPasswordValid = computed(() => form.password.length >= 8);
const canSubmit = computed(() => isEmailValid.value && isPasswordValid.value);

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Gagal masuk. Silakan coba lagi.';
};

const handleSubmit = async () => {
  touched.email = true;
  touched.password = true;

  if (!canSubmit.value) {
    status.value = 'Lengkapi kolom sebelum melanjutkan.';
    return;
  }

  submitting.value = true;
  status.value = null;

  try {
    const session = await sessionService.signInWithPassword({
      email: form.email.trim(),
      password: form.password
    });

    authStore.setSession(session);
    await authStore.loadProfile();

    const redirectTarget = (route.query.redirect as string | undefined) ?? '/dashboard';
    await router.replace(redirectTarget);
  } catch (error) {
    status.value = toErrorMessage(error);
  } finally {
    submitting.value = false;
  }
};
</script>
