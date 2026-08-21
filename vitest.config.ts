import { configDefaults, defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    test: {
        environment: "node",
        exclude: [
            ...configDefaults.exclude,
            "tests/regression/**",
            "tests/smoke/**",
            "tests/e2e/**",
            "tests/page-objects/**",
            "tests/helpers/**",
            "tests/selectors/**",
        ],
    },
});
