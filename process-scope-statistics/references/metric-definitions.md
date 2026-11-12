# Metric Definitions

This file defines the default counting contract used by `process-scope-statistics`.

## Snapshot Scope

The script counts rows from remote `processes` after applying:
- one visibility scope
- one `state_code` filter

Default:
- scope = `visible`
- state codes = unrestricted within the selected visibility scope unless explicitly supplied
- groupBy = state; maxRows = 10000

The result describes observed rows. Check completeness/truncation before treating it as a total; explicit grouping supports state/classification, not arbitrary fields.

## Core Metrics

### 1. Total Process Rows

Definition:
- number of remote `processes` rows returned by the snapshot query

This is the denominator for the rest of the report.

### 2. Domain Coverage

Primary definition:
- unique `classificationInformation.common:classification.common:class` text at level `1`

Fallback:
- if level `1` is missing, use the deepest available classification entry for that row

Reporting:
- `domain_count_primary`
- `domain_count_leaf`
- top domain distribution tables
- rows with missing classification are counted separately and excluded from unique domain totals

Reason:
- level `1` is broad enough to behave like a “领域” metric
- deepest classification is kept as a more granular supplement

### 3. Craft / Route Coverage

Primary source:
- `processDataSet.processInformation.dataSetInformation.name.treatmentStandardsRoutes`

Fallback order:
1. English `treatmentStandardsRoutes`
2. Chinese `treatmentStandardsRoutes`
3. any other `treatmentStandardsRoutes`
4. first clause of `technologyDescriptionAndIncludedProcesses`
5. `baseName`

Normalization:
- lowercase
- Unicode normalized
- punctuation collapsed to spaces
- multiple spaces collapsed

Reporting:
- `craft_count`
- source-kind breakdown:
  - `treatmentStandardsRoutes`
  - `technologyDescriptionAndIncludedProcesses`
  - `baseName`

Reason:
- “工艺” is most stably represented by the structured route/treatment name field
- technology text is only a fallback when the route field is empty

### 4. Unit Process Count

Definition:
- number of rows where `modellingAndValidation.LCIMethodAndAllocation.typeOfDataSet`
  contains the phrase `Unit process`

Supplement:
- the full distribution of `typeOfDataSet` values is also reported

Reason:
- this matches the dataset’s own declared process type rather than assuming all rows are unit processes

### 5. Product Coverage

Primary definition:
- unique reference product flow object IDs from the process quantitative reference exchange

Resolution logic:
1. locate `processInformation.quantitativeReference.referenceToReferenceFlow`
2. find the matching exchange by `@dataSetInternalID`
3. use `referenceToFlowDataSet.@refObjectId` as the stable product key

Fallback:
- if no flow object ID exists, use the normalized reference flow short description
- if that is also missing, use the process base name

Reporting:
- `product_count`
- `products_with_flow_id`
- `products_without_flow_id`

Reason:
- product coverage should prefer stable flow IDs over mutable text labels

## Important Limitations

1. Domain counts depend on the dataset’s current classification quality.
2. Craft counts are deterministic string counts, not semantic clustering.
3. Product counts merge by stable flow ID when possible, but fallback text keys may still over-split noisy data.
4. Cross-language labels are not semantically merged unless they share the same stable identifier.
