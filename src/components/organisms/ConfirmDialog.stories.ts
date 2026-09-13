import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ConfirmDialog from "./ConfirmDialog.vue";

const meta = {
    title: "Organisms/ConfirmDialog",
    component: ConfirmDialog,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
