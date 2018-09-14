// flow-typed signature: 097b2887f219dba3f2df79cfe16c063b
// flow-typed version: d4e3edcf09/dedent_v0.7.x/flow_>=v0.25.x

// @flow

declare module 'dedent' {
  declare module.exports: (
    strings: string | Array<string>,
    ...values: Array<string>
  ) => string;
}
