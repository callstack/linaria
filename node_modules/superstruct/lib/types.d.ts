import { Struct, StructType, StructContext } from './struct';
import { StructRecord, StructTuple } from './utils';
/**
 * Validate any value.
 */
export declare function any(): Struct<any>;
/**
 * Validate that an array of values of a specific type.
 */
export declare function array(): Struct<unknown[]>;
export declare function array<T>(Element: Struct<T>): Struct<T[], Struct<T>>;
/**
 * Validate that boolean values.
 */
export declare function boolean(): Struct<boolean>;
/**
 * Validate that `Date` values.
 *
 * Note: this also ensures that the value is *not* an invalid `Date` object,
 * which can occur when parsing a date fails but still returns a `Date`.
 */
export declare function date(): Struct<Date>;
/**
 * Validate that a value dynamically, determing which struct to use at runtime.
 */
export declare function dynamic<T>(fn: (value: unknown, ctx: StructContext) => Struct<T>): Struct<T>;
/**
 * Validate that a value against a set of potential values.
 */
export declare function enums<T extends number>(values: T[]): Struct<T>;
export declare function enums<T extends string>(values: T[]): Struct<T>;
/**
 * Validate that a value is a function.
 */
export declare function func(): Struct<Function>;
/**
 * Validate that a value is an instance of a class.
 */
export declare function instance<T extends {
    new (...args: any): any;
}>(Class: T): Struct<InstanceType<T>>;
/**
 * Validate that a value matches all of a set of structs.
 */
export declare function intersection<A>(Structs: StructTuple<[A]>): Struct<A>;
export declare function intersection<A, B>(Structs: StructTuple<[A, B]>): Struct<A & B>;
export declare function intersection<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<A & B & C>;
export declare function intersection<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<A & B & C & D>;
export declare function intersection<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<A & B & C & D & E>;
export declare function intersection<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<A & B & C & D & E & F>;
export declare function intersection<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<A & B & C & D & E & F & G>;
export declare function intersection<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<A & B & C & D & E & F & G & H>;
export declare function intersection<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<A & B & C & D & E & F & G & H & I>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<A & B & C & D & E & F & G & H & I & J>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<A & B & C & D & E & F & G & H & I & J & K>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O & P>;
export declare function intersection<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<A & B & C & D & E & F & G & H & I & J & K & L & M & N & O & P & Q>;
/**
 * Validate a value lazily, by constructing the struct right before the first
 * validation. This is useful for cases where you want to have self-referential
 * structs for nested data structures.
 */
export declare function lazy<T>(fn: () => Struct<T>): Struct<T>;
/**
 * Validate that a value is a specific constant.
 */
export declare function literal<T extends boolean>(constant: T): Struct<T>;
export declare function literal<T extends number>(constant: T): Struct<T>;
export declare function literal<T extends string>(constant: T): Struct<T>;
export declare function literal<T>(constant: T): Struct<T>;
/**
 * Validate that a value is a map with specific key and value entries.
 */
export declare function map<K, V>(Key: Struct<K>, Value: Struct<V>): Struct<Map<K, V>>;
/**
 * Validate that a value always fails.
 */
export declare function never(): Struct<never>;
/**
 * Augment a struct to make it accept `null` values.
 */
export declare function nullable<T>(S: Struct<T>): Struct<T | null>;
/**
 * Validate that a value is a number.
 */
export declare function number(): Struct<number>;
/**
 * Type helper to Flatten the Union of optional and required properties.
 */
declare type Flatten<T> = T extends infer U ? {
    [K in keyof U]: U[K];
} : never;
/**
 * Type helper to extract the optional keys of an object
 */
declare type OptionalKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
/**
 * Type helper to extract the required keys of an object
 */
declare type RequiredKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];
/**
 * Type helper to create optional properties when the property value can be
 * undefined (ie. when `optional()` is used to define a type)
 */
declare type OptionalizeObject<T> = Flatten<{
    [K in RequiredKeys<T>]: T[K];
} & {
    [K in OptionalKeys<T>]?: T[K];
}>;
/**
 * Validate that an object with specific entry values.
 */
