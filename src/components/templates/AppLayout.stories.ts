import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AppLayout from "./AppLayout.vue";

const meta = {
    title: "Templates/AppLayout",
    component: AppLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
