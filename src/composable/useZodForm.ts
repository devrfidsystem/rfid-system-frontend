import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { ZodTypeAny } from "zod";

type FormValues = Record<string, unknown>;

export function useZodForm<TSchema extends ZodTypeAny>(
    _schema: TSchema,
    _initialValues?: FormValues,
) {
    return useForm({
        validationSchema: toTypedSchema(_schema),
        initialValues: _initialValues,
    });
}
