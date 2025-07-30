# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, run `npm install` in the root directory to install the required dependencies for each package:

```sh
npm install
```

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
npm run example start
```

To run the example app on Android:

```sh
npm run example android
```

To run the example app on iOS:

```sh
npm run example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "OauthExpoExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

To run the example app on Web:

```sh
npm run example web
```

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
npm run typecheck
npm run lint
```

To fix formatting errors, run the following:

```sh
npm run lint -- --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
npm test
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) for version management and GitHub Actions for automated publishing. This ensures consistent, safe releases without duplication issues.

### Release Process

1. **Create a version bump and tag** (this only updates version and creates a git tag):
   ```sh
   npm run release
   ```

2. **Push the tag to trigger automated publishing**:
   ```sh
   git push --follow-tags
   ```

3. **GitHub Actions automatically**:
   - Runs tests and linting
   - Builds the package
   - Checks if version already exists on npm (prevents duplicates)
   - Publishes to npm (only if version doesn't exist)
   - Creates GitHub release with generated notes

### Manual Publishing (Not Recommended)

⚠️ **Avoid manual `npm publish`** as it can cause duplication errors in CI/CD workflows. The automated tag-based approach prevents these issues.

If you must publish manually for testing:
```sh
# Check if version exists first
npm view @zestic/oauth-expo@$(npm pkg get version | tr -d '"') version 2>/dev/null && echo "Version exists" || npm publish --access public
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `npm install`: setup project by installing dependencies.
- `npm run typecheck`: type-check files with TypeScript.
- `npm run lint`: lint files with ESLint.
- `npm test`: run unit tests with Jest.
- `npm run example start`: start the Metro server for the example app.
- `npm run example android`: run the example app on Android.
- `npm run example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
