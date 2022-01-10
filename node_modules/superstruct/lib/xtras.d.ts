import { Struct, StructResult, StructFailure, StructContext, StructType } from './struct';
export declare type StructRecord<T> = Record<string, Struct<T>>;
export declare type StructTuple<T> = {
    [K in keyof T]: Struct<T[K]>;
};
/**
 * Convert a validation result to an iterable of failures.
 */
export declare function toFailures(result: StructResult, context: StructContext): Iterable<StructFailure>;
/**
 * A schema for tuple structs.
 */
export declare type TupleSchema<T> = {
    [K in keyof T]: Struct<T[K]>;
};
/**
 * A schema for object structs.
 */
export declare type ObjectSchema = Record<string, Struct<any>>;
/**
 * Infer a type from an object struct schema.
 */
export declare type InferObjectType<S extends ObjectSchema> = Simplify<Optionalize<{
    [K in keyof S]: StructType<S[K]>;
}>>;
/**
 * Infer a struct type from an object struct schema.
 */
export declare type InferObjectStruct<S extends ObjectSchema> = Struct<InferObjectType<S>, S>;
/**
 * Normalize properties of a type that allow `undefined` to make them optional.
 */
declare type Optionalize<S extends object> = OmitBy<S, undefined> & Partial<PickBy<S, undefined>>;
/**
 * Omit properties from a type that extend from a specific type.
 */
declare type OmitBy<T, V> = Omit<T, {
    [K in keyof T]: V extends Extract<T[K], V> ? K : never;
}[keyof T]>;
/**
 * Pick properties from a type that extend from a specific type.
 */
declare type PickBy<T, V> = Pick<T, {
    [K in keyof T]: V extends Extract<T[K], V> ? K : never;
}[keyof T]>;
/**
 * Simplifies a type definition to its most basic representation.
 */
declare type Simplify<T> = T extends any[] | Date ? T : {
    [Key in keyof T]: T[Key];
} & {};
/**
 * Assign properties from one type to another, overwriting existing.
 */
export declare type Assign<T, U> = Simplify<U & Omit<T, keyof U>>;
export {};
