import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import flowbitePlugin from "flowbite/plugin";

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{vue,ts,tsx}",
        "./node_modules/flowbite/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#eff6ff",
                    100: "#dbeafe",
                    200: "#bfdbfe",
                    300: "#93c5fd",
                    400: "#60a5fa",
                    500: "#3b82f6",
                    600: "#2563EB", // ALIR Brand Primary
                    700: "#1d4ed8",
                    800: "#1e40af",
                    900: "#1e3a8a",
                },
                "primary-teal": "#14B8A6",
                "insight-purple": "#8B5CF6",
                "action-orange": "#F59E0B",
                "signal-red": "#EF4444",
                "workspace-bg": "#F8FAFC",
                "soft-surface": "#EEF4FF",
                "border-default": "#E2E8F0",
                "text-secondary": "#64748B",

                // Backward compatibility mappings for UI
                surface: "rgb(var(--surface) / <alpha-value>)",
                card: "rgb(var(--surface) / <alpha-value>)",
                "text-default": "rgb(var(--text) / <alpha-value>)",
                "text-muted": "#64748B",
            },
            fontFamily: {
                sans: [
                    "Inter",
                    "ui-sans-serif",
                    ...defaultTheme.fontFamily.sans,
                ],
            },
            boxShadow: {
                xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
                sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
                md: "0 4px 14px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04)",
                lg: "0 10px 30px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(15, 23, 42, 0.04)",
                xl: "0 20px 50px rgba(15, 23, 42, 0.10), 0 8px 20px rgba(15, 23, 42, 0.05)",
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
            },
        },
    },
    plugins: [flowbitePlugin],
};

export default config;
