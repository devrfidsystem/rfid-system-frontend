import type { Meta, StoryObj } from "@storybook/vue3-vite";
import FormField from "./FormField.vue";

const meta = {
    title: "Molecules/FormField",
    component: FormField,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
