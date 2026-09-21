#!/usr/bin/env python3
"""
Choose one logo per company from what its own website offered.

The site is the authority on its own brand, and it is a URL already confirmed to
belong to that company, so nothing new has to be trusted. The ranking matters
more than it looks: a page's <img> tags labelled "logo" include cookie-consent
banners and partner badges, so a same-origin apple-touch-icon beats them.

Input:  logo-candidates.json from the browser scrape
Output: scripts/research/logos.json  {id: url}
"""
import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts/research/logos.json"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")

# Consent banners, analytics and social buttons all ship images called "logo".
THIRD_PARTY = re.compile(
    r"cookielaw|onetrust|cookiebot|trustpilot|googletagmanager|doubleclick"
    r"|facebook\.|twitter\.|x\.com|instagram\.|youtube\.|linkedin\.com"
    r"|gstatic|google-analytics|hotjar|cloudflareinsights|recaptcha"
    r"|paypal|visa\.|mastercard|whatsapp|appstore|play\.google",
    re.I,
)
# A banner or hero shot is not a logo.
BAD_SHAPE = re.compile(r"banner|hero|cover|background|slider|placeholder", re.I)

# Words that appear in many company names and so prove nothing about whose
# logo an image is.
GENERIC_WORDS = {
    "group", "holding", "holdings", "middle", "east", "dubai", "emirates",
    "international", "services", "trading", "general", "national", "global",
    "company", "limited", "bank", "capital", "media", "systems", "solutions",
    "technologies", "industries", "enterprises", "partners", "consulting",
}


def host(url):
    return re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", url or "").lower()


def registered(url):
    """example.co.uk -> example.co.uk ; www.a.example.com -> example.com"""
    parts = host(url).split(".")
    return ".".join(parts[-3:] if len(parts) > 2 and len(parts[-2]) <= 3 else parts[-2:])


def score(cand, site, other_brands):
    """Rank candidates. A page <img> labelled "logo" is the least trustworthy
    source: CHEP's homepage offered Coca-Cola's logo, Seddiqi's offered Patek
    Philippe, L'Oreal's og:image was a photo of a model. A same-origin
    apple-touch-icon or favicon is the site declaring its own mark, so those
    win even though they are lower resolution."""
    url = cand.get("url") or ""
    if not url or THIRD_PARTY.search(url) or BAD_SHAPE.search(url):
        return -1

    same_site = registered(url) == registered(site)
    # Another company's name in the image URL or alt text means it is their
    # logo on this page, not this company's.
    haystack = f"{url} {cand.get('alt', '')}".lower()
    if any(b in haystack for b in other_brands):
        return -1

    kind = cand["kind"]
    if kind == "apple-touch-icon":
        s = 100
    elif kind == "icon":
        s = 80
        if url.lower().endswith(".ico"):
            s -= 25  # usually 16px and ugly scaled up
    elif kind == "img":
        # Only trust a page image when it is the site's own and the path itself
        # says logo - not merely a CSS class somewhere on the element.
        if not same_site or not re.search(r"logo", url, re.I):
            return -1
        s = 70
        w, h = cand.get("w") or 0, cand.get("h") or 0
        if w and h:
            ratio = w / h
            if ratio > 8 or ratio < 0.2:
                s -= 40  # a long strip is a banner
            if w < 40 or h < 20:
                s -= 15
    else:
        # og:image is a share card: a photo, a campaign, a building. Never used.
        return -1

    if same_site:
        s += 25
    if url.lower().endswith(".svg"):
        s += 12
    return s


def loads(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            ctype = (r.headers.get("Content-Type") or "").lower()
            body = r.read(120_000)
            if not body:
                return False, "empty"
            if "image" not in ctype and not body[:5].lower().startswith(b"<?xml"):
                return False, f"not an image ({ctype[:30]})"
            if len(body) < 120:
                return False, "suspiciously small"
            return True, ctype
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001
        return False, str(e)[:50]


def main(path):
    records = json.loads(Path(path).read_text(encoding="utf-8"))

    # Every other company in the set, as lowercase words, so a logo that names
    # one of them can be spotted on someone else's page.
    all_names = {r["id"]: r.get("name", "") for r in records}
    picks = {}
    for r in records:
        site = r.get("website") or ""
        mine = re.findall(r"[a-z]{4,}", r.get("name", "").lower())
        others = {
            w
            for cid, n in all_names.items()
            if cid != r["id"]
            for w in re.findall(r"[a-z]{5,}", n.lower())
            if w not in mine and w not in GENERIC_WORDS
        }
        ranked = sorted(
            ((score(c, site, others), c) for c in (r.get("candidates") or [])),
            key=lambda x: -x[0],
        )
        # Keep a few so a dead first choice can fall through.
        picks[r["id"]] = [c for s, c in ranked if s > 0][:3]

    chosen, failed = {}, []

    def resolve(item):
        cid, cands = item
        for c in cands:
            ok, why = loads(c["url"])
            if ok:
                return cid, c["url"], None
        return cid, None, (cands[0]["url"] if cands else None)

    with ThreadPoolExecutor(max_workers=12) as pool:
        for cid, url, bad in pool.map(resolve, picks.items()):
            if url:
                chosen[cid] = url
            elif bad:
                failed.append(cid)

    OUT.write_text(json.dumps(chosen, indent=1, sort_keys=True), encoding="utf-8")
    print(f"{len(chosen)} logos chosen and confirmed to load")
    print(f"{len(failed)} had candidates that all failed to load")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
