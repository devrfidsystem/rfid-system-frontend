import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MasterLayout from "./MasterLayout.vue";

const meta = {
    title: "Templates/MasterLayout",
    component: MasterLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof MasterLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
