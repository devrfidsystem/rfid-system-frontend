import type { Component } from 'vue';
import TextField from '@/app/ui/fields/TextField.vue';
import SelectField from '@/app/ui/fields/SelectField.vue';
import DateField from '@/app/ui/fields/DateField.vue';

import type { FieldType } from './types';

export const FIELD_MAP: Record<FieldType, Component> = {
  text: TextField,
  select: SelectField,
  date: DateField,
  number: TextField
};
