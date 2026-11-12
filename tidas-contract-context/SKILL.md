---
name: tidas-contract-context
description: Read the installed CLI's typed TIDAS schema, methodology and public-rule context before authoring or validating dataset content.
---

# TIDAS contract context

Use `dataset <type> contract --help --json` through the configured launcher. Types are flow, process, model, source, contact, flowproperty, unitgroup and lciamethod. Request the supported components and output explicitly; for example `dataset process contract --include schema,methodology,ruleset --output contract.json --json`. Inspect actual component availability and completeness; a missing component is not permission to invent a rule.

The public rule definitions belong to released specification assets; executable profiles and severity belong to the consuming CLI. Read the selected content rather than relying on a different installed version or copying rule assets into this Skill. Contract retrieval does not author, save or publish data and requires no separate context-pack or production directory.
