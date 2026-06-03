import vue from "eslint-plugin-vue";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import sonarjs from "eslint-plugin-sonarjs";
import parser from "vue-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: [
            "**/src/sw.ts",
            "**/node_modules",
            "**/dist",
            "**/dangerfile.ts",
            "**/vitest.config.ts",
            "**/*.timestamp-*.mjs",
            "migrate.cjs",
            "src/components/stories/**",
            "src/model/types/storybook.d.ts",
        ],
    },
    ...compat.extends(
        "plugin:vue/recommended",
        "eslint:recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ),
    {
        plugins: {
            vue,
            prettier,
            sonarjs,
        },
        settings: {
            "import/resolver": {
                alias: {
                    map: [["@", "src"]],
                    extensions: [".ts", ".js", ".vue", ".json"],
                },
                node: {
                    map: [["@", "src"]],
                    extensions: [".ts", ".js", ".vue", ".json"],
                },
            },
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                defineProps: "readonly",
                defineEmits: "readonly",
                defineExpose: "readonly",
                withDefaults: "readonly",
            },
            parser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                parser: "@typescript-eslint/parser",
                ecmaFeatures: {
                    jsx: true,
                    tsx: true,
                },
            },
        },
        rules: {
            "vue/html-self-closing": "off",
            "vue/valid-template-root": "off",
            "vue/no-empty-component-block": "off",
            "vue/multi-word-component-names": "off",
            "no-console":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "no-debugger":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "@typescript-eslint/no-unused-vars":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "no-unused-vars": "off",
            "vue/no-unused-vars":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "prettier/prettier":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "vue/no-mutating-props":
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
            "@typescript-eslint/no-unused-expressions": [
                process.env.NODE_ENV === "localhost" ? "warn" : "error",
                {
                    allowTernary: true,
                    allowTaggedTemplates: true,
                },
            ],
        },
    },
];
