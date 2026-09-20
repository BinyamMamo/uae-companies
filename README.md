# UAE Company Discovery

A company directory for students at Dubai International Academic City looking for
internships and graduate roles in the UAE. Every company is shown with its distance
from your home address, an estimated RTA bus commute, and a driving time — so you can
judge a job by whether you can actually get to it.

## Features

- **Browse & filter** by industry, emirate, area, free-zone status, and maximum distance
- **Map view** with district boundaries and category-coloured pins
- **Commute routing** — leg-by-leg RTA transit itineraries and driving routes from your home
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
them — analytics and sign-in simply stay switched off.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Leaflet · lucide-react

Map tiles come from ArcGIS; address search uses OpenStreetMap Nominatim.

## Data

Company records live in `src/data/`. Each field carries a source URL, a retrieval date,
and a confidence level — see `scripts/research/` for the verification pipeline that
produces them. Anything that cannot be verified against a public source is left out
rather than estimated.

Validate the dataset with:

```bash
python3 scripts/verify_dataset.py
```
