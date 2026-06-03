<template>
    <section class="space-y-6">
        <router-view v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
        </router-view>
    </section>
</template>
