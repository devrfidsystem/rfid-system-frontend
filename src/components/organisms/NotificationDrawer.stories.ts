import type { Meta, StoryObj } from "@storybook/vue3-vite";
import NotificationDrawer from "./NotificationDrawer.vue";

const meta = {
    title: "Organisms/NotificationDrawer",
    component: NotificationDrawer,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof NotificationDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
