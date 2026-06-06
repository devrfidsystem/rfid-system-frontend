import type { Meta, StoryObj } from "@storybook/vue3-vite";
import IamLayout from "./IamLayout.vue";

const meta = {
    title: "Templates/IamLayout",
    component: IamLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof IamLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
