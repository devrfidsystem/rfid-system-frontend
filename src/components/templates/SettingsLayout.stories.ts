import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SettingsLayout from "./SettingsLayout.vue";

const meta = {
    title: "Templates/SettingsLayout",
    component: SettingsLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof SettingsLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
