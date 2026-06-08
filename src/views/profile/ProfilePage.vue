<template>
    <section class="space-y-6">
        <PageHeader
            title="Profil Saya"
            tagline="Akun"
            description="Lihat detail akun dan keluar dari sesi saat ini."
        >
            <template #actions>
                <Button
                    variant="outline"
                    size="sm"
                    :loading="processing"
                    :disabled="processing"
                    object-id="btn_ProfileLogout"
                    @click="handleLogout"
                >
                    Logout
                </Button>
            </template>
        </PageHeader>

        <div
            v-if="!profile"
            class="rounded-lg border border-gray-100 bg-gray-50/50 px-5 py-6 text-sm text-gray-500"
        >
            Profil belum tersedia. Silakan tunggu hingga data dimuat ulang.
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card object-id="wdg_ProfileAccount">
                <div class="space-y-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-400">
                                Informasi Akun
                            </p>
                            <p class="text-lg font-semibold text-gray-900">
                                {{ profile.user.fullName }}
                            </p>
                            <p class="text-sm text-gray-500">
                                {{ profile.user.email }}
                            </p>
                        </div>
                    </div>

                    <dl class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-xs font-medium text-gray-400">
                                Nama lengkap
                            </dt>
                            <dd
                                class="mt-1 text-sm font-semibold text-gray-900"
                            >
                                {{ profile.user.fullName }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium text-gray-400">
                                Email
                            </dt>
                            <dd
                                class="mt-1 text-sm font-semibold text-gray-900"
                            >
                                {{ profile.user.email }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium text-gray-400">
                                Telepon
                            </dt>
                            <dd
                                class="mt-1 text-sm font-semibold text-gray-900"
                            >
                                {{ profile.user.phone ?? "Belum tersedia" }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium text-gray-400">
                                Perusahaan
                            </dt>
                            <dd
                                class="mt-1 text-sm font-semibold text-gray-900"
                            >
                                {{
                                    currentCompany?.companyName ??
                                    "Tidak terhubung"
                                }}
                            </dd>
                        </div>
                    </dl>
                </div>
            </Card>

            <Card object-id="wdg_ProfileAccess">
                <div class="space-y-5">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-gray-400">
                            Hak Akses
                        </p>
                        <span class="text-xs font-semibold text-gray-500"
                            >{{ permissions.length }} permission</span
                        >
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                Role
                            </p>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span
                                    v-for="role in profile.roles"
                                    :key="role.id"
                                    class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
                                >
                                    {{ role.name }}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                Perusahaan
                            </p>
                            <ul class="mt-2 space-y-2 text-sm text-gray-600">
                                <li
                                    v-for="company in profile.companies"
                                    :key="company.companyId"
                                    class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                                >
                                    <span>{{ company.companyName }}</span>
                                    <span
                                        v-if="company.isPrimary"
                                        class="text-xs font-medium text-gray-500"
                                        >Current Setup</span
                                    >
                                </li>
                            </ul>
                            <p
                                v-if="!profile.companies.length"
                                class="text-xs text-gray-500"
                            >
                                Belum terhubung ke perusahaan manapun.
                            </p>
                        </div>

                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                Menu tersimpan
                            </p>
                            <p class="text-xs text-gray-500">
                                {{ menuTreeCount }} node menu
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <p
            v-if="status"
            class="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
        >
            {{ status }}
        </p>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import { useProfile } from "./composables/useProfile";

const {
    profile,
    permissions,
    menuTreeCount,
    currentCompany,
    processing,
    status,
    handleLogout,
} = useProfile();
</script>
