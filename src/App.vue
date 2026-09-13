<template>
    <AppLoadingScreen v-if="!appReady" />
    <router-view v-else />
</template>

<script setup lang="ts">
import { useTheme } from "@/composable/useTheme";
import { useAppReady } from "@/composable/useAppReady";
import AppLoadingScreen from "@/components/ui/states/AppLoadingScreen.vue";
import router from "@/router";

useTheme();
const appReady = useAppReady(router);
</script>
