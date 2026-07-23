import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AppLayout from "./AppLayout.vue";

const meta = {
    title: "Templates/AppLayout",
    component: AppLayout,
    tags: ["autodocs"],
    argTypes: {},
    args: {},
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => ({
        components: { AppLayout },
        template: `
            <AppLayout>
                <section class="space-y-4">
                    <div class="rounded-lg border border-border bg-surface p-6">
                        <p class="text-sm font-semibold text-text">Sample page content</p>
                        <p class="mt-1 text-sm text-text-secondary">
                            Layout content renders here through the slot fallback.
                        </p>
                    </div>
                </section>
            </AppLayout>
        `,
    }),
};
