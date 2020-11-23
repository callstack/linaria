import webpack4Loader from '@linaria/webpack4-loader';
import webpack5Loader from '@linaria/webpack5-loader';

type W4This = ThisParameterType<typeof webpack4Loader>;
type W4Params = Parameters<typeof webpack4Loader>;

type W5This = ThisParameterType<typeof webpack5Loader>;
type W5Params = Parameters<typeof webpack5Loader>;

export default function webpackLoader(
  this: W4This | W5This,
  ...args: W4Params | W5Params
) {
  if ('getOptions' in this) {
    // webpack v5
    webpack5Loader.apply(this, args);
  } else {
    // webpack v4
    webpack4Loader.apply(this, args);
  }
}
