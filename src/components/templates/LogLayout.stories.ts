import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogLayout from "./LogLayout.vue";

const meta = {
    title: "Templates/LogLayout",
    component: LogLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof LogLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
