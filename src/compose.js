/* @flow */

export default function compose(...names: Array<string | false | void>) {
  return names.filter(name => name).join(' ');
}
