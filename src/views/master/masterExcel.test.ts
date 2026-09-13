import { describe, expect, it } from "vitest";
import { utils, write } from "xlsx";
import {
    buildMasterExcelRows,
    buildMasterTemplateWorkbook,
    buildMasterWorkbook,
    parseMasterExcelFile,
    type MasterExcelColumn,
} from "./masterExcel";

const columns: MasterExcelColumn[] = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "createdAt", label: "Created At" },
];

describe("masterExcel", () => {
    it("builds export rows with column labels and formatted values", () => {
        const rows = buildMasterExcelRows({
            rows: [
                {
                    code: "SKU-001",
                    name: "Box",
                    createdAt: "2026-07-23T08:00:00.000Z",
                },
            ],
            columns,
        });

        expect(rows).toEqual([
            {
                Code: "SKU-001",
                Name: "Box",
                "Created At": "2026-07-23",
            },
        ]);
    });

    it("parses the first Excel worksheet into object rows", async () => {
        const worksheet = utils.json_to_sheet([
            { Name: "Retail Partner", Phone: "08123456789" },
        ]);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Customers");
        const buffer = write(workbook, {
            type: "array",
            bookType: "xlsx",
        }) as ArrayBuffer;
        const file = new File([buffer], "customers.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await expect(parseMasterExcelFile(file)).resolves.toEqual([
            { Name: "Retail Partner", Phone: "08123456789" },
        ]);
    });

    it("builds an xlsx workbook with a normalized sheet name", () => {
        const workbook = buildMasterWorkbook({
            rows: [{ code: "SKU-001", name: "Box" }],
            columns,
            sheetName: "Products/Import:Export",
        });

        expect(workbook.SheetNames).toEqual(["Products Import Export"]);
    });

    it("builds a template workbook with import headers and one blank row", () => {
        const workbook = buildMasterTemplateWorkbook({
            columns,
            sheetName: "Customers",
        });
        const worksheet = workbook.Sheets.Customers;
        const rows = utils.sheet_to_json<Record<string, string>>(worksheet, {
            defval: "",
        });

        expect(rows).toEqual([
            {
                Code: "",
                Name: "",
                "Created At": "",
            },
        ]);
    });
});
