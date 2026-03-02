import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z, type ZodTypeAny } from 'zod';

export function useZodForm<TSchema extends ZodTypeAny>(
  schema: TSchema,
  initialValues: z.infer<TSchema>
) {
  const {
    handleSubmit,
    meta,
    errors,
    resetForm,
    setFieldValue,
    isSubmitting
  } = useForm<z.infer<TSchema>>({
    validationSchema: toTypedSchema(schema),
    initialValues
  });

  return {
    handleSubmit,
    meta,
    errors,
    resetForm,
    setFieldValue,
    isSubmitting
  } as const;
}
