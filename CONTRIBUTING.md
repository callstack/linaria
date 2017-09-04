# Contributing to Linaria

Linaria is one of Callstack.io open source projects that is currently under very active development. Hopefully this document makes the process for contributing clear and answers some questions that you may have.

## [Code of Conduct](/CODE_OF_CONDUCT.md)

We want this community to be friendly and respectful to each other. Please read [the full text](/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## Our Development Process

The core team works directly on GitHub and all work is public.

### Workflow and Pull Requests

> **Working on your first Pull Request?** 
You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

*Before* submitting a pull request, please make sure the following is done:

1. Fork the repo and create your branch from `master` (a guide on [how to fork a repository](https://help.github.com/articles/fork-a-repo/))

1. Linaria uses [Yarn](https://yarnpkg.com/en/) for running development scripts. If you haven't already done so, please [install yarn](https://yarnpkg.com/en/docs/install).

1. If you've added code that should be tested, add tests. You can use watch mode that continuously transforms changed files to make your life easier.

   ```sh
   # in the background
   yarn run build:transpile:watch
   ```

1. If you've changed APIs, update the documentation.

1. Ensure the test suite passes via `yarn run lint && yarn run flow && yarn run test`. 

### Additional Workflow for any changes made to website

If you are making changes to the website, test the website folder and run the server to check if your changes are being displayed accurately. 

1. Locate to the website directory and install any website specific dependencies by typing in `yarn`. It will automatically link the local `linaria` version for you. Following steps are to be followed for this purpose from the root directory.
   ```sh
   cd website       # Only needed if you are not already in the website directory
   yarn
   yarn test
   ```
2. You can run a development server to check if the changes you made are being displayed accurately by running `yarn start` in the website directory.

## How to try a development build of Linaria in another project

To link `linaria` on the command line to local copy in a development build:

```sh
cd /path/to/your/linaria_clone/
yarn
yarn link
cd /path/to/test_project/
yarn link linaria
```

To unlink it:

```sh
yarn unlink linaria
```

## Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case. Please provide a public repository with a runnable example.

## How to Get in Touch

* Callstack Open Source Slack - [#linaria](https://slack.callstack.io/).

## Code Conventions

We use Prettier with ESLint integration.

## License

By contributing to Linaria, you agree that your contributions will be licensed under its MIT license.

