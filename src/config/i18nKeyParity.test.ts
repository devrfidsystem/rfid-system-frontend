import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const localesRoot = resolve(process.cwd(), "src/locales");

const flattenKeys = (value: unknown, prefix = ""): string[] => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return [prefix];
    }
    return Object.entries(value as Record<string, unknown>).flatMap(
        ([key, nested]) =>
            flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
    );
};

const readNamespaceKeys = (locale: string, fileName: string): string[] => {
    const filePath = resolve(localesRoot, locale, fileName);
    const content = JSON.parse(readFileSync(filePath, "utf8"));
    return flattenKeys(content).sort();
};

describe("i18n key parity", () => {
    const namespaceFiles = readdirSync(resolve(localesRoot, "id")).filter(
        (fileName) => fileName.endsWith(".json"),
    );

    test("at least one locale namespace exists", () => {
        expect(namespaceFiles.length).toBeGreaterThan(0);
    });

    test.each(namespaceFiles)(
        "%s has matching keys in id and en",
        (fileName) => {
            const idKeys = readNamespaceKeys("id", fileName);
            const enKeys = readNamespaceKeys("en", fileName);

            expect(enKeys).toEqual(idKeys);
        },
    );
});
