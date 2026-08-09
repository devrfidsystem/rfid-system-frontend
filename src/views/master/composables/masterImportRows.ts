import type { MasterFormField } from "@/domain/master/entityConfig";
import type { MasterFormValue, MasterSubmittedData } from "./masterFormTypes";

export type MasterImportRow = Record<string, string>;

export type ImportSummary = {
    createdCount: number;
    skippedCount: number;
    failures: string[];
};

export type ImportOutcome = "created" | "skipped";

export const resolveImportFieldValue = (
    row: MasterImportRow,
    field: MasterFormField,
) => row[field.key] ?? row[field.label] ?? "";

export const buildSubmittedDataFromImportRow = (
    row: MasterImportRow,
    fields: MasterFormField[],
): MasterSubmittedData =>
    fields.reduce<Record<string, MasterFormValue>>((acc, field) => {
        if (field.type === "file") return acc;
        const value = resolveImportFieldValue(row, field);
        if (value) {
            acc[field.key] = value;
        }
        return acc;
    }, {});

export const describeImportRow = (row: MasterImportRow, index: number) => {
    const label = row.name ?? row.Name ?? row.code ?? row.Code;
    return label ? `Row ${index + 1} (${label})` : `Row ${index + 1}`;
};

export const runImportRows = async (
    rows: MasterImportRow[],
    importOneRow: (row: MasterImportRow) => Promise<ImportOutcome>,
): Promise<ImportSummary> => {
    const summary: ImportSummary = {
        createdCount: 0,
        skippedCount: 0,
        failures: [],
    };

    for (const [index, row] of rows.entries()) {
        try {
            const outcome = await importOneRow(row);
            if (outcome === "created") {
                summary.createdCount += 1;
            } else {
                summary.skippedCount += 1;
            }
        } catch (error) {
            const reason =
                error instanceof Error ? error.message : "Unknown error";
            summary.failures.push(
                `${describeImportRow(row, index)}: ${reason}`,
            );
        }
    }

    return summary;
};
