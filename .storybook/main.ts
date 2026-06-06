import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
    framework: {
        name: "@storybook/vue3-vite",
        options: {},
    },
    stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: [
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-a11y",
        "@storybook/addon-docs",
        "@storybook/addon-onboarding",
        "@storybook/addon-vitest",
        "@chromatic-com/storybook"
    ],
};

export default config;
