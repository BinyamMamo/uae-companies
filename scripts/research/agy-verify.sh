#!/usr/bin/env bash
#
# Run one batch of companies through the Antigravity CLI (agy) for verification.
#
# agy is used here specifically because it has Google Search grounding built in,
# which is what checking 225 companies needs. Claude orchestrates: it writes the
# prompt and schema, validates whatever comes back, and merges. Nothing agy
# returns is trusted until merge_verified.py has checked it.
#
# Usage:  scripts/research/agy-verify.sh batches/batch-01.json
#         scripts/research/agy-verify.sh --all
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT="$HERE/PROMPT.md"
OUT_DIR="$HERE/verified"
MODEL="${AGY_MODEL:-gemini-3-flash}"
EFFORT="${AGY_EFFORT:-high}"
TIMEOUT="${AGY_TIMEOUT:-15m}"

command -v agy >/dev/null 2>&1 || {
  echo "agy not found. Install it with:" >&2
  echo "  curl -fsSL https://antigravity.google/cli/install.sh | bash" >&2
  echo "then run 'agy' once to sign in, and check with 'agy models'." >&2
  exit 127
}

mkdir -p "$OUT_DIR"

run_batch() {
  local batch="$1"
  local name
  name="$(basename "$batch" .json)"
  local dest="$OUT_DIR/$name.json"

  if [[ -s "$dest" ]]; then
    echo "skip  $name (already verified)"
    return 0
  fi

  echo "run   $name ..."
  local result status response
  # The prompt goes on stdin rather than argv so company names don't show up
  # in the process list, and so batch size isn't limited by ARG_MAX.
  result="$(
    {
      cat "$PROMPT"
      echo
      echo '## Companies to verify'
      echo
      cat "$batch"
    } | agy -p - \
        --model "$MODEL" \
        --effort "$EFFORT" \
        --output-format json \
        --print-timeout "$TIMEOUT" 2>/dev/null
  )" || { echo "fail  $name (agy exited non-zero)" >&2; return 1; }

  status="$(jq -r '.status // "UNKNOWN"' <<<"$result")"
  if [[ "$status" != "SUCCESS" ]]; then
    echo "fail  $name (status=$status)" >&2
    jq -r '.error // empty' <<<"$result" >&2
    return 1
  fi

  response="$(jq -r '.response' <<<"$result")"
  # Strip code fences if the model added them despite the instruction.
  response="$(sed -e 's/^```json$//' -e 's/^```$//' <<<"$response")"

  if ! jq -e 'type == "array"' <<<"$response" >/dev/null 2>&1; then
    echo "fail  $name (response was not a JSON array)" >&2
    printf '%s\n' "$response" | head -20 >&2
    return 1
  fi

  printf '%s\n' "$response" | jq '.' > "$dest"
  echo "ok    $name -> $(jq 'length' "$dest") records"
}

if [[ "${1:-}" == "--all" ]]; then
  shopt -s nullglob
  for b in "$HERE"/batches/*.json; do
    run_batch "$b" || echo "  (continuing)"
  done
else
  [[ $# -eq 1 ]] || { echo "usage: $0 <batch.json> | --all" >&2; exit 2; }
  run_batch "$1"
fi
