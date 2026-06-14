"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.media = exports.breakpoints = void 0;
const breakpoints = exports.breakpoints = {
  medium: 640,
  large: 1024
};
const media = exports.media = {
  medium: `@media screen and (min-width: ${breakpoints.medium}px)`,
  large: `@media screen and (min-width: ${breakpoints.large}px)`
};