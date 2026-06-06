import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ReportLayout from "./ReportLayout.vue";

const meta = {
    title: "Templates/ReportLayout",
    component: ReportLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof ReportLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
