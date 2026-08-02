# AeroBMSCE

Website for the Aeronautical Society of BMS College of Engineering — the aerospace and UAV club that has designed, built and flown fixed-wing, VTOL and hybrid airframes since 2010.

## Running it

Static site, no build step. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

## Structure

| File | Page |
| --- | --- |
| `index.html` | Home — hero, stats, countdown, section map |
| `mission.html` | Discipline, cadence, people |
| `flight-log.html` | Competition results, 2017–2025 |
| `research.html` | R&D projects and the 2026 manifest |
| `team.html` | Squad, by division |
| `gallery.html` | Media, joining, partnership links |
| `contact.html` | Partnership contact and enquiry form |

All seven pages share `style.css`, `script.js`, and the assets in `assets/plane/`.

## The hero aircraft

`assets/plane/` holds 60 WebP frames of a SolidWorks turntable render of the DDC airframe. `script.js` preloads them and plays them as an image sequence — it idles at a slow spin, and cursor movement across the hero steers the speed and direction.

To regenerate from a fresh render, export a turntable as a PNG sequence with a transparent background, then crop to the union bounding box and downsample to WebP.

## Palette

Defined as custom properties at the top of `style.css`.

| Role | Value |
| --- | --- |
| Background | `#0A0807` → `#1C1512` |
| Brick accent | `#9A3323` / `#C4502F` |
| Gold cosmetics | `#F4C430` / `#E0A542` |
| Beige elements | `#F5EBDA` → `#8C6E54` |

Type is Space Grotesk for headings, Inter for body, JetBrains Mono for telemetry and labels.

## Still to do

- Point the contact form at a real endpoint — it currently only shows a confirmation message client-side
- Build the Media and Join pages that the gallery tiles link to
- Replace the placeholder squad names with real members and photographs
