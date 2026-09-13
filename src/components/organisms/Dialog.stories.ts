import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Dialog from "./Dialog.vue";

const meta = {
    title: "Organisms/Dialog",
    component: Dialog,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
