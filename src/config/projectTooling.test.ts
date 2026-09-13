import { describe, expect, test } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootPath = process.cwd();

const readProjectFile = (fileName: string) =>
    readFileSync(resolve(rootPath, fileName), "utf8");

const readFilesRecursively = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            return readFilesRecursively(entryPath);
        }
        return entryPath;
    });

describe("project tooling configuration", () => {
    test("defines explicit unit, regression, e2e, ci, and mode-specific build scripts", () => {
        const packageJson = JSON.parse(readProjectFile("package.json")) as {
            scripts?: Record<string, string>;
        };

        expect(packageJson.scripts).toMatchObject({
            "test:unit": "vitest run",
            "test:ci":
                "npm run type-check && npm run test:unit && npm run build",
            "test:regression": "node tests/regression/runner.js",
            "test:e2e": "node tests/e2e/runner.js",
            "build:development": "vite build --mode development",
            "build:staging": "vite build --mode staging",
            "build:production": "vite build --mode production",
        });
    });

    test("keeps Vitest scoped to unit tests instead of Selenium browser suites", () => {
        const vitestConfig = readProjectFile("vitest.config.ts");

        expect(vitestConfig).toContain("exclude");
        expect(vitestConfig).toContain("tests/regression/**");
        expect(vitestConfig).toContain("tests/smoke/**");
        expect(vitestConfig).toContain("tests/e2e/**");
    });

    test("Dockerfile build commands are backed by package scripts", () => {
        const dockerfile = readProjectFile("Dockerfile");
        const packageJson = JSON.parse(readProjectFile("package.json")) as {
            scripts?: Record<string, string>;
        };

        const referencedScripts: string[] = [];
        const buildScriptPattern = /pnpm run (build:[a-z]+)/g;
        let match = buildScriptPattern.exec(dockerfile);
        while (match) {
            referencedScripts.push(match[1]);
            match = buildScriptPattern.exec(dockerfile);
        }

        expect(referencedScripts).not.toHaveLength(0);
        expect(
            referencedScripts.every((script) => packageJson.scripts?.[script]),
        ).toBe(true);
    });

    test("raw import usage tests are covered by module declarations instead of suppressions", () => {
        const sourceFiles = readFilesRecursively(
            resolve(rootPath, "src"),
        ).filter((filePath) => /\.(ts|vue)$/.test(filePath));

        const suppressionMarker = ["@ts-expect-error", "Vite raw imports"].join(
            " ",
        );
        const rawImportSuppressions = sourceFiles.filter((filePath) =>
            readFileSync(filePath, "utf8").includes(suppressionMarker),
        );

        expect(rawImportSuppressions).toEqual([]);
        expect(readProjectFile("src/model/types/raw.d.ts")).toContain(
            'declare module "*?raw"',
        );
    });

    test("legacy empty source folders are not kept as architecture placeholders", () => {
        [
            "src/components/layouts",
            "src/lib/supabase",
            "src/views/settings/components",
            "src/views/todo",
            "src/views/tag-registration",
        ].forEach((legacyDirectory) => {
            expect(existsSync(resolve(rootPath, legacyDirectory))).toBe(false);
        });
    });
});
