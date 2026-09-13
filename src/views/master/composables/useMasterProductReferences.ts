import { computed, ref, type ComputedRef } from "vue";
import type { EntityKey } from "@/model/entities";
import type { AttributeType } from "@/api/feature/dto/master.dto";
import { masterService } from "@/services/master.service";
import {
    makeProductAttributeFields,
    type ProductAttributeDefinition,
} from "./masterProductAttributes";

type SelectOption = { label: string; value: string };

interface UseMasterProductReferencesOptions {
    entityKey: ComputedRef<EntityKey>;
    authStore: { currentCompanyId?: string | null };
    notifyError: (message: string) => void;
}

const isProductsEntity = (entityKey: EntityKey) => entityKey === "products";

const toSelectOption = (record: { id?: string | number; name?: string }) => ({
    value: String(record.id),
    label: record.name ?? "",
});

export function useMasterProductReferences({
    entityKey,
    authStore,
    notifyError,
}: UseMasterProductReferencesOptions) {
    const uomSelectOptions = ref<SelectOption[]>([]);
    const categorySelectOptions = ref<SelectOption[]>([]);
    const supplierSelectOptions = ref<SelectOption[]>([]);
    const customerSelectOptions = ref<SelectOption[]>([]);
    const productAttributeDefinitions = ref<ProductAttributeDefinition[]>([]);

    const productAttributeFields = computed(() =>
        makeProductAttributeFields(productAttributeDefinitions.value),
    );

    const resetProductReferences = () => {
        uomSelectOptions.value = [];
        categorySelectOptions.value = [];
        supplierSelectOptions.value = [];
        customerSelectOptions.value = [];
        productAttributeDefinitions.value = [];
    };

    const loadProductReferenceData = async () => {
        if (!isProductsEntity(entityKey.value)) {
            resetProductReferences();
            return;
        }

        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const [
                uomRecords,
                categoryRecords,
                supplierRecords,
                customerRecords,
                attributeResponse,
            ] = await Promise.all([
                masterService.fetchOptions("uoms", params),
                masterService.fetchOptions("product-categories", params),
                masterService.fetchOptions("suppliers", params),
                masterService.fetchOptions("customers", params),
                masterService.fetchList("attributes", {
                    ...(params ?? {}),
                    limit: 200,
                }),
            ]);
            const attributeRecords = attributeResponse.items;

            uomSelectOptions.value = uomRecords.map(toSelectOption);
            categorySelectOptions.value = categoryRecords.map(toSelectOption);
            supplierSelectOptions.value = supplierRecords.map(toSelectOption);
            customerSelectOptions.value = customerRecords.map(toSelectOption);
            productAttributeDefinitions.value = attributeRecords.map(
                (attribute) => ({
                    id: String(attribute.id),
                    name: attribute.name,
                    type: attribute.type as AttributeType,
                    items: Array.isArray(attribute.items)
                        ? attribute.items.map((item) => ({
                              id: String(item.id),
                              value: item.value,
                              label: item.label,
                          }))
                        : undefined,
                }),
            );
        } catch {
            notifyError("Gagal memuat referensi produk.");
        }
    };

    return {
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        productAttributeDefinitions,
        productAttributeFields,
        loadProductReferenceData,
    };
}
