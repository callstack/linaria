# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)


### Bug Fixes

* **core:** return type alias instead of string from `css` and `cx` ([#835](https://github.com/callstack/linaria/issues/835)) ([7eb9d94](https://github.com/callstack/linaria/commit/7eb9d94dc2d9d79f7be0159c43fa5d71c96d7182))
* **react:** fixes for `--exactOptionalPropertyTypes` TS flag ([#827](https://github.com/callstack/linaria/issues/827)) ([eed92b1](https://github.com/callstack/linaria/commit/eed92b19e3b779b656fb780307bbab8a08d14ba2))
* **rollup:** rollup preserveModules no js extension ([#822](https://github.com/callstack/linaria/issues/822)) ([ca5232a](https://github.com/callstack/linaria/commit/ca5232ad389ae01937cafd0c360401507ddbcda2))
* **server:** fix collect to ignore empty class ([#832](https://github.com/callstack/linaria/issues/832)) ([639fcca](https://github.com/callstack/linaria/commit/639fccae7f814eaa2714354aaa516a85cc8c4ebf))
* **shaker:** partial support for ts compiled code (fixes [#820](https://github.com/callstack/linaria/issues/820)) ([#836](https://github.com/callstack/linaria/issues/836)) ([ec8ee68](https://github.com/callstack/linaria/commit/ec8ee684b6e90ead46295733ccd8cfefe4eaa04d))
* **webpack:** pass all user resolve options to loader (fixes [#658](https://github.com/callstack/linaria/issues/658)) ([#830](https://github.com/callstack/linaria/issues/830)) ([a0590e5](https://github.com/callstack/linaria/commit/a0590e5183b3ad3a93fd7adce61504fd85b4bcb1))





# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)


### Bug Fixes

* **shaker:** improve dependency resolution for wildcard exports ([#826](https://github.com/callstack/linaria/issues/826), fixes [#816](https://github.com/callstack/linaria/issues/816)) ([5aac3eb](https://github.com/callstack/linaria/commit/5aac3eb86ec10e1a6ae60097482155fe44498c28))
* Faster method of building dependencies array ([#824](https://github.com/callstack/linaria/issues/824), fixes [#797](https://github.com/callstack/linaria/issues/797)) ([2463881](https://github.com/callstack/linaria/commit/24638819ee06f5ccf7139ff49ecbc36f893468fb))


### Features

* **babel:** add file, name, dir, ext to classNameSlug ([#825](https://github.com/callstack/linaria/issues/825), fixes [#650](https://github.com/callstack/linaria/issues/650) and [#571](https://github.com/callstack/linaria/issues/571)) ([c1fdb7c](https://github.com/callstack/linaria/commit/c1fdb7c62b407c20b154ea721dc37919258f7ff5))
* make @linaria/shaker optional ([#819](https://github.com/callstack/linaria/issues/819)) ([2a55b03](https://github.com/callstack/linaria/commit/2a55b0399d49d6aee2a436084aea5423675c1722))





# [3.0.0-beta.11](https://github.com/callstack/linaria/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2021-08-08)


### Bug Fixes

* **shaker:** string literals for addressing values in imported NS ([#815](https://github.com/callstack/linaria/issues/815)) ([8adf43e](https://github.com/callstack/linaria/commit/8adf43ec56b107c8017608ccc460d0ba8794c8ef))
* **styled:** remove unnecessary core-js polyfills  (fixes [#799](https://github.com/callstack/linaria/issues/799)) ([#814](https://github.com/callstack/linaria/issues/814)) ([6c3070a](https://github.com/callstack/linaria/commit/6c3070a47715022eb761567b8795f6918784ae4c))





# [3.0.0-beta.10](https://github.com/callstack/linaria/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2021-07-24)


### Bug Fixes

* **shaker:** use the last export statement instead of the 1st  ([#804](https://github.com/callstack/linaria/issues/804)) ([b79584c](https://github.com/callstack/linaria/commit/b79584c292aaa50eb2a420b73434341419b01ff9))





# [3.0.0-beta.9](https://github.com/callstack/linaria/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2021-07-23)


### Bug Fixes

* **shaker:** keep exports if there are dependent code (fixes [#804](https://github.com/callstack/linaria/issues/804)) ([#807](https://github.com/callstack/linaria/issues/807)) ([4bb7744](https://github.com/callstack/linaria/commit/4bb77444a604581877a64d6f88dfac0bc04583f0))
* **shaker:** support for "export * from …" ([#809](https://github.com/callstack/linaria/issues/809)) ([b06c1ba](https://github.com/callstack/linaria/commit/b06c1ba5f44ae7af23cf7793c13a2acfee1bf706))





# [3.0.0-beta.8](https://github.com/callstack/linaria/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2021-07-18)


### Bug Fixes

* **esbuild:** add missing resolveDir to support webfont bundling ([#789](https://github.com/callstack/linaria/issues/789)) ([45e5de0](https://github.com/callstack/linaria/commit/45e5de06cef880a3b3524e2fed5cec313903cc43))
* **shaker:** named exports are removed (fixes [#800](https://github.com/callstack/linaria/issues/800)) ([#801](https://github.com/callstack/linaria/issues/801)) ([3421930](https://github.com/callstack/linaria/commit/3421930b26608b41a02f8b776562655d755a23b4))





# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)


### Bug Fixes

* **shaker:** fix undefined imports in some cases ([#333](https://github.com/callstack/linaria/issues/333), [#761](https://github.com/callstack/linaria/issues/761)) ([#787](https://github.com/callstack/linaria/issues/787)) ([e374072](https://github.com/callstack/linaria/commit/e3740727447b2867a2cfe40f763bc88e72eb2503))
* webpack resolve options ([#785](https://github.com/callstack/linaria/issues/785)) ([64b2b06](https://github.com/callstack/linaria/commit/64b2b06edd873d7db0f36ef25a4b9d8389808eb2))
* **esbuild:** import esbuild correctly ([#783](https://github.com/callstack/linaria/issues/783)) ([a22522b](https://github.com/callstack/linaria/commit/a22522b0c91eefa12a10f67caf27ecb2954d8d1d))
* **esbuild:** workaround to for esbuild compile options ([#784](https://github.com/callstack/linaria/issues/784)) ([ac47f43](https://github.com/callstack/linaria/commit/ac47f43d7d2f692ef57b12573fdacdde72c25e19))





# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)


### Bug Fixes

* **rollup:** compliant vite ([#763](https://github.com/callstack/linaria/issues/763)) ([3966dcf](https://github.com/callstack/linaria/commit/3966dcf03919430a7054ee7d6cf54aeaa715413c))
* **webpack:** hot reload fails after compile error (fixes [#762](https://github.com/callstack/linaria/issues/762)) ([#775](https://github.com/callstack/linaria/issues/775)) ([67fcd81](https://github.com/callstack/linaria/commit/67fcd8108f283f8ade23c68ad3fece8aee335bf1))


### Features

* **interop:** interop between Linaria and traditional CSS-in-JS libraries ([#776](https://github.com/callstack/linaria/issues/776)) ([0a5f5b4](https://github.com/callstack/linaria/commit/0a5f5b440506bfa24724d4a91e519c48d6f6c69b))
* add esbuild integration ([#765](https://github.com/callstack/linaria/issues/765)) ([511a717](https://github.com/callstack/linaria/commit/511a7178fd9c77fb971d392067b0f7ea8fcd30a4))





# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)


### Bug Fixes

* **shaker:** typescript enums support ([#761](https://github.com/callstack/linaria/issues/761)) ([#764](https://github.com/callstack/linaria/issues/764)) ([6907e22](https://github.com/callstack/linaria/commit/6907e2280a2ab8ee014b5d02b1169714ccac9d66))





# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)


### Bug Fixes

* **cli:** cannot find module '../lib/cli' ([#753](https://github.com/callstack/linaria/issues/753)) ([#754](https://github.com/callstack/linaria/issues/754)) ([fd7a09b](https://github.com/callstack/linaria/commit/fd7a09b4d4c7265e631b1d9c153362c87ed4132c))





# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)


### Bug Fixes

* **core,react:** make IE 11 compatible (fixes [#746](https://github.com/callstack/linaria/issues/746)) ([#750](https://github.com/callstack/linaria/issues/750)) ([922df95](https://github.com/callstack/linaria/commit/922df9576a430cdfe9b27aed5dc45c4f75917607))





# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)


### Bug Fixes

* **core:** remove unnecessary spread operators from css and cx ([#746](https://github.com/callstack/linaria/issues/746)) ([#749](https://github.com/callstack/linaria/issues/749)) ([de23a09](https://github.com/callstack/linaria/commit/de23a0926c2583db01e7df5ea9a134f5910f96a1))
* Import custom identifier called css with error "Cannot find module 'linaria'" [#739](https://github.com/callstack/linaria/issues/739) ([#740](https://github.com/callstack/linaria/issues/740)) ([07fb381](https://github.com/callstack/linaria/commit/07fb38131c9dec406dcca72f45638561c815e824))
* loadOptions text regex ([#728](https://github.com/callstack/linaria/issues/728)) ([34ca3e5](https://github.com/callstack/linaria/commit/34ca3e5f211b65c14c2bf4efabb7065f7109da23))
* resolve output filename relative to source root ([#733](https://github.com/callstack/linaria/issues/733)) ([c606b3f](https://github.com/callstack/linaria/commit/c606b3f9340f498e104905a954393df6fd48cb73))


### Features

* **babel:** expose CSS extraction from AST logic ([#737](https://github.com/callstack/linaria/issues/737)) ([f049a11](https://github.com/callstack/linaria/commit/f049a119ef70346340676ab6a397ad6358e5f39b))
