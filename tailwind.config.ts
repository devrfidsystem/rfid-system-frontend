import type { Config } from "tailwindcss";
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
                // Neutral scale — this carries 80% of a dense UI (text, borders, backgrounds)
                gray: {
                    25: "#FCFCFD",
                    50: "#F9FAFB",
                    100: "#F3F4F6",
                    200: "#E5E7EB",
                    300: "#D1D5DB",
                    400: "#9CA3AF",
                    500: "#6B7280",
                    600: "#4B5563",
                    700: "#374151",
                    800: "#1F2937",
                    900: "#111827",
                },

                // Single brand accent — keep it here, use it sparingly in the UI
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

                // Semantic status colors — functional names, not "insight-purple" style names.
                // Old "insight-purple" (#8B5CF6) is remapped to `info` since that's what it was used for.
                success: { 50: "#F0FDFA", 500: "#14B8A6", 600: "#0D9488" },
                warning: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706" },
                danger: { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626" },
                info: { 50: "#F5F3FF", 500: "#8B5CF6", 600: "#7C3AED" },

                // Theme-aware surface/text tokens — driven by CSS vars set via
                // data-theme on <html>, so light/dark just works.
                surface: "rgb(var(--surface) / <alpha-value>)",
                "surface-secondary":
                    "rgb(var(--surface-secondary) / <alpha-value>)",
                border: "rgb(var(--border) / <alpha-value>)",
                text: "rgb(var(--text) / <alpha-value>)",
                "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
                "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
            },

            fontFamily: {
                sans: [
                    "Inter",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "ui-sans-serif",
                    "system-ui",
                    "sans-serif",
                ],
            },

            // This is the single biggest fix. Tailwind's default text-base is
            // 16px, sized for marketing pages. Product UI (ClickUp, Linear,
            // Notion) runs 12–14px for body text. Overriding the scale here
            // means every existing `text-sm` / `text-base` class in your
            // components automatically shrinks to the right size — no need
            // to touch component files.
            fontSize: {
                xs: ["11px", { lineHeight: "16px" }],
                sm: ["12px", { lineHeight: "18px" }],
                base: ["13px", { lineHeight: "20px" }],
                md: ["14px", { lineHeight: "20px" }],
                lg: ["16px", { lineHeight: "24px" }],
                xl: ["20px", { lineHeight: "28px" }],
                "2xl": ["24px", { lineHeight: "32px" }],
                "3xl": ["32px", { lineHeight: "40px" }],
            },

            spacing: {
                "4.5": "18px",
                "18": "72px",
            },

            borderRadius: {
                sm: "var(--radius-sm)",
                DEFAULT: "var(--radius-md)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
            },

            boxShadow: {
                xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
                sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
                md: "0 4px 14px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04)",
                lg: "0 10px 30px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(15, 23, 42, 0.04)",
                xl: "0 20px 50px rgba(15, 23, 42, 0.10), 0 8px 20px rgba(15, 23, 42, 0.05)",
            },
        },
    },
    plugins: [flowbitePlugin],
};

export default config;