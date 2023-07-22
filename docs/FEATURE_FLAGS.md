# Feature Flags

Feature flags are used to enable or disable specific features provided. The `features` option in the configuration allows you to control the availability of these features.

## Syntax for Specifying Flags

- `true`: Enables the feature for all files.
- `false`: Disables the feature for all files.
- `"glob"`: Enables the feature only for files that match the specified glob pattern.
- `["glob1", "glob2"]`: Enables the feature for files matching any of the specified glob patterns.
- `["glob1", "!glob2"]`: Enables the feature for files matching `glob1` but excludes files that match `glob2`.

# `dangerousCodeRemover` Feature

The `dangerousCodeRemover` is a flag that is enabled by default. It is designed to enhance the static evaluation of values that are interpolated in styles and to optimize the processing of styled-wrapped components during the build stage. This optimization is crucial for maintaining a stable and fast build process. It is important to note that the `dangerousCodeRemover` does not impact the runtime code; it solely focuses on the code used during the build.

## How It Works

During the build process, Linaria statically analyzes the CSS-in-JS codebase and evaluates the styles and values that are being interpolated. The `dangerousCodeRemover` steps in at this stage to remove potentially unsafe code, which includes code that might interact with browser-specific APIs, make HTTP requests, or perform other runtime-specific operations. By removing such code, the evaluation becomes more reliable, predictable, and efficient.

## Benefits

Enabling the `dangerousCodeRemover` feature provides several benefits:

1. **Stability**: The removal of potentially unsafe code ensures that the build process remains stable. It minimizes the chances of encountering build-time errors caused by unsupported browser APIs or non-static operations.

2. **Performance**: Removing unnecessary code results in faster build times. The build tool can efficiently process and evaluate the styles and components without unnecessary overhead, leading to quicker development cycles.

## Fine-Tuning the Removal

While the `dangerousCodeRemover` is highly effective at optimizing the build process, there may be cases where it becomes overly aggressive and removes code that is actually required for your specific use case. In such situations, you have the flexibility to fine-tune the behavior of the remover.

By leveraging the `features` option in the configuration, you can selectively disable the `dangerousCodeRemover` for specific files. This allows you to preserve valuable code that may not be safely evaluated during the build process.

### Example

Suppose you have a file named `specialComponent.js` that contains code that should not be deleted. By adding the following entry to your `features` configuration:

```js
{
  features: {
    dangerousCodeRemover: ["**/*", "!**/specialComponent.js"],
  },
}
```

You are instructing Linaria to exclude the `specialComponent.js` file from the removal process. As a result, any code within this file that would have been removed by the `dangerousCodeRemover` will be retained in the build output.
