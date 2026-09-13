import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Breadcrumb from "./Breadcrumb.vue";

const meta = {
    title: "Molecules/Breadcrumb",
    component: Breadcrumb,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
