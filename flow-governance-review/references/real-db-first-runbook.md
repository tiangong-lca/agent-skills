# Reviewing actual Flow data

Begin with the qualified CLI's auth status and exact scope. Search returns candidates; use `dataset flow get --id <id> --version <version> --output flow.json --json` to retrieve canonical content. Preserve read evidence and pagination completeness. Validate with `dataset flow validate --input flow.json --json`, then interpret issue paths using the verified public rules and source evidence.

Do not treat a search/list envelope as canonical validation input. Follow native output contracts for raw content versus command summaries. Current validation is not the retired QA profile: inspect its actual checks and not-checked fields. Empty/invisible results and uncertain service failures are distinct. A proposed repair stays local until the authorized explicit save/create operation; no raw database or script bridge supplies a missing capability.
