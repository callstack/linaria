# How it works

Every invocation of the `transform` function creates a new root `Entrypoint` instance. If the given file is not ignored, a new `workflow` action is created and launched. Within the `workflow`, recursively for each import, child `Entrypoint` instances are created, and `processEntrypoint` is initiated for them. Once the import tree is fully processed, the file is passed for artifact (styles) computation and preparation for the runtime.


## Entrypoint

For each file, an `Entrypoint` instance is created, which contains the following fields:
* `name`: the full file name.
* `only`: a list of exports needed from this file.
* `idx`: a sequentially assigned index for each file.
* `generation`: the generation number (increases when this entrypoint is recreated with a new set of `only`).
* `log`: a logger attached to this entrypoint.
* `parent`: a reference to the parent or null if it's the root of the tree.
* `code`: the file's code.
* `ast`: the Abstract Syntax Tree (AST) generated from `code`.
* `evalConfig`: Babel configuration to prepare this file for evaluation.
* `evaluator` a function used for preparation before evaluation.
* `pluginOptions`: Linaria options.

Additionally, the class allows subscribing to the `supersede` event (discussed later) through the `onSupersede` method.

### Entrypoint.create

The creation of an `Entrypoint` strictly occurs within the protected static `Entrypoint.create` method. When the method is called multiple times for the same file:

* If the file's code differs from what is cached (for example, due to Hot Module Replacement or when the code was initially read from the file and transformed on the second call, such as by a loader), we reset all caches related to this file. We then proceed as if it were the first call for the file.
* If called with the same or narrower `only` scope, instead of creating a new instance, we return the previously created one.
* If the new `only` scope is broader than the cached one, we create a new generation of `Entrypoint` and notify all interested parties about the superseding event (`onSupersede`).
* During creation, if it is determined that this file already exists within the `parent` chain, instead of returning a new `Entrypoint`, we return `"ignored"`, and the `onSupersede` method is called for the parent.

Superseding implies that tasks initiated for the old `Entrypoint` become irrelevant, and they need to be terminated. The processing for the old `Entrypoint` must be restarted from scratch. If some tasks have partially executed and duplicates of these tasks are placed in the queue (for instance, the new entrypoint hasn't altered the list of imports, and a `resolveImports` task is enqueued with the same arguments), the execution of such duplicate tasks is skipped, and their results are retrieved from the cache. The task's outcome is not solely determined by the returned value; any subtasks spawned by the task are also considered, and they are enqueued as well. Adding subtasks from a previously executed task to the queue is necessary in case some of them were aborted due to superseding.

Each newly created or recreated `Entrypoint` is enqueued with a `processEntrypoint` task. Superseding is not bound to a specific queue instance. If `Entrypoint[foo]` is added to queue `A`, and subsequently `Entrypoint[foo,bar]` is added to queue `B`, the `onSupersede` function will be invoked for `Entrypoint[foo]` in queue `A`, all actions linked to the original `Entrypoint` in queue `A` will be removed, and a new `processEntrypoint(Entrypoint[foo,bar])` will be added.


## Actions


### processEntrypoint

The `processEntrypoint` action initializes an `AbortController`, subscribes to the parent's `AbortSignal` if it exists, subscribes to the `onSupersede` signal, and enqueues two new tasks: `explodeReexports` and `transform`. It passes along the `AbortSignal` to these tasks, which will be triggered in case the `Entrypoint` is superseded. If an `AbortSignal` is provided with the action, it is inherited by all subsequent actions by default. If the original `Entrypoint` is superseded, a new `processEntrypoint` action is enqueued for the new `Entrypoint`.


### explodeReexports

The `explodeReexports` function locates `export * from 'file-name'` statements, queues up `getExports` for each of them, and upon execution of `getExports`, replaces the `*` with a list of named exports.


### getExports

This function identifies the names of all exports in the file. If the file contains an `export * from` statement, it recursively adds itself to the queue for each such instruction until the entire list is expanded.


### transform

Prepares the file for execution: identifies the utilized Linaria processors, invokes eval-time substitutions for them, removes unnecessary code, and calls the `evaluator`. From the remaining code, surviving imports are extracted, wrapped in `resolveImports`, and queued. After imports are resolved, the `processImports` task is set to handle them.


### resolveImports

This function exists in two variants: synchronous for strictly synchronous environments and asynchronous for cases where the file resolver function is exclusively supplied in an asynchronous manner. Both variants perform the same task with adjustments for synchronicity and asynchronicity: they invoke the provided file resolver function for each specified import and cache the results. In the asynchronous version, in addition to caching results, it also caches a promise to ensure that two parallel resolving tasks are not started simultaneously, thus maintaining a strict "first asked, first answered" queue.


### processImports

Invokes `createEntrypoint` for each import. At this stage, it might return `"ignored"` if a loop is detected. In this case, the specific import is skipped. For the remaining imports, `processEntrypoint` will be enqueued without the parent's `AbortSignal`.


### evalFile

Executes the code prepared in previous steps within the current `Entrypoint`. Returns all exports that were requested in `only`.


### collect

This step introduces modifications to the final code by replacing tag and function calls with their runtime versions, and removing redundant code.


### extract

Extracts and returns all artifacts (styles) for the current `Entrypoint`.


### workflow

The entry point for file processing. Sequentially calls `processEntrypoint`, `evalFile`, `collect`, and `extract`. Returns the result of transforming the source code as well as all artifacts obtained from code execution.
