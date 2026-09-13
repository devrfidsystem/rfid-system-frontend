import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DataTableToolbar from "./DataTableToolbar.vue";

const meta = {
    title: "Organisms/DataTable/DataTableToolbar",
    component: DataTableToolbar,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof DataTableToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
