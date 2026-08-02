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
| `index.html` | Home — hero, stats, flight log, R&D, squad, section map |
| `mission.html` | Discipline, cadence, people |
| `research.html` | R&D projects and the 2026 manifest |
| `team.html` | Squad, by division |
| `gallery.html` | Competition photography, by album |
| `join.html` | Divisions, recruitment process, application form |
| `contact.html` | Partnership contact and enquiry form |

All seven pages share `style.css`, `script.js`, and the assets in `assets/`.

## The hero aircraft

`assets/plane/` holds 60 WebP frames of a SolidWorks turntable render of the DDC airframe. `script.js` preloads them and plays them as an image sequence — it idles at a slow spin, and cursor movement across the hero steers the speed and direction.

To regenerate from a fresh render, export a turntable as a PNG sequence with a transparent background, then crop to the union bounding box and downsample to WebP.

## Forms

Both forms (partnership on `contact.html`, application on `join.html`) run through one handler in `script.js`.

Out of the box `FORM_ENDPOINT` is empty, so submitting opens the visitor's mail client with every field already filled in and addressed to `aerobmsce@bmsce.ac.in`. Nothing is lost, but nothing is logged either.

To receive submissions as email instead, create a form at [formspree.io](https://formspree.io) and set the constant in `script.js`:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
```

The handler then POSTs the fields, shows a sending state, and reports failures with the fallback address.

## Logos

`assets/logos/` holds every mark, converted to WebP with transparency preserved and trimmed to the ink.

| File | Where it appears |
| --- | --- |
| `aerobmsce-wordmark.webp` | Nav brand, footer, favicon |
| `fleet-blue-impulse.webp`, `fleet-yaksha.webp` | Competition teams on `team.html` |
| `sponsor-*.webp` | Sponsor wall on `contact.html` |
| `bmsce.svg` | Institutional mark in the footer |

Two sponsor logos — UAV Marketplace and Quadkart — arrived as black artwork, which disappears on this background, so their ink is recoloured to beige. If a vendor sends a proper light version later, drop it in and delete the recoloured file.

Flying Phantoms currently renders as an initials badge. Add `fleet-flying-phantoms.webp` to `assets/logos/` and swap the `.fleet-mark--empty` block in `team.html` for an `img` to use the real mark.

## Photography

`assets/media/` holds competition photos from two campaigns — `usa-*` from SAE Aero Design West in Texas, `ddc-*` from the Drone Development Challenge in Tamil Nadu. Sources were 7–15 MB JPEGs; they're resized to 1500 px on the long edge and saved as WebP at quality 76, which lands each one between 55 and 290 KB.

To add more, drop the file in `assets/media/` and copy any `figure.media-tile` block in `gallery.html`, swapping the `src`, `alt`, caption and dimensions. `media-tile--wide` spans two columns — use it for landscape hero shots and team photos. Start a new campaign with an `album-head` block.

## Deploying

**Vercel** — import the repo at [vercel.com/new](https://vercel.com/new). No framework, no build command, output directory is the root. `vercel.json` sets clean URLs and long-lived caching on `assets/`.

**GitHub Pages** — Settings → Pages → Source: `main`, folder `/ (root)`. Note that Pages ignores `vercel.json`, so URLs keep their `.html` extensions.

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

- Replace the placeholder squad names in `team.html` with the real roster and photographs
- Set `FORM_ENDPOINT` once a Formspree form exists
- Confirm the T-minus target date in `script.js` against the real 2026 competition calendar
