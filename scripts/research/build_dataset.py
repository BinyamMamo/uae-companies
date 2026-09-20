#!/usr/bin/env python3
"""
Build the shipped dataset from the seed data + the URL audit.

This replaces generate_companies_dataset.py, whose templating produced the
fabricated records in the first place. The rule here is the opposite one:

    a field is either backed by something, or it is null.

Nothing is invented to fill a gap. Fields that were pattern-generated are
dropped, and every remaining claim carries provenance saying how far we trust
it. Verified values produced by the agy research pipeline are layered on top
when scripts/research/verified/*.json exist.

Usage:  python3 scripts/research/build_dataset.py
Output: public/data/companies.json
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "scripts/research/seed_companies.json"
AUDIT = ROOT / "scripts/research/url_audit.json"
VERIFIED_DIR = ROOT / "scripts/research/verified"
OUT = ROOT / "public/data/companies.json"

TODAY = date.today().isoformat()

TEMPLATE_DESC = re.compile(
    r"^Established UAE corporate presence operating in .+ across the Emirates\.$"
)
TEMPLATE_BODY = re.compile(
    r"provides specialized services, products, and solutions within the UAE"
)
TEMPLATE_ADDR = re.compile(r" Regional Office, ")
TEMPLATE_REASON = re.compile(r"^Offers roles in .+ suitable for engineering and technology graduates\.$")
PLACEHOLDER_LOGO = "avatar.vercel.sh"

# Category vocabulary was never normalised; three separate filter
# implementations hand-coded alias tables to compensate and had already drifted.
CATEGORY_ALIASES = {
    "ai": "AI / ML",
    "ai/ml": "AI / ML",
    "ai / ml": "AI / ML",
    "software": "Tech / Software",
    "tech / software": "Tech / Software",
    "hardware": "Hardware / Embedded",
    "hardware / embedded": "Hardware / Embedded",
    "automation": "Robotics / Automation",
    "robotics / automation": "Robotics / Automation",
    "data": "Data",
    "cloud": "Cloud",
    "cybersecurity": "Cybersecurity",
    "banking / fintech": "Banking / Fintech",
    "fintech": "Banking / Fintech",
    "telecom": "Telecom / Networks",
    "telecom / networks": "Telecom / Networks",
    "web / digital": "Web / Digital",
    "engineering": "Engineering",
    "consulting": "Consulting",
    "aviation": "Aviation",
    "hospitality": "Hospitality",
    "healthcare": "Healthcare",
    "energy": "Energy",
    "logistics": "Logistics",
    "retail": "Retail",
    "real estate": "Real Estate",
    "education": "Education",
    "iot": "IoT",
    "web": "Web / Digital",
    "embedded": "Hardware / Embedded",
    "devops": "Cloud",
    "ai/ml": "AI / ML",
    "machine learning": "AI / ML",
    "security": "Cybersecurity",
    "finance": "Banking / Fintech",
}


def load_seed():
    """
    The original hand-assembled company list. Kept as a build input only — it
    is never shipped, because most of its fields were template-generated. The
    pipeline treats it as a list of company *names* to research, not as facts.
    """
    return json.loads(SEED.read_text(encoding="utf-8"))


def load_audit():
    if not AUDIT.exists():
        return {}
    return {r["id"]: r for r in json.loads(AUDIT.read_text(encoding="utf-8"))}


def load_verified():
    """
    Records produced by the agy pipeline, keyed by company id.

    Prefers _merged.json, which merge_verified.py writes after validating and
    stripping whatever failed its checks. Raw batch output is only used if no
    merged file exists, and is reported so it is never silently trusted.
    """
    if not VERIFIED_DIR.exists():
        return {}

    merged_path = VERIFIED_DIR / "_merged.json"
    if merged_path.exists():
        paths = [merged_path]
    else:
        paths = sorted(p for p in VERIFIED_DIR.glob("*.json") if not p.name.startswith("_"))
        if paths:
            print("  note: using unvalidated batch output; run merge_verified.py first")

    out = {}
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            print(f"  warn: skipping malformed {path.name}")
            continue
        for rec in data if isinstance(data, list) else []:
            if isinstance(rec, dict) and rec.get("id") and not rec.get("notFound"):
                out[rec["id"]] = rec
    return out


def prov(source_url, confidence):
    return {
        "sourceUrl": source_url,
        "retrievedAt": TODAY if source_url else None,
        "confidence": confidence,
    }


def normalise_categories(cats):
    out = []
    for c in cats or []:
        key = c.strip().lower()
        canon = CATEGORY_ALIASES.get(key, c.strip())
        if canon not in out:
            out.append(canon)
    return out


def resolves(entry, kind):
    if not entry:
        return False
    status = entry.get(f"{kind}_status")
    return bool(status and status < 400)


def build(seed, audit, verified):
    # A URL claimed by more than one company can be right for at most one of
    # them, so we trust none of them.
    site_claims = {}
    for c in seed:
        site_claims.setdefault(c.get("website"), []).append(c["id"])
    contested = {u for u, ids in site_claims.items() if len(ids) > 1}

    coord_claims = {}
    for c in seed:
        key = (c["location"]["latitude"], c["location"]["longitude"])
        coord_claims.setdefault(key, []).append(c["id"])

    out = []
    for c in seed:
        v = verified.get(c["id"], {})
        a = audit.get(c["id"], {})

        # ---- website ----
        website = v.get("website")
        website_prov = prov(v.get("websiteSource"), "verified") if website else None
        if not website:
            claimed = c.get("website")
            if claimed and claimed not in contested and resolves(a, "website"):
                website = a.get("website_final") or claimed
                website_prov = prov(website, "reported")
            else:
                website, website_prov = None, prov(None, "unverified")

        # ---- careers ----
        # 209/225 were website + "/careers", generated rather than found.
        careers = v.get("careersUrl")
        if careers:
            careers_prov = prov(v.get("careersSource") or careers, "verified")
        else:
            claimed = c.get("careersUrl") or ""
            generated = claimed.rstrip("/") == (c.get("website") or "").rstrip("/") + "/careers"
            if claimed and not generated and resolves(a, "careers"):
                careers = a.get("careers_final") or claimed
                careers_prov = prov(careers, "reported")
            else:
                careers, careers_prov = None, prov(None, "unverified")

        # ---- description ----
        desc = v.get("shortDescription")
        body = v.get("whatTheyDo")
        if desc:
            desc_prov = prov(v.get("descriptionSource"), "verified")
        else:
            seeded = c.get("shortDescription") or ""
            seeded_body = c.get("whatTheyDo") or ""
            if TEMPLATE_DESC.match(seeded) or TEMPLATE_BODY.search(seeded_body):
                desc, body, desc_prov = None, None, prov(None, "unverified")
            else:
                desc, body = seeded, seeded_body
                # "reported" means "the company says so", which requires a
                # company site to have said it. With no website we know nothing.
                desc_prov = prov(website, "reported" if website else "unverified")

        # ---- location ----
        loc = dict(c["location"])
        loc["precision"] = "area"
        addr = loc.get("address") or ""
        if v.get("address"):
            loc["address"] = v["address"]
            loc["latitude"] = v.get("latitude", loc["latitude"])
            loc["longitude"] = v.get("longitude", loc["longitude"])
            loc["precision"] = "building"
            loc_prov = prov(v.get("locationSource"), "verified")
        elif TEMPLATE_ADDR.search(addr):
            loc["address"] = None
            loc_prov = prov(None, "unverified")
        else:
            shared = len(coord_claims[(loc["latitude"], loc["longitude"])]) > 1
            loc_prov = prov(
                website,
                "reported" if (website and not shared) else "unverified",
            )
        loc.pop("freeZoneName", None) or None
        loc["freeZoneName"] = c["location"].get("freeZoneName")

        # ---- programmes ----
        if "internshipsKnown" in v or "graduateRolesKnown" in v:
            interns = v.get("internshipsKnown")
            grads = v.get("graduateRolesKnown")
            prog_prov = prov(v.get("programmesSource") or careers, "verified")
        elif careers:
            # Only meaningful if we actually found a careers page.
            interns = c.get("internshipsKnown")
            grads = c.get("graduateRolesKnown")
            prog_prov = prov(careers, "reported")

        else:
            interns, grads, prog_prov = None, None, prov(None, "unverified")

        # ---- sources ----
        # Compare against the SEED urls, not the cleaned ones: nulling a
        # website must not let that company's own link back in as a citation.
        own = {
            (c.get("website") or "").rstrip("/"),
            (c.get("careersUrl") or "").rstrip("/"),
            (c.get("linkedinUrl") or "").rstrip("/"),
            (website or "").rstrip("/"),
            (careers or "").rstrip("/"),
        }
        own.discard("")

        def is_own(url):
            u = url.rstrip("/")
            if u in own:
                return True
            # Also reject anything on the company's own domain.
            host = re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", u)
            return any(
                host and host == re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", o)
                for o in own
            )
        sources = []
        for s in v.get("sources", []):
            if s.get("url"):
                sources.append({"title": s.get("title", "Source"), "url": s["url"], "thirdParty": True})
        for s in c.get("sources", []):
            url = (s.get("url") or "").rstrip("/")
            if url and not is_own(url) and not any(x["url"].rstrip("/") == url for x in sources):
                sources.append({"title": s["title"], "url": s["url"], "thirdParty": True})

        logo = v.get("logo") or c.get("logo")
        if logo and PLACEHOLDER_LOGO in logo:
            logo = None

        reason = c.get("studentMatchReason")
        if reason and TEMPLATE_REASON.match(reason):
            reason = None

        out.append({
            "id": c["id"],
            "name": c["name"],
            "officialName": c.get("officialName"),
            "shortDescription": desc,
            "whatTheyDo": body,
            "industry": None if desc is None else c.get("industry"),
            "categories": normalise_categories(c.get("categories")),
            "location": loc,
            "website": website,
            "careersUrl": careers,
            "logo": logo,
            # 22 stock photos recycled across 225 companies signalled nothing.
            "bannerImage": v.get("bannerImage"),
            "technicalAreas": c.get("technicalAreas", []),
            "commonCareers": c.get("commonCareers", []),
            "internshipsKnown": interns,
            "graduateRolesKnown": grads,
            # The 9 seeded profiles had real-looking LinkedIn URLs for people
            # who could not be confirmed to exist. Publishing those is the
            # worst thing in the dataset, so they go.
            "employees": v.get("employees", []),
            "linkedinUrl": c.get("linkedinUrl"),
            "commute": c["commute"],
            "relevanceScore": c.get("relevanceScore", 0),
            "studentMatchReason": reason,
            "sources": sources,
            "lastUpdated": v.get("retrievedAt") or (TODAY if website else None),
            "provenance": {
                "website": website_prov,
                "careersUrl": careers_prov,
                "location": loc_prov,
                "description": desc_prov,
                "programmes": prog_prov,
            },
        })
    return out


def main():
    seed = load_seed()
    audit = load_audit()
    verified = load_verified()
    records = build(seed, audit, verified)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    n = len(records)
    def count(pred):
        k = sum(1 for r in records if pred(r))
        return f"{k:>3}/{n} ({k * 100 // n:>2}%)"

    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB, {n} records)")
    print(f"  website kept            {count(lambda r: r['website'])}")
    print(f"  careersUrl kept         {count(lambda r: r['careersUrl'])}")
    print(f"  description kept        {count(lambda r: r['shortDescription'])}")
    print(f"  street address kept     {count(lambda r: r['location']['address'])}")
    print(f"  real logo kept          {count(lambda r: r['logo'])}")
    print(f"  third-party sources     {count(lambda r: r['sources'])}")
    print(f"  verified by research    {count(lambda r: r['provenance']['website']['confidence'] == 'verified')}")
    print(f"  employees published     {count(lambda r: r['employees'])}")


if __name__ == "__main__":
    main()
