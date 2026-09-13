import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Textarea from "./Textarea.vue";

const meta = {
    title: "Atoms/Textarea",
    component: Textarea,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
