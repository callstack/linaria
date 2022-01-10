import { Struct } from './struct';
/**
 * A `StructContext` contains information about the current value being
 * validated as well as helper functions for failures and recursive validating.
 */
export declare type Context = {
    value: any;
    type: string;
    refinement: string | undefined;
    branch: Array<any>;
    path: Array<string | number>;
    fail: (props?: Partial<Failure>) => Failure;
    check: <T, S>(value: any, struct: Struct<T, S>, parent?: any, key?: string | number) => Iterable<Failure>;
};
/**
 * A `StructFailure` represents a single specific failure in validation.
 */
export declare type Failure = {
    value: Context['value'];
    type: Context['type'];
    refinement: Context['refinement'];
    branch: Context['branch'];
    path: Context['path'];
    [key: string]: any;
};
/**
 * A type utility to extract the type from a `Struct` class.
 */
export declare type Infer<T extends Struct<any, any>> = T['TYPE'];
/**
 * A `StructResult` is returned from validation functions.
 */
export declare type Result = boolean | Iterable<Failure>;
export declare type Coercer = (value: unknown) => unknown;
export declare type Validator = (value: unknown, context: Context) => Result;
export declare type Refiner<T> = (value: T, context: Context) => Result;
