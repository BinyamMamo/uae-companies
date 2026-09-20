# Company verification task

You are verifying facts about companies that operate in the UAE, for a
directory used by university students looking for internships and graduate
roles. The directory previously contained invented data. Your job is to
replace guesses with sourced facts, **or to say you could not find them**.

## Absolute rules

1. **Use Google Search for every company.** Do not answer from memory.
2. **Never guess a URL.** Do not construct `https://www.<name>.com`, and never
   construct a careers URL by appending `/careers` to a homepage. If you did
   not see the page in a search result, the field is `null`.
3. **A field you cannot verify is `null`.** An empty field is a correct answer.
   A plausible-looking invention is a failure.
4. **Do not invent people.** Leave `employees` out entirely.
5. **`sources` must be third-party** — news, government registries, directories,
   university career pages. The company's own website is not a source for
   claims about itself; it goes in `website`, not `sources`.
6. If two companies share a name fragment (e.g. several "Al ..." groups), make
   sure the site you return belongs to *this specific company*, in the UAE.
7. Coordinates must be the actual office, to 5 decimal places. If you only know
   the district, return `null` for `latitude`/`longitude` rather than a
   district centroid.

## Output

Return **only** a JSON array, no prose, no code fences. One object per input
company, using the same `id`. Use this shape, omitting keys you cannot fill:

```json
[
  {
    "id": "microsoft",
    "website": "https://www.microsoft.com/en-xm",
    "websiteSource": "https://...",
    "careersUrl": "https://careers.microsoft.com/...",
    "careersSource": "https://...",
    "shortDescription": "One factual sentence about what they do in the UAE.",
    "whatTheyDo": "Two to three sentences: products, services, who they serve, which technical teams they run in the UAE.",
    "descriptionSource": "https://...",
    "industry": "Technology & Software",
    "address": "Building 8, Dubai Internet City, Dubai, UAE",
    "latitude": 25.09721,
    "longitude": 55.16854,
    "locationSource": "https://...",
    "internshipsKnown": true,
    "graduateRolesKnown": true,
    "programmesSource": "https://...",
    "logo": "https://upload.wikimedia.org/...",
    "retrievedAt": "2026-09-20",
    "sources": [
      { "title": "Gulf News coverage", "url": "https://..." }
    ],
    "notes": "Anything ambiguous, e.g. 'two UAE entities share this name'."
  }
]
```

If a company cannot be confirmed to exist in the UAE at all, return
`{"id": "...", "notFound": true, "notes": "..."}` for it.
