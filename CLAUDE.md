# 0005 � TorontoRestaurants

@PROJECT_BRIEF.md

Created: 2026-03-13

## Stack
- Frontend: HTML + vanilla JS + CSS (static site, no build step)
- Map: Leaflet.js + CARTO/OpenStreetMap tiles
- Data pipeline: Python (openpyxl) → JSON, one-time geocoding via Nominatim
- Hosting: GitHub Pages from `docs/` folder

## Key Files & Folders
- `To Try.xlsx` — source data (restaurant list)
- `scripts/build_data.py` — converts xlsx → `docs/data/restaurants.json` with geocoding
- `docs/` — static site served by GitHub Pages (index.html, style.css, app.js)
- `docs/data/restaurants.json` — generated restaurant data with lat/lng

## Data Sources & Credits
- Map tiles: [CARTO](https://carto.com/) (light basemap) via OpenStreetMap
- Map library: [Leaflet.js v1.9.4](https://leafletjs.com/)
- Geocoding: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) (one-time, with manual overrides)
- Fonts: [DM Sans / DM Serif Display](https://fonts.google.com/) via Google Fonts

## Project-Specific Rules
[Any rules that override or extend the global CLAUDE.md for this project]

## Checklist
- [ ] PROJECT_BRIEF.md completed
- [ ] Folder structure confirmed
- [ ] `.env` created from `.env.example`
- [ ] GitHub repo created and linked
- [ ] README completed
