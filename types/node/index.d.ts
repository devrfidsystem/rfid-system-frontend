declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
    }
}

declare let process: NodeJS.Process;
