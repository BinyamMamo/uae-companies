#!/usr/bin/env python3
"""
Resolve every website / careersUrl in the dataset and record what actually
happens. Nothing here guesses: a URL either resolves or it is marked dead.

Usage:  python3 scripts/research/check_urls.py [--limit N] [--out FILE]
"""
import argparse
import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "scripts/research/seed_companies.json"

UA = "Mozilla/5.0 (compatible; uae-companies-dataset-audit/1.0; +https://github.com/BinyamMamo/uae-companies)"
TIMEOUT = 12


def load_companies():
    return json.loads(SEED.read_text(encoding="utf-8"))


def probe(url):
    """Return (status, final_url, error). status is an int or None."""
    if not url or not re.match(r"^https?://", url):
        return None, None, "malformed"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            return resp.status, resp.geturl(), None
    except urllib.error.HTTPError as e:
        return e.code, url, None
    except Exception as e:  # DNS failure, timeout, refused, bad TLS
        return None, None, type(e).__name__


def check(company):
    site_status, site_final, site_err = probe(company.get("website"))
    careers_status, careers_final, careers_err = probe(company.get("careersUrl"))
    return {
        "id": company["id"],
        "name": company["name"],
        "website": company.get("website"),
        "website_status": site_status,
        "website_final": site_final,
        "website_error": site_err,
        "careersUrl": company.get("careersUrl"),
        "careers_status": careers_status,
        "careers_final": careers_final,
        "careers_error": careers_err,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--out", default=str(ROOT / "scripts/research/url_audit.json"))
    ap.add_argument("--workers", type=int, default=12)
    args = ap.parse_args()

    companies = load_companies()
    if args.limit:
        companies = companies[: args.limit]

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(check, companies))

    Path(args.out).write_text(json.dumps(results, indent=2), encoding="utf-8")

    ok_site = sum(1 for r in results if r["website_status"] and r["website_status"] < 400)
    ok_careers = sum(1 for r in results if r["careers_status"] and r["careers_status"] < 400)
    print(f"checked {len(results)} companies", file=sys.stderr)
    print(f"  website resolves:  {ok_site}/{len(results)}", file=sys.stderr)
    print(f"  careersUrl resolves: {ok_careers}/{len(results)}", file=sys.stderr)
    print(f"  wrote {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
