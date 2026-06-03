declare module "@storybook/vue3-vite" {
    // Storybook types are used in dev-only story files. Allow `any` here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export type Meta<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export type StoryObj<T> = any;
}

declare module "storybook/test" {
    // Development test helpers — allow `any` for storybook test helpers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const fn: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const expect: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const userEvent: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const within: any;
}
