import webpack4Loader from '@linaria/webpack4-loader';
import webpack5Loader from '@linaria/webpack5-loader';

type W4This = ThisParameterType<typeof webpack4Loader>;
type W4Params = Parameters<typeof webpack4Loader>;

type W5This = ThisParameterType<typeof webpack5Loader>;
type W5Params = Parameters<typeof webpack5Loader>;

function webpackLoader(this: W4This, ...args: W4Params): void;
function webpackLoader(this: W5This, ...args: W5Params): void;
function webpackLoader(this: W4This | W5This, ...args: W4Params | W5Params) {
  if ('getOptions' in this) {
    // webpack v5
    webpack5Loader.apply(this, args as W5Params);
  } else {
    // webpack v4
    webpack4Loader.apply(this, args as W4Params);
  }
}

export default webpackLoader;
