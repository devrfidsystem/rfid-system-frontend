import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DataTablePagination from "./DataTablePagination.vue";

const meta = {
    title: "Organisms/DataTable/DataTablePagination",
    component: DataTablePagination,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof DataTablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
