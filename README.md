# UAE Company Discovery

A company directory for students at Dubai International Academic City looking for
internships and graduate roles in the UAE. Every company is shown with its distance
from your home address, an estimated RTA bus commute, and a driving time, so you can
judge a job by whether you can actually get to it.

## Features

- **Browse & filter** by industry, emirate, area, free-zone status, and maximum distance
- **Map view** with district boundaries and category-coloured pins
- **Commute routing**, leg-by-leg RTA transit itineraries and driving routes from your home
- **Saved lists** you can name, organise, and share by link
- **Comparison** of up to four companies side by side
- **Personalised ranking** based on your declared technical interests
- **Light / dark themes** with selectable accent colours

## Getting started

```bash
npm install
npm run dev      # http://127.0.0.1:5173
```

```bash
npm run build    # type-check + production build
npm run lint     # oxlint
npm run preview  # serve the production build locally
```

## Configuration

Copy `.env.example` to `.env.local` and fill in the values. The app runs without any of
them, analytics and sign-in simply stay switched off, and everything stays local to
the browser.

| Variable | What it enables |
|---|---|
| `VITE_FIREBASE_*` | Google sign-in and cross-device sync of saved lists |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics, visitor counts, daily actives, feature usage |
| `VITE_GOOGLE_CLIENT_ID` | The Google One Tap prompt (optional; sign-in works without it) |

Set the same values on Vercel with `vercel env add`.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Leaflet · lucide-react

Map tiles come from ArcGIS; address search uses OpenStreetMap Nominatim.

## Data

`public/data/companies.json` is fetched at runtime rather than bundled. Every claim a
user might act on carries provenance, a source URL, a retrieval date and a confidence
level, and the UI shows an "unverified" badge instead of presenting a guess as a fact.

**A field is either backed by a source or it is `null`.** Nothing is invented to fill a
gap: no constructed careers URLs, no district centroids passed off as street addresses,
no placeholder logos, and no employee profiles that cannot be confirmed.

The dataset is produced by the pipeline in [`scripts/research/`](scripts/research/),
which uses the Antigravity CLI's Google Search grounding to research companies and then
re-fetches every URL it returns before accepting it. See
[`scripts/research/README.md`](scripts/research/README.md) for how to run it.

Validate the dataset, this is the CI gate, and it fails on duplicate URLs, shared
coordinates, templated text and missing provenance:

```bash
python3 scripts/verify_dataset.py
```

## Testing

There is no unit-test suite; the checks that matter here are run against a real browser:

```bash
npm run build     # tsc --strict + production build
npm run lint      # oxlint
python3 scripts/verify_dataset.py
```
