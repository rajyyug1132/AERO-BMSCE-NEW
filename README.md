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
| `login.html` | Team sign in (invite-only, `noindex`) |

All eight pages share `style.css`, `script.js`, and the assets in `assets/`.

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

## Supabase

Project **AEROBMSCE-02** (`hbugdntqbzxbgnupihah`, ap-southeast-1). Connection details live in `supabase-client.js`, which every page that needs the database loads before its own script.

The publishable key in that file is meant to be public — it identifies the project and grants nothing by itself. Row Level Security decides what any caller may actually do. The `service_role` key must never appear in this repo.

### Tables

`profiles` — team members, keyed to `auth.users`. Rows are created automatically by a trigger when an admin invites someone; there is no public signup. Roles are `admin`, `lead` or `member`. Signed-in members can read the roster and edit only their own row; admins can do anything.

`alumni` — network sign-ups from the Squad page. Anyone may insert, nobody anonymous may read. Rows arrive with `approved = false` and only become publicly visible once an admin flips that flag.

### Verified behaviour

Policies were tested by impersonating the `anon` role: a stranger could insert a row, then read back zero rows, and the entry defaulted to unapproved. Re-run that check after any policy change.

### One deliberate footgun avoided

An admin policy that reads `profiles` from inside a policy *on* `profiles` causes infinite recursion. The `is_admin()` helper is `SECURITY DEFINER` so it reads the table with RLS bypassed and breaks the loop. If you add more admin-gated policies, call `is_admin()` rather than writing a fresh subquery.

The security linter flags `is_admin()` as callable by signed-in users. That is intentional — it only reports on the caller's own role and leaks nothing.

### Creating the first admin

1. Supabase dashboard → Authentication → Users → **Add user**, with a password.
2. The trigger creates their `profiles` row automatically.
3. Promote them:

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

That first promotion has to happen in the SQL editor, since no admin exists yet to authorise it.

## Team login

`login.html` is the members' entrance — split layout, brand statement on the left, sign-in on the right, altimeter rail that fills as the form completes. It carries `noindex, nofollow` so it stays out of search.

Auth lives in `auth.js` and is connected to Supabase. Sign-in calls `signInWithPassword`, and an existing session redirects straight past the form.

It currently redirects to `dashboard.html`, **which does not exist yet** — so a successful sign-in lands on a 404. Building that page is the next job.

## Alumni network

The Squad page carries a network band and a **Join the Network** button that opens an on-site modal. Submissions write into the Supabase `alumni` table.

This replaced an earlier Google Forms approach. Posting to Google Forms has to be sent `no-cors`, which means the browser cannot read the response and a failure looks identical to a success. Writing to Supabase gives a real result, so a duplicate email is reported as "already on the list" and a genuine failure tells the person to email instead.

Moderation is manual by design. Rows arrive unapproved; an admin reviews them in the dashboard before anything is published.

**Alumni cards are not populated.** Rather than invent names, `team.html` has a commented template above the network band. Send me the real roster — name, current role, company, team and years — and photographs for `assets/alumni/`, and I will fill the grid.

**Alumni cards are not populated.** Rather than invent names, `team.html` has a commented template above the network band. Send me the real roster — name, current role, company, team and years — and photographs for `assets/alumni/`, and I will fill the grid.

## Partnership prospectus

`assets/docs/AeroBMSCE-Partnership-Prospectus.pdf` is the 7-page collaboration deck, recompressed from 6.9 MB to 1.7 MB with Ghostscript at 144 dpi — text layer intact.

Its contents are also built into `contact.html` as real HTML: the credibility strip, all four collaboration tiers, and the six partner outcomes. That way the case is readable and indexable without anyone opening a PDF, and the download is there for people who want to forward it.

To refresh after editing the deck:

```bash
gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dColorImageResolution=144 \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=assets/docs/AeroBMSCE-Partnership-Prospectus.pdf new-deck.pdf
```

**Founding year needs settling.** The prospectus cover says ESTD 2010, page 2 says "Established in 2012". The site currently says 2010 throughout — hero telemetry, footer, JSON-LD `foundingDate`. Confirm which is right and I will align all of it.

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
- Build `dashboard.html` — sign-in currently redirects to a page that does not exist
- Set `FORM_ENDPOINT` in `script.js` for the partner and application forms (Supabase could take these too)
- Confirm the T-minus target date in `script.js` against the real 2026 competition calendar
- Settle the 2010 vs 2012 founding year (see above) and align the site and the deck
- Consider adding the DRDO collaboration to `research.html` once it can be described publicly
- Populate the alumni grid on `team.html` once the roster and photographs arrive
