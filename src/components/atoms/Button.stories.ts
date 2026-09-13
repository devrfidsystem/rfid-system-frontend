import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Button from "./Button.vue";

const meta = {
    title: "Atoms/Button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
