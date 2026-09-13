import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DataTableEmpty from "./DataTableEmpty.vue";

const meta = {
    title: "Organisms/DataTable/DataTableEmpty",
    component: DataTableEmpty,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof DataTableEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
