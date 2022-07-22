import type { Param, Params } from '../types';

type ParamName = Param[0];
type ParamConstraint = ParamName | [...ParamName[]] | '*';

export type ParamConstraints =
  | [...ParamConstraint[]]
  | [...ParamConstraint[], '...'];

type GetParamByName<T> = T extends '*'
  ? Param
  : T extends (infer TNames extends ParamName)[]
  ? Extract<Param, readonly [TNames, ...unknown[]]>
  : T extends ParamName
  ? Extract<Param, readonly [T, ...unknown[]]>
  : never;

export type MapParams<
  TNames extends ParamConstraints,
  TRes extends Param[] = []
> = TNames extends [infer THead, ...infer TTail extends ParamConstraints]
  ? THead extends '...'
    ? [...TRes, ...Params]
    : MapParams<TTail, [...TRes, GetParamByName<THead>]>
  : TRes;

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
  message: string
): asserts params is MapParams<T> {
  if (!isValidParams(params, constraints)) {
    throw new Error(message);
  }
}
