import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PageHeader from "./PageHeader.vue";

const meta = {
    title: "Molecules/PageHeader",
    component: PageHeader,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
