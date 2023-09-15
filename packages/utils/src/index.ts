export {
  addIdentifierToLinariaPreval,
  getOrAddLinariaPreval,
} from './addIdentifierToLinariaPreval';
export {
  default as asyncResolveFallback,
  syncResolve,
} from './asyncResolveFallback';
export {
  collectExportsAndImports,
  explicitImport,
  sideEffectImport,
} from './collectExportsAndImports';
export {
  collectTemplateDependencies,
  extractExpression,
} from './collectTemplateDependencies';
export { createId } from './createId';
export { createFileReporter } from './debug/fileReporter';
export { createPerfMeter } from './debug/perfMetter';
export {
  EventEmitter,
  OnActionFinishArgs,
  OnActionStartArgs,
} from './EventEmitter';
export { default as findIdentifiers, nonType } from './findIdentifiers';
export { findPackageJSON } from './findPackageJSON';
export { hasEvaluatorMetadata } from './hasEvaluatorMetadata';
export { default as getFileIdx } from './getFileIdx';
export { getPluginKey } from './getPluginKey';
export { hasMeta } from './hasMeta';
export { getSource } from './getSource';
export { isBoxedPrimitive } from './isBoxedPrimitive';
export { default as isExports } from './isExports';
export { default as isNotNull } from './isNotNull';
export { default as isRemoved } from './isRemoved';
export { default as isRequire } from './isRequire';
export { isSerializable } from './isSerializable';
export { default as isTypedNode } from './isTypedNode';
export { isUnnecessaryReactCall } from './isUnnecessaryReactCall';
export * from './options';
export { removeDangerousCode } from './removeDangerousCode';
export {
  applyAction,
  mutate,
  removeWithRelated,
  findActionForNode,
  dereference,
  reference,
  referenceAll,
} from './scopeHelpers';
export { default as slugify } from './slugify';
export {
  clearBabelTraversalCache,
  invalidateTraversalCache,
  getTraversalCache,
} from './traversalCache';
export { ValueType } from './types';
export { valueToLiteral } from './valueToLiteral';
export { default as JSXElementsRemover } from './visitors/JSXElementsRemover';

export type {
  Exports,
  IImport,
  IReexport,
  ISideEffectImport,
  IState,
} from './collectExportsAndImports';
export type { IFileReporterOptions } from './debug/fileReporter';
export type { IPerfMeterOptions } from './debug/perfMetter';
export type { OnEvent } from './EventEmitter';
export type { IVariableContext } from './IVariableContext';
export type {
  Artifact,
  BuildCodeFrameErrorFn,
  ConstValue,
  ExpressionValue,
  FunctionValue,
  ICSSRule,
  IEvaluatorMetadata,
  IMetadata,
  JSONArray,
  JSONObject,
  JSONValue,
  LazyValue,
  LinariaMetadata,
  Location,
  Replacement,
  Replacements,
  Rules,
  Serializable,
  StyledMeta,
} from './types';
