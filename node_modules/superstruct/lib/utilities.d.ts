import { Struct, StructType, StructContext } from './struct';
import { ObjectSchema, InferObjectStruct, Assign } from './xtras';
/**
 * Create a new struct that combines the properties properties from multiple
 * object structs.
 *
 * Like JavaScript's `Object.assign` utility.
 */
export declare function assign<A extends ObjectSchema, B extends ObjectSchema>(Structs: [InferObjectStruct<A>, InferObjectStruct<B>]): InferObjectStruct<Assign<A, B>>;
export declare function assign<A extends ObjectSchema, B extends ObjectSchema, C extends ObjectSchema>(Structs: [InferObjectStruct<A>, InferObjectStruct<B>, InferObjectStruct<C>]): InferObjectStruct<Assign<Assign<A, B>, C>>;
export declare function assign<A extends ObjectSchema, B extends ObjectSchema, C extends ObjectSchema, D extends ObjectSchema>(Structs: [InferObjectStruct<A>, InferObjectStruct<B>, InferObjectStruct<C>, InferObjectStruct<D>]): InferObjectStruct<Assign<Assign<Assign<A, B>, C>, D>>;
export declare function assign<A extends ObjectSchema, B extends ObjectSchema, C extends ObjectSchema, D extends ObjectSchema, E extends ObjectSchema>(Structs: [InferObjectStruct<A>, InferObjectStruct<B>, InferObjectStruct<C>, InferObjectStruct<D>, InferObjectStruct<E>]): InferObjectStruct<Assign<Assign<Assign<Assign<A, B>, C>, D>, E>>;
/**
 * Create a struct with dynamic, runtime validation.
 *
 * The callback will receive the value currently being validated, and must
 * return a struct object to validate it with. This can be useful to model
 * validation logic that changes based on its input.
 */
export declare function dynamic<T>(fn: (value: unknown, ctx: StructContext) => Struct<T>): Struct<T>;
/**
 * Create a struct with lazily evaluated validation.
 *
 * The first time validation is run with the struct, the callback will be called
 * and must return a struct object to use. This is useful for cases where you
 * want to have self-referential structs for nested data structures to avoid a
 * circular definition problem.
 */
export declare function lazy<T>(fn: () => Struct<T>): Struct<T>;
/**
 * Create a new struct based on an existing object struct, but excluding
 * specific properties.
 *
 * Like TypeScript's `Omit` utility.
 */
export declare function omit<S extends ObjectSchema, K extends keyof S>(struct: InferObjectStruct<S>, keys: K[]): InferObjectStruct<Omit<S, K>>;
/**
 * Create a new struct based on an existing object struct, but with all of its
 * properties allowed to be `undefined`.
 *
 * Like TypeScript's `Partial` utility.
 */
export declare function partial<S extends ObjectSchema>(struct: InferObjectStruct<S> | S): InferObjectStruct<{
    [K in keyof S]: Struct<StructType<S[K]> | undefined>;
}>;
/**
 * Create a new struct based on an existing object struct, but only including
 * specific properties.
 *
 * Like TypeScript's `Pick` utility.
 */
export declare function pick<S extends ObjectSchema, K extends keyof S>(struct: InferObjectStruct<S>, keys: K[]): InferObjectStruct<Pick<S, K>>;
/**
 * Create a new struct with a custom validation function.
 */
export declare function struct<T>(name: string, validator: Struct<T>['validator']): Struct<T, null>;
