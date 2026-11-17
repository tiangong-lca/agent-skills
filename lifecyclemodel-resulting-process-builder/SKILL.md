---
name: lifecyclemodel-resulting-process-builder
description: Generate local Process candidates from a Model, or inspect, save, and recover the complete result group using the installed TianGong CLI.
---

# Maintain Model result groups

Read `tiangong-lca dataset model --help --json` and the needed action's help from the installed CLI. Check `tiangong-lca --version` when diagnosing a missing capability. If the required action is absent, give the official upgrade instructions. If the server reports unsupported guarded saves, identify the environment that needs the newer service.

For a local preview, call `dataset model build-resulting-process` with the explicit Model, exact Process sources and Flow evidence. Select `projection.mode: all-subproducts` for the complete candidate. Read the reported scope, expected and emitted member counts, missing members and qualification from the native result and artifact. `aggregate` is the same operation. A candidate describes generation, so report its qualification separately from persistence.

For an authorized remote save, use `dataset model result-group`. For an existing draft, inspect it before preparing edits and pass the resulting artifact as the save baseline. For creation, specify the new exact identity and use a null baseline. Provide the edited Model and exact inputs under `generation`. CLI computes, validates, constructs the mutations, submits the group and reads it back. Pass the installed command's help format unchanged. There is no manual assembly of result members.

- `verified` confirms the original commit and current complete readback.
- `committed_readback_unverified` confirms the original commit and leaves current state unverified. Inspect the saved group before further edits.
- `unknown` leaves commit status unknown. Follow the native recovery input or next action for the original operation.
- A conflict or validation failure needs a fresh inspect or corrected inputs. Preserve the user's edits while resolving it.

Review submission and publication keep their separate native actions and receipts. Use actual returned Foundry continuation actions for managed tasks.

Use the public `tiangong-lca` in PATH. Before authorized remote mutations, use `tiangong-lca auth status --json` and `tiangong-lca auth doctor-auth --json`. When login is needed, tell the human user to run `tiangong-lca auth login` in their trusted terminal. Use the selected account's session and keep passwords and tokens out of Skill input. The convenience script supports optional `--cli-command <executable>`. Its default action forwards local generation. Put `--result-group` first in its native argument list to forward result-group input.