export declare function object<V extends StructRecord<any>>(): Struct<Record<string, unknown>>;
export declare function object<V extends StructRecord<any>>(Structs: V): Struct<OptionalizeObject<{
    [K in keyof V]: StructType<V[K]>;
}>, V>;
/**
 * Augment a struct to make it optionally accept `undefined` values.
 */
export declare function optional<T>(S: Struct<T>): Struct<T | undefined>;
/**
 * Validate that a partial object with specific entry values.
 */
export declare function partial<T, V extends StructRecord<any>>(Structs: V | Struct<T, V>): Struct<{
    [K in keyof V]?: StructType<V[K]>;
}>;
/**
 * Validate that a value is a record with specific key and
 * value entries.
 */
export declare function record<K extends string | number, V>(Key: Struct<K>, Value: Struct<V>): Struct<Record<K, V>>;
/**
 * Validate that a set of values matches a specific type.
 */
export declare function set<T>(Element: Struct<T>): Struct<Set<T>>;
/**
 * Validate that a value is a string.
 */
export declare function string(): Struct<string>;
/**
 * Define a `Struct` instance with a type and validation function.
 */
export declare function struct<T>(name: string, validator: Struct<T>['validator']): Struct<T, null>;
/**
 * Validate that a value is a tuple with entries of specific types.
 */
export declare function tuple<A>(Structs: StructTuple<[A]>): Struct<A>;
export declare function tuple<A, B>(Structs: StructTuple<[A, B]>): Struct<[A, B]>;
export declare function tuple<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<[A, B, C]>;
export declare function tuple<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<[A, B, C, D]>;
export declare function tuple<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<[A, B, C, D, E]>;
export declare function tuple<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<[A, B, C, D, E, F]>;
export declare function tuple<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<[A, B, C, D, E, F, G]>;
export declare function tuple<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<[A, B, C, D, E, F, G, H]>;
export declare function tuple<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<[A, B, C, D, E, F, G, H, I]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<[A, B, C, D, E, F, G, H, I, J]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<[A, B, C, D, E, F, G, H, I, J, K]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>;
export declare function tuple<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>;
/**
 * Validate that a value matches a specific strutural interface, like the
 * structural typing that TypeScript uses.
 */
export declare function type<V extends StructRecord<any>>(Structs: V): Struct<{
    [K in keyof V]: StructType<V[K]>;
}>;
/**
 * Validate that a value is one of a set of types.
 */
export declare function union<A>(Structs: StructTuple<[A]>): Struct<A>;
export declare function union<A, B>(Structs: StructTuple<[A, B]>): Struct<A | B>;
export declare function union<A, B, C>(Structs: StructTuple<[A, B, C]>): Struct<A | B | C>;
export declare function union<A, B, C, D>(Structs: StructTuple<[A, B, C, D]>): Struct<A | B | C | D>;
export declare function union<A, B, C, D, E>(Structs: StructTuple<[A, B, C, D, E]>): Struct<A | B | C | D | E>;
export declare function union<A, B, C, D, E, F>(Structs: StructTuple<[A, B, C, D, E, F]>): Struct<A | B | C | D | E | F>;
export declare function union<A, B, C, D, E, F, G>(Structs: StructTuple<[A, B, C, D, E, F, G]>): Struct<A | B | C | D | E | F | G>;
export declare function union<A, B, C, D, E, F, G, H>(Structs: StructTuple<[A, B, C, D, E, F, G, H]>): Struct<A | B | C | D | E | F | G | H>;
export declare function union<A, B, C, D, E, F, G, H, I>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I]>): Struct<A | B | C | D | E | F | G | H | I>;
export declare function union<A, B, C, D, E, F, G, H, I, J>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J]>): Struct<A | B | C | D | E | F | G | H | I | J>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K]>): Struct<A | B | C | D | E | F | G | H | I | J | K>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P>;
export declare function union<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(Structs: StructTuple<[A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q]>): Struct<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q>;
export {};
//# sourceMappingURL=types.d.ts.map