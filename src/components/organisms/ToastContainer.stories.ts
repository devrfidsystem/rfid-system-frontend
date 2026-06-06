import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ToastContainer from "./ToastContainer.vue";

const meta = {
    title: "Organisms/ToastContainer",
    component: ToastContainer,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
