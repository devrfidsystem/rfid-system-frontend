import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Input from "./Input.vue";

const meta = {
    title: "Atoms/Input",
    component: Input,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
