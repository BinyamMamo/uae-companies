#!/usr/bin/env python3
"""
Dataset CI gate.

Fails the build on the specific failure modes that produced the original
fabricated data, so they cannot come back:

  - a URL claimed by more than one company
  - an opaque search-grounding redirect passed off as a citation
  - a careersUrl built by appending /careers to a homepage
  - templated description text
  - synthetic "<Name> Regional Office" addresses
  - coordinates shared between companies, or outside the UAE
  - a company's own site listed as an independent "source"
  - placeholder avatar logos
  - missing provenance

Usage:  python3 scripts/verify_dataset.py
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data/companies.json"

UAE_BOUNDS = (22.5, 26.5, 51.0, 56.5)
VALID_CONFIDENCE = {"verified", "reported", "estimated", "unverified"}

TEMPLATE_PATTERNS = [
    re.compile(r"Established UAE corporate presence operating in", re.I),
    re.compile(r"provides specialized services, products, and solutions within the UAE", re.I),
    re.compile(r"suitable for engineering and technology graduates", re.I),
]
SYNTHETIC_ADDRESS = re.compile(r" Regional Office, ")

# The generator emitted these exact role sets for 118 and 15 companies.
TEMPLATED_ROLE_SETS = {
    ("IT Specialist", "Operations Engineer", "Data Analyst"),
    ("Systems Integration", "Digital Operations"),
}
PLACEHOLDER_LOGO = re.compile(r"avatar\.vercel\.sh")

# A search-grounding redirect is opaque and expires. It can never stand in for
# a citation a reader could actually open.
OPAQUE_SOURCE = re.compile(
    r"vertexaisearch\.cloud\.google\.com|grounding-api-redirect", re.I
)


def host(url):
    return re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", url or "").lower()


def main():
    if not DATA.exists():
        print(f"FAIL: {DATA.relative_to(ROOT)} does not exist.")
        print("      Run: python3 scripts/research/build_dataset.py")
        return 1

    companies = json.loads(DATA.read_text(encoding="utf-8"))
    errors, warnings = [], []

    ids = Counter(c.get("id") for c in companies)
    for cid, n in ids.items():
        if n > 1:
            errors.append(f"duplicate id: {cid} ({n}x)")
        if not cid:
            errors.append("record with no id")

    sites = Counter(c["website"] for c in companies if c.get("website"))
    for url, n in sites.items():
        if n > 1:
            owners = [c["name"] for c in companies if c.get("website") == url]
            errors.append(f"website claimed by {n} companies: {url} -> {', '.join(owners[:4])}")

    coords = Counter(
        (c["location"]["latitude"], c["location"]["longitude"])
        for c in companies
        if c["location"].get("precision") == "building"
    )
    for point, n in coords.items():
        if n > 1:
            errors.append(f"building-precision coordinates shared by {n} companies: {point}")

    for c in companies:
        cid = c.get("id", "?")
        loc = c.get("location", {})

        lat, lon = loc.get("latitude"), loc.get("longitude")
        lo_lat, hi_lat, lo_lon, hi_lon = UAE_BOUNDS
        if lat is None or lon is None or not (lo_lat <= lat <= hi_lat and lo_lon <= lon <= hi_lon):
            errors.append(f"{cid}: coordinates outside the UAE: {lat}, {lon}")

        if loc.get("precision") not in ("building", "area"):
            errors.append(f"{cid}: location.precision must be 'building' or 'area'")

        addr = loc.get("address")
        if addr and SYNTHETIC_ADDRESS.search(addr):
            errors.append(f"{cid}: synthetic address: {addr}")

        website = c.get("website")
        careers = c.get("careersUrl")
        # /careers is where a real careers page often lives, so the shape alone
        # proves nothing. What matters is whether the pipeline actually fetched
        # it and cited where it came from — an unverified one is a guess.
        if careers and website and careers.rstrip("/") == website.rstrip("/") + "/careers":
            careers_prov = (c.get("provenance") or {}).get("careersUrl") or {}
            if careers_prov.get("confidence") != "verified" or not careers_prov.get("sourceUrl"):
                errors.append(
                    f"{cid}: careersUrl is website + /careers with no verified source"
                )

        for key in ("shortDescription", "whatTheyDo", "studentMatchReason"):
            text = c.get(key) or ""
            if any(p.search(text) for p in TEMPLATE_PATTERNS):
                errors.append(f"{cid}: {key} is templated text")

        for key in ("commonCareers", "technicalAreas"):
            if tuple(c.get(key) or ()) in TEMPLATED_ROLE_SETS:
                errors.append(f"{cid}: {key} is a templated set")

        logo = c.get("logo")
        if logo and PLACEHOLDER_LOGO.search(logo):
            errors.append(f"{cid}: logo is a generated placeholder")

        for s in c.get("sources", []):
            if not s.get("thirdParty"):
                errors.append(f"{cid}: source not marked thirdParty: {s.get('url')}")
            if website and host(s.get("url")) == host(website):
                errors.append(f"{cid}: own website listed as a source: {s.get('url')}")
            if OPAQUE_SOURCE.search(s.get("url") or ""):
                errors.append(f"{cid}: source is an opaque grounding redirect")

        prov = c.get("provenance")
        if not isinstance(prov, dict):
            errors.append(f"{cid}: missing provenance")
            continue
        for field in ("website", "careersUrl", "location", "description", "programmes"):
            p = prov.get(field)
            if not isinstance(p, dict) or p.get("confidence") not in VALID_CONFIDENCE:
                errors.append(f"{cid}: provenance.{field} invalid")
            elif p.get("confidence") in ("verified", "reported") and not p.get("sourceUrl"):
                errors.append(f"{cid}: provenance.{field} is '{p['confidence']}' but has no sourceUrl")
            elif OPAQUE_SOURCE.search(p.get("sourceUrl") or ""):
                errors.append(f"{cid}: provenance.{field} cites an opaque grounding redirect")

        if c.get("employees"):
            for e in c["employees"]:
                if not e.get("linkedinUrl"):
                    warnings.append(f"{cid}: employee without a LinkedIn URL: {e.get('name')}")

    n = len(companies)
    verified = sum(1 for c in companies if c["provenance"]["website"]["confidence"] == "verified")
    unverified = sum(1 for c in companies if c["provenance"]["description"]["confidence"] == "unverified")

    print(f"{n} companies")
    print(f"  verified by research   {verified:>3} ({verified * 100 // n}%)")
    print(f"  description unverified {unverified:>3} ({unverified * 100 // n}%)")
    print(f"  with a working website {sum(1 for c in companies if c.get('website')):>3}")
    print(f"  with a careers page    {sum(1 for c in companies if c.get('careersUrl')):>3}")

    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings[:10]:
            print(f"  ! {w}")

    if errors:
        print(f"\nFAILED with {len(errors)} error(s):")
        for e in errors[:25]:
            print(f"  x {e}")
        if len(errors) > 25:
            print(f"  … and {len(errors) - 25} more")
        return 1

    print("\nPASS: no fabricated or contradictory data found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
