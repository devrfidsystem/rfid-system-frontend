import type { ZodTypeAny } from 'zod';
import type { Component } from 'vue';

export type FieldType = 'text' | 'select' | 'date' | 'number';

export interface FormFieldConfig {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: { label: string; value: string }[];
  inputType?: 'text' | 'number' | 'email' | 'password';
  colSpan?: 1 | 2;
  readonly?: boolean;
  visibleIf?: (values: Record<string, unknown>) => boolean;
  loading?: boolean;
}

export interface FormBuilderProps {
  schema: ZodTypeAny;
  fields: FormFieldConfig[];
  readonly?: boolean;
}
