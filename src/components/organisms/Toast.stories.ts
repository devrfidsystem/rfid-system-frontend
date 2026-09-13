import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Toast from "./Toast.vue";

const meta = {
    title: "Organisms/Toast",
    component: Toast,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
