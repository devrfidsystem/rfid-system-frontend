import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Select from "./Select.vue";

const meta = {
    title: "Atoms/Select",
    component: Select,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
