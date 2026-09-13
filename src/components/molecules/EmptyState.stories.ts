import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EmptyState from "./EmptyState.vue";

const meta = {
    title: "Molecules/EmptyState",
    component: EmptyState,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
