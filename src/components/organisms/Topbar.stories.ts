import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Topbar from "./Topbar.vue";

const meta = {
    title: "Organisms/Topbar",
    component: Topbar,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
