# Search inputs and results

The public interface is `dataset process search --query <text> --scope current-user|public --limit <n> --json`. Read its help for actual state filtering and defaults. The wrapper forwards these arguments unchanged. It does not accept a service request body or construct headers.

The result is the CLI shared envelope: `operation`, `status`, `outcome`, `summary`, `data`, `context`, `completeness`, `artifacts`, `warnings`, `error`, `nextActions`, `replyTemplate`. Use returned exact identity/version to select a candidate and inspect it with `dataset process get`. Read the returned content rather than assuming list/search summaries are complete datasets.

Search has no pagination cursor. A limit-bounded result is not a complete catalog; refine criteria or use the appropriate list/statistics operation. Missing/invisible and transport errors stay errors. Dataset field constraints that the search command does not expose must be checked against selected data; never silently discard a legacy filter.
