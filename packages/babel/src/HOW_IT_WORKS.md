# How it works

This file will be extended and translated before merge.

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

The creation of an `Entrypoint` strictly occurs within the `Entrypoint.create` method. When the method is called multiple times for the same file:

* If the file's code differs from what is cached (for example, due to Hot Module Replacement or when the code was initially read from the file and transformed on the second call, such as by a loader), we reset all caches related to this file. We then proceed as if it were the first call for the file.
* If called with the same or narrower `only` scope, instead of creating a new instance, we return the previously created one.
* If the new `only` scope is broader than the cached one, we create a new generation of `Entrypoint` and notify all interested parties about the superseding event (`onSupersede`).
* During creation, if it is determined that this file already exists within the `parent` chain, instead of returning a new `Entrypoint`, we return `"ignored"`, and the `onSupersede` method is called for the parent.

Superseding implies that tasks initiated for the old `Entrypoint` become irrelevant, and they need to be terminated. The processing for the old `Entrypoint` must be restarted from scratch. If some tasks have partially executed and duplicates of these tasks are placed in the queue (for instance, the new entrypoint hasn't altered the list of imports, and a `resolveImports` task is enqueued with the same arguments), the execution of such duplicate tasks is skipped, and their results are retrieved from the cache. The task's outcome is not solely determined by the returned value; any subtasks spawned by the task are also considered, and they are enqueued as well. Adding subtasks from a previously executed task to the queue is necessary in case some of them were aborted due to superseding.

Each newly created or recreated `Entrypoint` is enqueued with a `processEntrypoint` task. Superseding is not bound to a specific queue instance. If `Entrypoint[foo]` is added to queue `A`, and subsequently `Entrypoint[foo,bar]` is added to queue `B`, the `onSupersede` function will be invoked for `Entrypoint[foo]` in queue `A`, all actions linked to the original `Entrypoint` in queue `A` will be removed, and a new `processEntrypoint(Entrypoint[foo,bar])` will be added.


## Actions


### processEntrypoint

Заводит `AbortController`, подписывается на `AbortSignal` родителя (если есть), подписывается на `onSupersede` и закидывает в очередь три новых таски: `explodeReexports`, `transform` и `finalizeEntrypoint`. В первые две таски передаётся `AbortSignal`, который будет вызван в случае замещения `IEntrypoint`, а `finalizeEntrypoint` должен вызываться в любом случае в самом конце обработки дерева задач этого энтрипоинта. Если у экшена указан `AbortSignal`, то по умолчанию он наследуется всеми порождаемыми действиями.

### explodeReexports

Находит инструкции `export * from 'file-name'`, складывает для каждой из них в очередь `getExports`, а по исполнению `getExports` заменяет `*` на именованный список.


### getExports

Находит имена всех экспортов в файле, а если в файле есть `export * from`, то рекурсивно добавляет себя в очередь для каждой такой инструкции, пока не получится развернуть весь список.


### transform

Готовит файл к исполнению: находит используемые linaria-процессоры, вызывает eval-time замены для них, удаляет лишний код, вызывает `evaluator`. Из оставшегося кода достаются уцелевшие импорты, оборачиваются в `resolveImports` и складываются в очередь. После резолва импортов, ставится задача `processImports` на их обработку. Финальным действием идёт `addToCodeCache`, которое складывает всю полученную информацию в кэш для дальнейшего использования в `module.ts`.


### resolveImports

Существует в двух вариантах: синхронном для строго синхронных окружений и асинхронном на случаи, если функция-резолвер файлов поставляется исключительно в асинхронном варианте (то есть всегда). Оба варианта делают одно и то же, с поправкой на синхронность и асинхронность: вызывают переданную функцию-резовлер для каждого указанного импорта, а так же кэшируют результаты. Асинхронная версия кроме результатов кэширует ещё и промис, чтобы гарантировать, что не будет запущено две параллельных таски на резолв, и обеспечить строгую очередь «первый спросил — первому ответили».


### processImports

Вызывает `createEntrypoint` для каждого импорта. На данном этапе может вернуться `"ignored"`, если мы попали в петлю. В этом случае конкретный импорт пропускается. Для остальных же в очередь будут добавлены `processEntrypoint` без `AbortSignal` родителя (в этом месте я не уверен, нужно ли пробрасывать сигнал глубже и канцелять их вместе с корневым `IEntrypoint` или нехай живут).


### addToCodeCache

Просто добавляет результат кэш. Можно было бы делать это непосредственно в `transform`, но так в логах нагляднее.


### finalizeEntrypoint

Должен вызываться для освобождения ресурсов, когда всё под-дерево обработки конкретного файла было завершено. Но по факту вызывается в самом конце вообще, так как механизм приоритизации хромает на обе ноги.
