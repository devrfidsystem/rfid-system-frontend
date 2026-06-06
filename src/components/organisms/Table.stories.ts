import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Table from "./Table.vue";

const meta = {
    title: "Organisms/Table",
    component: Table,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
