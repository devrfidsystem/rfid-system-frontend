import { ref, type ComputedRef, type Ref } from "vue";
import type { EntityKey } from "@/model/entities";
import type { MasterEntityConfig } from "@/domain/master/entityConfig";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import type { MasterFormField } from "@/domain/master/entityConfig";
import { buildMasterCreatePayload } from "../masterPayload";
import { parseMasterExcelFile } from "../masterExcel";
import { masterService } from "@/services/master.service";
import {
    buildSubmittedDataFromImportRow,
    runImportRows,
    type ImportSummary,
    type MasterImportRow,
} from "./masterImportRows";
import type { MasterSubmittedData } from "./masterFormTypes";

type BuildProductAttributeValues = (
    submittedData: MasterSubmittedData,
) => unknown[] | undefined;

type ApplyLocationWarehouseContext = (
    payload: Record<string, unknown>,
) => Promise<void>;

type AttachCompanyContext = (payload: Record<string, unknown>) => void;

interface UseMasterImportOptions {
    entityKey: ComputedRef<EntityKey>;
    config: ComputedRef<MasterEntityConfig>;
    formFields: ComputedRef<MasterFormField[]>;
    loadError: Ref<string | null>;
    isMasterApiEntity: (key: EntityKey) => key is MasterEntityKey;
    buildProductAttributeValues: BuildProductAttributeValues;
    applyLocationWarehouseContext: ApplyLocationWarehouseContext;
    attachCompanyContext: AttachCompanyContext;
    loadRows: () => Promise<void>;
    notifyError: (message: string) => void;
    notifySuccess: (message: string) => void;
}

const attachAttributeValues = (
    payload: Record<string, unknown>,
    attributeValues: unknown[] | undefined,
) => {
    if (attributeValues?.length) {
        payload.attributeValues = attributeValues;
    }
};

const reportImportSummary = (
    title: string,
    summary: ImportSummary,
    notifyError: (message: string) => void,
    notifySuccess: (message: string) => void,
) => {
    const { createdCount, skippedCount, failures } = summary;
    const summaryParts = [`${createdCount} imported`];
    if (skippedCount) summaryParts.push(`${skippedCount} skipped`);
    if (failures.length) summaryParts.push(`${failures.length} failed`);

    if (failures.length) {
        notifyError(
            `${title}: ${summaryParts.join(", ")}. ${failures.join("; ")}`,
        );
        return;
    }
    if (createdCount) {
        notifySuccess(`${title}: ${summaryParts.join(", ")}.`);
        return;
    }
    notifyError(`${title}: no rows were imported (all rows skipped).`);
};

export function useMasterImport({
    entityKey,
    config,
    formFields,
    loadError,
    isMasterApiEntity,
    buildProductAttributeValues,
    applyLocationWarehouseContext,
    attachCompanyContext,
    loadRows,
    notifyError,
    notifySuccess,
}: UseMasterImportOptions) {
    const isImporting = ref(false);

    const importOneRow = async (
        masterKey: MasterEntityKey,
        row: MasterImportRow,
    ): Promise<"created" | "skipped"> => {
        const submittedData = buildSubmittedDataFromImportRow(
            row,
            formFields.value,
        );
        const payload = buildMasterCreatePayload(masterKey, submittedData);
        if (!Object.keys(payload).length) return "skipped";
        attachAttributeValues(
            payload,
            buildProductAttributeValues(submittedData),
        );
        await applyLocationWarehouseContext(payload);
        attachCompanyContext(payload);
        await masterService.create(masterKey, payload as never);
        return "created";
    };

    const handleImport = async (file: File) => {
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        const masterKey = key as MasterEntityKey;
        isImporting.value = true;
        try {
            const importedRows = await parseMasterExcelFile(file);
            if (!importedRows.length) {
                notifyError("Excel file does not contain data.");
                return;
            }

            const summary = await runImportRows(importedRows, (row) =>
                importOneRow(masterKey, row),
            );
            reportImportSummary(
                config.value.title,
                summary,
                notifyError,
                notifySuccess,
            );

            if (summary.createdCount) await loadRows();
        } finally {
            isImporting.value = false;
        }
    };

    return {
        isImporting,
        handleImport,
    };
}
