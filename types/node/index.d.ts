declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
    }

    interface Process {
        cwd(): string;
    }
}

declare let process: NodeJS.Process;

declare module "node:fs" {
    export interface Dirent {
        name: string;
        isDirectory(): boolean;
    }

    export function existsSync(path: string): boolean;
    export function readFileSync(path: string, encoding: "utf8"): string;
    export function readdirSync(
        path: string,
        options: { withFileTypes: true },
    ): Dirent[];
}

declare module "node:path" {
    export function resolve(...paths: string[]): string;
}
