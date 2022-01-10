export declare class InvariantError extends Error {
    framesToPop: number;
    name: string;
    constructor(message?: string | number);
}
export declare function invariant(condition: any, message?: string | number): asserts condition;
declare const verbosityLevels: readonly ["debug", "log", "warn", "error", "silent"];
export declare type VerbosityLevel = (typeof verbosityLevels)[number];
export declare type ConsoleMethodName = Exclude<VerbosityLevel, "silent">;
export declare namespace invariant {
    const debug: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    const log: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    const warn: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    const error: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
}
export declare function setVerbosity(level: VerbosityLevel): VerbosityLevel;
export default invariant;
