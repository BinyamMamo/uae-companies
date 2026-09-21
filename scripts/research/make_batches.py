#!/usr/bin/env python3
"""
Split the companies needing verification into batches for the agy pipeline.

Companies already fully verified are skipped, so re-running after a partial
pass only queues what is still missing. Batches are small because the free
Antigravity tier has weekly rate limits, this is meant to run incrementally.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "scripts/research/seed_companies.json"
VERIFIED_DIR = ROOT / "scripts/research/verified"
BATCH_DIR = ROOT / "scripts/research/batches"


def load_seed():
    return json.loads(SEED.read_text(encoding="utf-8"))


def already_done():
    done = set()
    if VERIFIED_DIR.exists():
        for path in VERIFIED_DIR.glob("*.json"):
            try:
                for rec in json.loads(path.read_text(encoding="utf-8")):
                    if rec.get("id"):
                        done.add(rec["id"])
            except (json.JSONDecodeError, TypeError):
                continue
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=10, help="companies per batch")
    args = ap.parse_args()

    done = already_done()
    todo = [
        {
            "id": c["id"],
            "name": c["name"],
            "officialName": c.get("officialName"),
            "emirate": c["location"]["emirate"],
            "area": c["location"]["area"],
            # Deliberately NOT passing the old website/careers URLs: they are
            # wrong often enough that showing them would just anchor the model.
        }
        for c in load_seed()
        if c["id"] not in done
    ]

    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for old in BATCH_DIR.glob("*.json"):
        old.unlink()

    for i in range(0, len(todo), args.size):
        chunk = todo[i : i + args.size]
        path = BATCH_DIR / f"batch-{i // args.size + 1:03d}.json"
        path.write_text(json.dumps(chunk, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"{len(done)} already verified, {len(todo)} to go")
    print(f"wrote {len(list(BATCH_DIR.glob('*.json')))} batches of {args.size} to {BATCH_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
