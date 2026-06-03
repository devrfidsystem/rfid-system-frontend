<template>
    <router-view />
</template>

<script setup lang="ts">
import { useTheme } from "@/composable/useTheme";

useTheme();
</script>
