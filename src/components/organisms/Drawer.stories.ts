import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Drawer from "./Drawer.vue";

const meta = {
    title: "Organisms/Drawer",
    component: Drawer,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
