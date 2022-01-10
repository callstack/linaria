import { Struct } from './struct';
/**
 * Augment a `Struct` to add an additional coercion step to its input.
 */
export declare function coercion<T>(struct: Struct<T>, coercer: Struct<T>['coercer']): Struct<T>;
/**
 * Augment a struct to coerce a default value for missing values.
 *
 * Note: You must use `coerce(value, Struct)` on the value before validating it
 * to have the value defaulted!
 */
export declare function defaulted<T>(S: Struct<T>, fallback: any, strict?: true): Struct<T>;
/**
 * Coerce a value to mask its properties to only that defined in the struct.
 */
export declare function masked<T extends {
    [key: string]: any;
}, V extends Record<string, Struct<any>>>(S: Struct<T, V>): Struct<T>;
