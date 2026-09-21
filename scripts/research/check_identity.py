#!/usr/bin/env python3
"""
Check that a company's website actually belongs to that company.

check_urls.py only asks whether a URL resolves. That is not the same question:
https://www.university.com resolves perfectly and has nothing to do with
University of Dubai, and 14 "Al-*" companies once pointed at al.com, an Alabama
news site. This fetches each page and looks for the company in its content.

Usage:  python3 scripts/research/check_identity.py [--limit N] [--out FILE]
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
DATA = ROOT / "public/data/companies.json"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")
TIMEOUT = 15

# Only legal-form suffixes are dropped outright. Geography is NOT noise: the
# whole point of the "University of Dubai" -> university.com error is that
# "Dubai" was the distinguishing word and got thrown away.
LEGAL = {
    "llc", "l", "lc", "fze", "fzc", "fzco", "ltd", "limited", "inc",
    "plc", "co", "corp", "corporation", "est", "establishment", "the",
    "and", "for", "of",
}


def tokens(name):
    """Words from a company name that a genuine page should contain."""
    base = re.sub(r"\(.*?\)", " ", name)
    words = re.findall(r"[a-z0-9]+", base.lower())
    keep = [w for w in words if w not in LEGAL and len(w) > 2]
    return keep or [w for w in words if len(w) > 1]


def acronyms(name):
    """Bracketed short forms plus the initials of the name's real words."""
    out = {m.lower() for m in re.findall(r"\(([A-Za-z]{2,6})\)", name)}
    toks = tokens(name)
    if len(toks) > 1:
        out.add("".join(t[0] for t in toks))
    return {a for a in out if len(a) >= 2}


def domain(url):
    return re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", url or "").lower()


def normalise(text):
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def fetch(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
        raw = r.read(400_000)
        charset = r.headers.get_content_charset() or "utf-8"
        return r.status, r.geturl(), raw.decode(charset, "replace")


def page_text(html):
    html = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", html,
                  flags=re.S | re.I)
    title = ""
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    return title, text[:20000]


def check(company):
    cid, name, url = company["id"], company["name"], company.get("website")
    out = {"id": cid, "name": name, "website": url}
    if not url:
        out["verdict"] = "no-website"
        return out
    try:
        status, final, html = fetch(url)
    except urllib.error.HTTPError as e:
        out["verdict"] = "blocked" if e.code in (401, 403, 405, 429, 999) else "dead"
        out["detail"] = f"HTTP {e.code}"
        return out
    except Exception as e:  # noqa: BLE001 - any transport failure is the same answer here
        out["verdict"] = "unreachable"
        out["detail"] = str(e)[:70]
        return out

    title, text = page_text(html)
    page = normalise(f"{title} {text}")
    dom = domain(final)
    toks = tokens(name)
    hits = [t for t in toks if re.search(rf"\b{re.escape(t)}", page)]
    acr = acronyms(name)
    # The domain is evidence in its own right: ey.com is Ernst & Young even
    # though the homepage may never spell "Ernst" out.
    dom_backs_it = any(t in dom for t in toks) or any(a in dom for a in acr)
    full_name_on_page = normalise(name) and normalise(name) in page

    # The domain counts as evidence, but it cannot carry the whole claim on its
    # own: "university" is in university.com and that page is not University of
    # Dubai. Every word of the name has to turn up somewhere.
    evidence = f"{page} {dom}"
    all_found = bool(toks) and all(
        re.search(rf"\b{re.escape(t)}", evidence) for t in toks
    )
    # An acronym rescues the abbreviated-brand case (ey.com really is Ernst &
    # Young) but only when the page uses it too.
    acr_ok = any(
        a in dom and re.search(rf"\b{re.escape(a)}\b", page) for a in acr
    )

    if full_name_on_page or all_found or acr_ok:
        verdict = "ok"
    elif len(toks) > 3 and len(hits) >= len(toks) - 1:
        verdict = "ok"
    else:
        verdict = "mismatch"

    out.update({
        "final": final,
        "title": title[:90],
        "domain": dom,
        "matched": hits,
        "of": toks,
        "domainBacksIt": dom_backs_it,
        "verdict": verdict,
    })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--out", default=str(ROOT / "scripts/research/identity_audit.json"))
    args = ap.parse_args()

    companies = json.loads(DATA.read_text(encoding="utf-8"))
    if args.limit:
        companies = companies[: args.limit]

    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(check, companies))

    counts = {}
    for r in results:
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
    for k in sorted(counts, key=lambda k: -counts[k]):
        print(f"{counts[k]:>4}  {k}")

    bad = [r for r in results if r["verdict"] == "mismatch"]
    if bad:
        print(f"\n{len(bad)} sites whose content does not mention the company:")
        for r in bad:
            print(f"  {r['name']}")
            print(f"      {r['website']}  ->  {r.get('title', '')!r}")

    Path(args.out).write_text(json.dumps(results, indent=1), encoding="utf-8")
    print(f"\nwrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
