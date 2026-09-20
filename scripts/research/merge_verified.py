#!/usr/bin/env python3
"""
Validate what the agy pipeline returned, before any of it reaches the app.

agy output is treated as untrusted input. Every URL is fetched; every claim is
shape-checked; anything that fails is dropped with a reason rather than being
quietly kept. This is the gate that stops a second generation of invented data.

Usage:  python3 scripts/research/merge_verified.py [--strict]
"""
import argparse
import json
import re
import ssl
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERIFIED_DIR = ROOT / "scripts/research/verified"

UA = "Mozilla/5.0 (compatible; uae-companies-dataset-audit/1.0)"
TIMEOUT = 12

# UAE bounding box — anything outside is a wrong country, not a typo.
UAE_BOUNDS = (22.5, 26.5, 51.0, 56.5)

TEMPLATE_SIGNS = [
    re.compile(r"Established UAE corporate presence", re.I),
    re.compile(r"provides specialized services, products, and solutions", re.I),
    re.compile(r"\bas an AI\b", re.I),
    re.compile(r"I (?:could not|couldn't|was unable)", re.I),
]


def url_ok(url):
    if not url or not re.match(r"^https://", url):
        return False, "not https"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
            return (r.status < 400), f"HTTP {r.status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, type(e).__name__


def host(url):
    return re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", url or "").lower()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true",
                    help="also drop records whose sources do not resolve")
    args = ap.parse_args()

    records = []
    for path in sorted(VERIFIED_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  SKIP {path.name}: invalid JSON ({e})")
            continue
        if not isinstance(data, list):
            print(f"  SKIP {path.name}: not an array")
            continue
        records.extend(r for r in data if isinstance(r, dict))

    if not records:
        print("No verified records found. Run scripts/research/agy-verify.sh first.")
        return

    rejects = defaultdict(list)

    # --- collect every URL once, check concurrently ---
    urls = set()
    for r in records:
        for key in ("website", "careersUrl", "logo"):
            if r.get(key):
                urls.add(r[key])
    with ThreadPoolExecutor(max_workers=12) as pool:
        checked = dict(zip(urls, pool.map(lambda u: url_ok(u), urls)))

    # --- a URL claimed by two companies is right for at most one ---
    site_claims = Counter(r.get("website") for r in records if r.get("website"))

    clean = []
    for r in records:
        rid = r.get("id")
        if not rid:
            rejects["no id"].append("?")
            continue
        if r.get("notFound"):
            rejects["model reported not found"].append(rid)
            continue

        # website
        site = r.get("website")
        if site:
            ok, why = checked.get(site, (False, "unchecked"))
            if not ok:
                rejects[f"website dead ({why})"].append(rid)
                r.pop("website", None)
            elif site_claims[site] > 1:
                rejects["website claimed by 2+ companies"].append(rid)
                r.pop("website", None)

        # careers url — must resolve AND not be a constructed /careers path
        careers = r.get("careersUrl")
        if careers:
            ok, why = checked.get(careers, (False, "unchecked"))
            constructed = (
                r.get("website")
                and careers.rstrip("/") == r["website"].rstrip("/") + "/careers"
            )
            if not ok:
                rejects[f"careersUrl dead ({why})"].append(rid)
                r.pop("careersUrl", None)
            elif constructed:
                rejects["careersUrl looks constructed"].append(rid)
                r.pop("careersUrl", None)

        # logo
        if r.get("logo"):
            ok, _ = checked.get(r["logo"], (False, "unchecked"))
            if not ok:
                r.pop("logo", None)

        # coordinates
        lat, lon = r.get("latitude"), r.get("longitude")
        if lat is not None and lon is not None:
            lo_lat, hi_lat, lo_lon, hi_lon = UAE_BOUNDS
            if not (lo_lat <= lat <= hi_lat and lo_lon <= lon <= hi_lon):
                rejects["coordinates outside the UAE"].append(rid)
                r.pop("latitude", None); r.pop("longitude", None); r.pop("address", None)

        # description must not be templated or a model apology
        for key in ("shortDescription", "whatTheyDo"):
            text = r.get(key) or ""
            if text and any(p.search(text) for p in TEMPLATE_SIGNS):
                rejects[f"{key} looks templated/non-answer"].append(rid)
                r.pop(key, None)

        # sources must be third-party and resolve (strict only)
        srcs = []
        for s in r.get("sources", []) or []:
            u = s.get("url")
            if not u or host(u) == host(r.get("website")):
                continue
            if args.strict:
                ok, _ = url_ok(u)
                if not ok:
                    continue
            srcs.append({"title": s.get("title", "Source"), "url": u})
        r["sources"] = srcs

        # never accept invented people
        if r.pop("employees", None):
            rejects["employees dropped (not verifiable)"].append(rid)

        clean.append(r)

    # --- report ---
    print(f"{len(records)} records in, {len(clean)} kept\n")
    if rejects:
        print("Fields rejected:")
        for reason, ids in sorted(rejects.items(), key=lambda kv: -len(kv[1])):
            sample = ", ".join(ids[:5])
            more = f" …(+{len(ids) - 5})" if len(ids) > 5 else ""
            print(f"  {len(ids):>3}  {reason}")
            print(f"       {sample}{more}")

    def kept(key):
        k = sum(1 for r in clean if r.get(key))
        return f"{k:>3}/{len(clean)}"
    print("\nSurviving fields:")
    for key in ("website", "careersUrl", "shortDescription", "address", "latitude", "logo", "sources"):
        print(f"  {key:<18} {kept(key)}")

    out = VERIFIED_DIR / "_merged.json"
    out.write_text(json.dumps(clean, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nwrote {out.relative_to(ROOT)}")
    print("Next: python3 scripts/research/build_dataset.py")


if __name__ == "__main__":
    main()
