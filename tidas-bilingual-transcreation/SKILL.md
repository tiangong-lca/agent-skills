---
name: tidas-bilingual-transcreation
description: Produce evidence-supported translations for explicitly selected local TIDAS fields through typed CLI extract/apply operations, without changing scientific facts or saving remotely.
---

# Bilingual content processing

Run only when post-import language completion is requested. Source-language data can be import-ready without this step. Use the configured launcher and read `dataset <type> translations extract --help --json` and `translations apply --help --json`.

Extraction input contains canonical `content`, `sourceLanguage` and `targetLanguage`; save its result with `--output`. Review the returned fields in context. Applying translations uses the exact extracted `sourceDigest`, original source text, field paths and explicit translated text/basis, as specified by the native help. Do not reproduce the old rows-file/trans-units JSONL protocol or manufacture extraction evidence.

```text
dataset process translations extract --input extract-request.json --output units.json --json
dataset process translations apply --input apply-request.json --output applied.json --json

```

`applied.json` contains `{content, changes}`. Extract its `content` to `candidate.json`, then run `dataset process validate --input candidate.json --json`. Do not pass the apply result envelope as canonical content. Preserve unmodified scientific fields and inspect the resulting diff. Source drift requires fresh extraction and review of changed fields; it never justifies overwriting existing content blindly. No remote save, review or publication occurs in this Skill.

## Translation Rules

- Preserve numeric values, units, CAS numbers, standards, UUID-like identifiers, geography codes, dates, and named methods unless the evidence explicitly supports a localized form.
- Translate the whole field in context. For example, avoid literal fragments such as `组件s`, `层压件s`, or `光伏 装置`.
- Keep technical nouns precise: use terms such as `过程`, `产品流`, `基本流`, `定量参考`, `高压电力组合`, or `光伏安装系统` only when they fit the actual field context.
- Keep source meaning narrower than style preference. Do not add process steps, environmental mechanisms, supplier claims, or assumptions not present in source evidence.
- If the English source is itself low quality, repair the target text only within supported meaning and record the limitation in `basis`.
- If the correct translation depends on missing evidence, output no translation for that unit and record a `manual_review` blocker in the caller’s review notes.
