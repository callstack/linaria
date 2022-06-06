"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.media = exports.breakpoints = void 0;
const breakpoints = {
  medium: 640,
  large: 1024
};
exports.breakpoints = breakpoints;
const media = Object.keys(breakpoints).reduce((acc, item) => {
  acc[item] = `@media screen and (min-width: ${breakpoints[item]}px)`;
  return acc;
}, {});
exports.media = media;