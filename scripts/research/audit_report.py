#!/usr/bin/env python3
"""
Dataset integrity report.

Separates three different failure modes that all look like "data" today:
  DEAD      - the URL does not resolve at all
  SHARED    - several companies claim the same URL, so at most one can be right
  TEMPLATED - the text was generated from a template, not researched
"""
import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_companies():
    """The original seed list, kept for before/after comparison."""
    return json.loads((ROOT / "scripts/research/seed_companies.json").read_text(encoding="utf-8"))


def main():
    companies = load_companies()
    audit = {r["id"]: r for r in json.loads((ROOT / "scripts/research/url_audit.json").read_text())}
    n = len(companies)

    def pct(k):
        return f"{k:>3} / {n}  ({k * 100 // n:>2}%)"

    print("=" * 68)
    print(f"DATASET INTEGRITY REPORT ,  {n} companies")
    print("=" * 68)

    # --- URLs ---
    dead_site = [c for c in companies
                 if not (audit[c["id"]]["website_status"] and audit[c["id"]]["website_status"] < 400)]
    dead_careers = [c for c in companies
                    if not (audit[c["id"]]["careers_status"] and audit[c["id"]]["careers_status"] < 400)]

    site_owners = collections.defaultdict(list)
    for c in companies:
        site_owners[c["website"]].append(c["name"])
    shared_sites = {u: names for u, names in site_owners.items() if len(names) > 1}
    shared_count = sum(len(v) for v in shared_sites.values())

    fabricated_careers = [
        c for c in companies
        if c.get("careersUrl", "").rstrip("/") == c.get("website", "").rstrip("/") + "/careers"
    ]

    print("\nLINKS")
    print(f"  website does not resolve        {pct(len(dead_site))}")
    print(f"  careersUrl does not resolve     {pct(len(dead_careers))}")
    print(f"  website shared with another co. {pct(shared_count)}  across {len(shared_sites)} URLs")
    print(f"  careersUrl = website + /careers {pct(len(fabricated_careers))}  (pattern-generated)")

    print("\n  Worst shared URLs:")
    for url, names in sorted(shared_sites.items(), key=lambda kv: -len(kv[1]))[:6]:
        status = next((audit[c["id"]]["website_status"] for c in companies if c["website"] == url), None)
        print(f"    {len(names):>2}x  {url}  [HTTP {status}]")
        print(f"          {', '.join(names[:4])}{' …' if len(names) > 4 else ''}")

    # --- Text ---
    desc_counts = collections.Counter(c["shortDescription"] for c in companies)
    templated_desc = sum(v for v in desc_counts.values() if v > 1)
    template_re = re.compile(
        r"provides specialized services, products, and solutions within the UAE"
    )
    templated_body = sum(1 for c in companies if template_re.search(c["whatTheyDo"]))

    print("\nTEXT")
    print(f"  shortDescription is a duplicate {pct(templated_desc)}  ({len(desc_counts)} unique strings)")
    print(f"  whatTheyDo from template        {pct(templated_body)}")
    print(f"  most repeated description       {desc_counts.most_common(1)[0][1]}x")

    # --- Location ---
    coords = collections.Counter((c["location"]["latitude"], c["location"]["longitude"]) for c in companies)
    dup_coords = sum(v for v in coords.values() if v > 1)
    synthetic_addr = sum(1 for c in companies
                         if re.search(r"Regional Office, ", c["location"]["address"]))

    print("\nLOCATION")
    print(f"  coordinates shared with another {pct(dup_coords)}  ({len(coords)} unique points)")
    print(f"  address is '<Name> Regional Office, <Area>'  {pct(synthetic_addr)}")

    # --- Claims presented as sourced ---
    self_sourced = sum(
        1 for c in companies
        if all(s["url"].rstrip("/") in (c["website"].rstrip("/"), c.get("careersUrl", "").rstrip("/"),
                                        c.get("linkedinUrl", "").rstrip("/"))
               for s in c["sources"])
    )
    placeholder_logo = sum(1 for c in companies if "avatar.vercel.sh" in c["logo"])
    same_stamp = collections.Counter(c["lastUpdated"] for c in companies)

    print("\nCLAIMS PRESENTED AS VERIFIED")
    print(f"  'sources' are the company's own links {pct(self_sourced)}")
    print(f"  logo is a generated placeholder       {pct(placeholder_logo)}")
    print(f"  lastUpdated identical for all         {same_stamp.most_common(1)[0]}")
    print(f"  internshipsKnown asserted true        {pct(sum(1 for c in companies if c['internshipsKnown']))}")

    # --- Overall ---
    def is_suspect(c):
        a = audit[c["id"]]
        return (
            not (a["website_status"] and a["website_status"] < 400)
            or len(site_owners[c["website"]]) > 1
            or desc_counts[c["shortDescription"]] > 1
            or "avatar.vercel.sh" in c["logo"]
        )

    suspect = [c for c in companies if is_suspect(c)]
    print("\n" + "=" * 68)
    print(f"  Records with at least one unverifiable or fabricated field:")
    print(f"    {pct(len(suspect))}")
    print(f"  Records that look genuinely researched:")
    print(f"    {pct(n - len(suspect))}")
    print("=" * 68)


if __name__ == "__main__":
    main()
