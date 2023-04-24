import type { Param, Params } from '../types';

type ParamName = Param[0];
type ParamConstraint = ParamName | [...ParamName[]] | '*';

export type ParamConstraints =
  | [...ParamConstraint[]]
  | [...ParamConstraint[], '...'];

// ParamMapping maps each ParamName to its corresponding Param type.
type ParamMapping = {
  [K in ParamName]: Extract<Param, readonly [K, ...unknown[]]>; // For each ParamName K, extract the corresponding Param type.
};

// GetParamByName returns the Param type based on the input type T.
type GetParamByName<T> = T extends '*'
  ? Param // If T is '*', return Param type.
  : T extends keyof ParamMapping // If T is a key in ParamMapping (i.e., a ParamName).
  ? ParamMapping[T] // Return the corresponding Param type from ParamMapping.
  : T extends Array<infer TNames> // If T is an array of names.
  ? TNames extends ParamName // If TNames is a ParamName.
    ? Extract<Param, readonly [TNames, ...unknown[]]> // Return the corresponding Param type.
    : never // If TNames is not a ParamName, return never.
  : never; // If T is none of the above, return never.

// MapParams iteratively maps the input ParamConstraints to their corresponding Param types.
export type MapParams<
  TNames extends ParamConstraints,
  TRes extends Param[] = []
> = TNames extends [infer THead, ...infer TTail] // If TNames is a non-empty tuple.
  ? THead extends '...' // If the first element in the tuple is '...'.
    ? [...TRes, ...Params] // Append all Params to the result tuple.
    : MapParams<
        Extract<TTail, ParamConstraints>, // Extract the remaining ParamConstraints.
        [...TRes, GetParamByName<Extract<THead, ParamName | '*' | ParamName[]>>] // Append the mapped Param to the result tuple and recurse.
      >
  : TRes; // If TNames is an empty tuple, return the result tuple.

export function isValidParams<T extends ParamConstraints>(
  params: Params,
  constraints: T
): params is MapParams<T> {
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i];
    if (constraint === '...') {
      return true;
    }

    if (constraint === '*') {
      if (params[i] === undefined) {
        return false;
      }
    } else if (Array.isArray(constraint)) {
      if (constraint.every((c) => c !== params[i]?.[0])) {
        return false;
      }
    } else if (constraint !== params[i]?.[0]) {
      return false;
    }
  }

  return true;
}

export function validateParams<T extends ParamConstraints>(
  params: Params,
  constraints: T,
  messageOrError: unknown
): asserts params is MapParams<T> {
  if (!isValidParams(params, constraints)) {
    if (typeof messageOrError === 'string') {
      throw new Error(messageOrError);
    }

    throw messageOrError;
  }
}
