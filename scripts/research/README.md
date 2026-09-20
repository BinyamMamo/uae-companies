# Company data verification pipeline

The dataset that shipped before this pipeline was ~90% generated from a
template: 40% of websites did not resolve, 92% of careers URLs were built by
appending `/careers` to a guessed homepage, 118 companies shared one identical
description, and 14 different "Al ..." companies all pointed at `al.com`
(an Alabama news site). Run `audit_report.py` to see the full picture.

This pipeline replaces that with sourced data, and — importantly — leaves
fields empty when nothing backs them up.

## How it works

Claude orchestrates; **agy** (the Antigravity CLI) does the search-heavy work,
because it has Google Search grounding built in. Nothing agy returns is
trusted: `merge_verified.py` re-fetches every URL and drops anything that
fails, so a second generation of invented data cannot get in.

```
make_batches.py    split the remaining companies into batches of 10
agy-verify.sh      run a batch through agy with Google Search grounding
merge_verified.py  fetch every URL, reject what fails, write _merged.json
build_dataset.py   assemble public/data/companies.json with provenance
verify_dataset.py  CI gate (in ../)
```

## One-time setup

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
agy                # sign in once
agy models         # should list Gemini models
```

## Running it

```bash
python3 scripts/research/make_batches.py --size 10
scripts/research/agy-verify.sh --all      # incremental; safe to re-run
python3 scripts/research/merge_verified.py --strict
python3 scripts/research/build_dataset.py
python3 scripts/verify_dataset.py
```

`agy-verify.sh` skips batches already present in `verified/`, so the free
tier's weekly rate limits just mean you run it again later rather than losing
progress. Re-running `make_batches.py` re-queues only what is still missing.

## The rule

A field is either backed by a source or it is `null`. Every claim a user might
act on carries `provenance` saying how far to trust it, and the UI shows an
"unverified" badge rather than presenting a guess as a fact.
