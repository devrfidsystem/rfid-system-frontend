import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DataTable from "./DataTable.vue";

const meta = {
    title: "Organisms/DataTable/DataTable",
    component: DataTable,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
