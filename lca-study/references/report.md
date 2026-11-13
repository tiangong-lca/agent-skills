# Compose and render a research report

The Skill owns research meaning and content selection. The CLI owns deterministic JSON-to-HTML rendering. Use `tiangong-lca report render --help --json` to discover the actual input contract before composing a report; an installed CLI without that capability requires a compatible installation, not a private renderer or fallback to hosted report creation.

1. Select the Model and specific Run the report describes. Read their actual content/results through supported CLI operations; preserve the functional quantity, boundary, units, method, assumptions and unresolved questions. Do not silently combine a newer model with older results.
2. Compose editable `report.json`. Only the renderer’s `title` is structurally required; research completeness remains a semantic responsibility. Typical sections cover goal/scope, data/evidence and assumptions. Add explicit model nodes/connections, actual result values, sources, interpretation and limitations where available.
3. Set `language` explicitly to the chosen conversation language (`zh` or `en`) unless the user requests a different report language; do not rely on the renderer’s default for English users. Supply requested language content as plain text strings or `{ "en": "...", "zh": "..." }`. The CLI displays one language at a time, with a Chinese/English switch; it never translates content. Preserve meaning across languages, and share numerical values, units and identities. Missing translation remains visibly labeled; do not call a partly translated report complete bilingual delivery.
4. Invoke the atomic render:

   ```bash
   tiangong-lca report render --input report.json --output report.html --json
   ```

5. Inspect the returned HTML artifact. Check titles, text, numeric values and units, clickable node/connection/source details, language switching and actual limitations. PDF is produced through the report’s browser Print / Save as PDF control, using the selected language. The print view retains all rows and details even after table filtering. Say “HTML with PDF printing” unless an actual PDF file has been exported and checked.

## JSON content

- `title`, optional `subtitle`, and `language` (`en` or `zh`, default `zh`). Text is plain text, not executable HTML or a Markdown document.
- `sections`: `{title, body?, sources?, table?: {columns, rows}}`. Table cells are finite numbers or text. Preserve source locations and original denominators in narrative/table content.
- `model`: `{nodes, edges}` is a presentation projection, not the raw canonical Model object. Map explicitly selected instances and connections from current CLI graph/content results. Nodes use `{id,label,kind?,details?,inputs?,outputs?,sources?}`; kind is foreground/background, inputs/outputs are descriptive text lists. Edges use `{id,from,to,label,amount?,unit?,details?}`. IDs are unique within each collection and used for local links only. Do not infer provider edges or expand aggregate background inventories.
- `results`: `{label,value,unit,method?}` uses actual selected Run outputs; identify the method/Run in `method` and explain scope in prose. The renderer does not derive LCIA or per-node contributions from totals.
- `sources`: `{id,title,url?,note?}`; section/node source references name these IDs. URL links must be absolute HTTP(S) without credentials. Put private local source locations in appropriate caller-controlled notes; the renderer does not open files or retrieve sources. Include only disclosure-appropriate content in a report intended for sharing.
- `limitations`: text entries for interpretation, scope restrictions, assumptions and unresolved facts. Absence of a factor in a complete LCIA method is normal method applicability, not a coverage defect.

Keep uncertainty explicit and facts separate from assumptions. A report may describe an uncalculated model, but label that state and omit fabricated results. The user may edit report JSON and render a separate new file without hashes, revision approvals or redoing scientific work. Existing output replacement requires explicit `--force`; never overwrite input. Rendering does not modify the Model or its Run.

Hosted report review, formal finalization, signed exports and named sharing use [their existing service protocol](hosted-study.md) only when requested. A local HTML/PDF is a presentation of supplied research content, not proof of review or scientific certification.

## Keep the current report consistent

Show every modeled proxy/conversion as a visible node with its input/output ratio, rationale and material differences. Use the existing foreground node kind with an informative label/details; this is a local modeling assumption, not a claim that a public supplier performs that conversion. Physical transformation nodes also describe their additional inputs, losses and emissions.

When a numerical basis or interpretation is corrected, reconcile the current brief, evidence/assumption tables and report JSON, then render the updated HTML. Retain earlier Runs as historical evidence; mark withdrawn claims in history and omit them from current results. Check all language variants and per-item/per-mass conversions against the selected Run's reference basis. Regenerating HTML alone does not repair stale JSON or prose.

For a report intended for sharing, keep personal filesystem paths, account information, credentials and internal execution details out of the content. Use document titles, page/sheet locators and disclosure-appropriate source links. Private evidence locations remain in the working inventory.
