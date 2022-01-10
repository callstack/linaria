/**
 * `Struct` objects encapsulate the schema for a specific data type (with
 * optional coercion). You can then use the `assert`, `is` or `validate` helpers
 * to validate unknown data against a struct.
 */
export declare class Struct<T, S = any> {
    type: string;
    schema: S;
    coercer: (value: unknown) => unknown;
    validator: (value: unknown, context: StructContext) => StructResult;
    refiner: (value: T, context: StructContext) => StructResult;
    constructor(props: {
        type: Struct<T>['type'];
        schema: S;
        coercer?: Struct<T>['coercer'];
        validator?: Struct<T>['validator'];
        refiner?: Struct<T>['refiner'];
    });
}
/**
 * `StructError` objects are thrown (or returned) by Superstruct when its
 * validation fails. The error represents the first error encountered during
 * validation. But they also have an `error.failures` property that holds
 * information for all of the failures encountered.
 */
export declare class StructError extends TypeError {
    value: any;
    type: string;
    path: Array<number | string>;
    branch: Array<any>;
    failures: () => Iterable<StructFailure>;
    [key: string]: any;
    constructor(failure: StructFailure, iterable: Iterable<StructFailure>);
}
/**
 * A `StructContext` contains information about the current value being
 * validated as well as helper functions for failures and recursive validating.
 */
export declare type StructContext = {
    value: any;
    type: string;
    branch: Array<any>;
    path: Array<string | number>;
    fail: (props?: Partial<StructFailure>) => StructFailure;
    check: (value: any, struct: Struct<any> | Struct<never>, parent?: any, key?: string | number) => Iterable<StructFailure>;
};
/**
 * A `StructFailure` represents a single specific failure in validation.
 */
export declare type StructFailure = {
    value: StructContext['value'];
    type: StructContext['type'];
    branch: StructContext['branch'];
    path: StructContext['path'];
    [key: string]: any;
};
/**
 * A `StructResult` is returned from validation functions.
 */
export declare type StructResult = boolean | Iterable<StructFailure>;
/**
 * A type utility to extract the type from a `Struct` class.
 */
export declare type StructType<T extends Struct<any>> = Parameters<T['refiner']>[0];
/**
 * Assert that a value passes a `Struct`, throwing if it doesn't.
 */
export declare function assert<T>(value: unknown, struct: Struct<T>): asserts value is T;
/**
 * Coerce a value with the coercion logic of `Struct` and validate it.
 */
export declare function coerce<T>(value: unknown, struct: Struct<T>): T;
/**
 * Check if a value passes a `Struct`.
 */
export declare function is<T>(value: unknown, struct: Struct<T>): value is T;
/**
 * Validate a value against a `Struct`, returning an error if invalid.
 */
export declare function validate<T>(value: unknown, struct: Struct<T>, coercing?: boolean): [StructError, undefined] | [undefined, T];
