import { read, utils, writeFile } from "xlsx";

export type MasterExcelColumn = {
    key: string;
    label: string;
    accessor?: (row: Record<string, unknown>) => unknown;
};

type BuildMasterExcelRowsArgs = {
    rows: Record<string, unknown>[];
    columns: MasterExcelColumn[];
};

type ExportMasterRowsToExcelArgs = BuildMasterExcelRowsArgs & {
    filename: string;
    sheetName: string;
};

type ExportMasterTemplateToExcelArgs = {
    columns: MasterExcelColumn[];
    filename: string;
    sheetName: string;
};

const normalizeSheetName = (sheetName: string) =>
    sheetName.replace(/[:\\/?*\[\]]/g, " ").slice(0, 31) || "Master Data";

const formatExcelValue = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
        return value.slice(0, 10);
    }
    if (typeof value === "object") return JSON.stringify(value);
    return value;
};

const normalizeImportValue = (value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
};

const isEmptyImportRow = (row: Record<string, string>) =>
    Object.values(row).every((value) => !value);

export const buildMasterExcelRows = ({
    rows,
    columns,
}: BuildMasterExcelRowsArgs) =>
    rows.map((row) =>
        columns.reduce<Record<string, unknown>>((acc, column) => {
            const value = column.accessor
                ? column.accessor(row)
                : row[column.key];
            acc[column.label] = formatExcelValue(value);
            return acc;
        }, {}),
    );

export const buildMasterWorkbook = ({
    rows,
    columns,
    sheetName,
}: BuildMasterExcelRowsArgs & { sheetName: string }) => {
    const worksheet = utils.json_to_sheet(
        buildMasterExcelRows({ rows, columns }),
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, normalizeSheetName(sheetName));
    return workbook;
};

export const buildMasterTemplateWorkbook = ({
    columns,
    sheetName,
}: {
    columns: MasterExcelColumn[];
    sheetName: string;
}) => {
    const worksheet = utils.json_to_sheet(
        [
            columns.reduce<Record<string, string>>((acc, column) => {
                acc[column.label] = "";
                return acc;
            }, {}),
        ],
        { skipHeader: false },
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, normalizeSheetName(sheetName));
    return workbook;
};

export const exportMasterRowsToExcel = ({
    rows,
    columns,
    filename,
    sheetName,
}: ExportMasterRowsToExcelArgs) => {
    writeFile(buildMasterWorkbook({ rows, columns, sheetName }), filename);
};

export const exportMasterTemplateToExcel = ({
    columns,
    filename,
    sheetName,
}: ExportMasterTemplateToExcelArgs) => {
    writeFile(buildMasterTemplateWorkbook({ columns, sheetName }), filename);
};

export const parseMasterExcelFile = async (
    file: File,
): Promise<Record<string, string>[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
    });

    return rows
        .map((row) =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key.trim(),
                    normalizeImportValue(value),
                ]),
            ),
        )
        .filter((row) => !isEmptyImportRow(row));
};
