# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)


### Bug Fixes

* **babel:** missed reference to atomic ([079379e](https://github.com/callstack/linaria/commit/079379ec7adf713c830da345955b6e5d8c968d6b))


### Features

* **atomic:** create an atomic package for the css API ([#867](https://github.com/callstack/linaria/issues/867)) ([4773bcf](https://github.com/callstack/linaria/commit/4773bcf4b14f08cdc4d2b612654b962cdfc97eaa))





# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)


### Bug Fixes

* **shaker:** exports/object issue with TS (fixes [#861](https://github.com/callstack/linaria/issues/861)) ([#863](https://github.com/callstack/linaria/issues/863)) ([acdbdfe](https://github.com/callstack/linaria/commit/acdbdfe5be46eee238f83eb41aeb2291b5d9e034))
* **shaker:** reimplement enums support (fixes [#848](https://github.com/callstack/linaria/issues/848)) ([#853](https://github.com/callstack/linaria/issues/853)) ([8f1d7cb](https://github.com/callstack/linaria/commit/8f1d7cbadb2665fd734bcda42fd1caa6042659f4))





# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)


### Bug Fixes

* **shaker:** partial support for ts compiled code (fixes [#820](https://github.com/callstack/linaria/issues/820)) ([#836](https://github.com/callstack/linaria/issues/836)) ([ec8ee68](https://github.com/callstack/linaria/commit/ec8ee684b6e90ead46295733ccd8cfefe4eaa04d))





# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)


### Bug Fixes

* **shaker:** improve dependency resolution for wildcard exports ([#826](https://github.com/callstack/linaria/issues/826), fixes [#816](https://github.com/callstack/linaria/issues/816)) ([5aac3eb](https://github.com/callstack/linaria/commit/5aac3eb86ec10e1a6ae60097482155fe44498c28))


### Features

* **babel:** add file, name, dir, ext to classNameSlug ([#825](https://github.com/callstack/linaria/issues/825), fixes [#650](https://github.com/callstack/linaria/issues/650) and [#571](https://github.com/callstack/linaria/issues/571)) ([c1fdb7c](https://github.com/callstack/linaria/commit/c1fdb7c62b407c20b154ea721dc37919258f7ff5))
* make @linaria/shaker optional ([#819](https://github.com/callstack/linaria/issues/819)) ([2a55b03](https://github.com/callstack/linaria/commit/2a55b0399d49d6aee2a436084aea5423675c1722))





# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)


### Bug Fixes

* **shaker:** fix undefined imports in some cases ([#333](https://github.com/callstack/linaria/issues/333), [#761](https://github.com/callstack/linaria/issues/761)) ([#787](https://github.com/callstack/linaria/issues/787)) ([e374072](https://github.com/callstack/linaria/commit/e3740727447b2867a2cfe40f763bc88e72eb2503))





# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)


### Bug Fixes

* **shaker:** typescript enums support ([#761](https://github.com/callstack/linaria/issues/761)) ([#764](https://github.com/callstack/linaria/issues/764)) ([6907e22](https://github.com/callstack/linaria/commit/6907e2280a2ab8ee014b5d02b1169714ccac9d66))





# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package @linaria/babel-preset





# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/babel-preset





# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)


### Bug Fixes

* Import custom identifier called css with error "Cannot find module 'linaria'" [#739](https://github.com/callstack/linaria/issues/739) ([#740](https://github.com/callstack/linaria/issues/740)) ([07fb381](https://github.com/callstack/linaria/commit/07fb38131c9dec406dcca72f45638561c815e824))
* loadOptions text regex ([#728](https://github.com/callstack/linaria/issues/728)) ([34ca3e5](https://github.com/callstack/linaria/commit/34ca3e5f211b65c14c2bf4efabb7065f7109da23))


### Features

* **babel:** expose CSS extraction from AST logic ([#737](https://github.com/callstack/linaria/issues/737)) ([f049a11](https://github.com/callstack/linaria/commit/f049a119ef70346340676ab6a397ad6358e5f39b))
