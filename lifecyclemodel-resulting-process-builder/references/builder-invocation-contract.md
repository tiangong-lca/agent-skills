# Resulting Process input and effects

Use the installed `dataset model build-resulting-process --help --json` request shape. Supply explicit `source_model`, `projection` and exact `process_sources` through `--input`, then write the projection result with `--output`. The skill wrapper forwards these current flags directly. Legacy run-root, recursive-build and publication flags are rejected, not translated.

Read actual completeness and provenance. A candidate is not persisted. Extract each canonical Process from the returned bundle before validation. Validate canonical Process content and select create versus save explicitly, with current preconditions. Model LCIA calculation and Process generation are distinct operations.
