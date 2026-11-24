# Roti Bank Website 2.0 — design demo

Zik Digital's demo of the new rotibankfoundation.org, built from the pitch
"Roti Bank Website 2.0 and Impact Platform" (Nov 2026). It's a static demo for
Vercel. Its design, tokens, sections and fact sheet carry straight over to the
WordPress theme.

## Run it locally

```powershell
python build.py      # builds src/ into site/
python serve.py      # http://localhost:5173 (clean URLs, like Vercel)
```

## Deploy to Vercel

Only the `site` folder is deployed. Sign in to Vercel when the CLI asks.

```powershell
cd "C:\Users\HP\OneDrive\Desktop\ZIK\roti new website\site"
npx vercel --prod
```

When it asks: set up and deploy → yes, link to existing project → no,
directory → `./`, and accept the defaults (no build command).
`site/vercel.json` turns on clean URLs (`/give`, `/csr`, …).

## Folders

| Path | What it is |
|---|---|
| `src/data/facts.json` | **The fact sheet.** Every figure on every page comes from here. Change a number, rebuild, and it updates everywhere. |
| `src/pages/*.html` | The 12 pages. `{{fact:key}}` tokens are filled from the fact sheet at build time. |
| `src/partials/` | Shared head, header and footer. |
| `src/assets/css/main.css` | The design system. Its tokens become the WordPress `theme.json`. |
| `src/assets/js/main.js` | ₹40 calculator, give flow (demo), counters, CSR proposal builder, shift calendar, drive kit. |
| `src/assets/js/i18n.js` | Hindi and Marathi strings (drafts for the Roti Bank team to review). |
| `src/assets/img/` | Real Roti Bank photos from the WordPress media library, as optimised WebP. |
| `_source-assets/` | Original downloads from WordPress. Not deployed. |
| `site/` | Build output. This is what goes to Vercel. |

## Pages

Home · Give (one-page checkout with PAN and 80G) · Get involved (shift calendar,
ration drive kit, internships) · Partner (CSR) (sizes, proposal builder with
PDF, partner dashboard, document room) · Our work · Impact (The Record) ·
Hunger & Food Waste Watch · About (founder, trustees, transparency,
acknowledgements) · Press · Samachar · My account (donor dashboard) · Fact sheet.

## What is demo, and what is real

- **Real:** all Roti Bank figures (Samachar Issue 92, Oct 2026, and earlier
  issues), the hunger and food-waste figures with their sources, the bank
  details, the founder's and trustees' bios, the principals' testimonials and
  the photographs.
- **Demo:** payments (no money is taken), OTP, receipts, forms, the volunteer
  shift seats, the drive leaderboard, the CSR partner dashboard, the donor
  dashboard and the "Today in the kitchen" figures. Each is labelled on the page.
- `noindex` is set on every page, so the demo never competes with the live
  site in search.

## Before it goes to the client

- Get a native speaker on the Roti Bank team to check the Hindi and Marathi.
- Swap in full-resolution photos from Roti Bank's drive. Most library images
  are under 700 px wide.
- Confirm the figures against the October 2026 fact sheet with the Managing
  Trustee.
