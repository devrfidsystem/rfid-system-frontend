import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Sidebar from "./Sidebar.vue";

const meta = {
    title: "Organisms/Sidebar",
    component: Sidebar,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
