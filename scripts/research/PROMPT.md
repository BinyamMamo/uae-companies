# Company verification task

You are verifying facts about companies that operate in the UAE, for a
directory used by university students looking for internships and graduate
roles. The directory previously contained invented data. Your job is to
replace guesses with sourced facts, **or to say you could not find them**.

## Tools

Use `search_web` and `read_url_content` only. You have no shell and no file
access in this run, do not attempt to run commands or write files.

## Absolute rules

1. **Use `search_web` for every company.** Do not answer from memory.
2. **Never guess a URL.** Do not construct `https://www.<name>.com`, and never
   construct a careers URL by appending `/careers` to a homepage. If you did
   not see the page in a search result, the field is `null`.
3. **A field you cannot verify is `null`.** An empty field is a correct answer.
   A plausible-looking invention is a failure.
4. **Do not invent people.** Leave `employees` out entirely.
4b. **Do not invent roles.** `commonCareers` must be roles you actually saw
   advertised or described for *this* company, on its careers page, a job
   board listing, or a news article. Do not infer roles from the industry.
   A university mostly hires academic and administrative staff, not "Cloud
   Architects"; a trading company is not a software house. If you did not see
   real openings, return `"commonCareers": []`. The same applies to
   `technicalAreas`: leave it empty unless the company describes that work.
4c. **Name the programmes.** If the company runs a named internship or graduate
   scheme, put its actual name in `programmes` (e.g. "Emirati Graduate
   Programme", "Summer Internship"). Only names you saw published. If you can
   tell a scheme exists but it has no public name, leave `programmes` empty and
   set the boolean instead.
5. **`sources` must be third-party**, news, government registries, directories,
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
    "linkedinUrl": "https://www.linkedin.com/company/microsoft",
    "linkedinSource": "https://... where this LinkedIn page was linked from",
    "shortDescription": "One factual sentence about what they do in the UAE.",
    "whatTheyDo": "Two to three sentences: products, services, who they serve, which technical teams they run in the UAE.",
    "descriptionSource": "https://...",
    "industry": "Technology & Software",
    "commonCareers": ["Cloud Solution Architect", "Account Technology Strategist"],
    "careersEvidence": "https://... the page where these roles were listed",
    "technicalAreas": ["Cloud Computing", "AI"],
    "address": "Building 8, Dubai Internet City, Dubai, UAE",
    "latitude": 25.09721,
    "longitude": 55.16854,
    "locationSource": "https://...",
    "internshipsKnown": true,
    "graduateRolesKnown": true,
    "programmes": [
      { "name": "Microsoft Internship Programme", "kind": "internship" },
      { "name": "Microsoft Aspire Graduate Programme", "kind": "graduate" }
    ],
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


- **A URL that loads is not the same as the right URL.** `https://www.university.com`
  answers with a 200 and is not the University of Dubai; `time.com` is not TIME
  Hotels. Before you return a `website`, read the page and confirm it names this
  company. If the page belongs to someone else, omit the field.
- **Only return `linkedinUrl` if you actually found the page linked from
  somewhere.** Never build one from the company name, `linkedin.com/company/<slug>`
  guesses were 404s. If you cannot cite where you saw it, omit it.
