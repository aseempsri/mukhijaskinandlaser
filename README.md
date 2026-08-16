# Mukhija Skin & Laser Clinic — React Build

## Run the project

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. The React/Vite app preserves every
page supplied in this folder and restores the linked pages that were referenced but
missing from disk, using factual content recovered from the live clinic site:

- Home, Treatments, Privacy, Terms, Medical Disclaimer
- About Clinic, Dr. R. D. Mukhija, Dr. Gaurav Mukhija
- Acne Scar Treatment, Open Pores Treatment
- Before & After, Contact, Book Appointment, 404

It keeps original `.html` and pretty directory URLs in `dist`, includes sitemap /
robots / redirect files, page-specific SEO metadata, responsive navigation, treatment
filters, reveal effects, before/after interaction, and a frontend appointment stepper.
Marketing tone is kept measured; no medical claims were invented beyond legacy facts.

## GitHub Pages deploy

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which builds the Vite
app and deploys the `dist` folder to GitHub Pages. Production assets use the base path
`/mukhijaskinandlaser/` so logo and CSS resolve at:

`https://aseempsri.github.io/mukhijaskinandlaser/`

One-time repo setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The historical prototype notes follow below.

# Historical Prototype Notes

## Changelog — audit fixes applied after first pass

A follow-up audit caught and fixed these gaps:

- Added the 4 legacy treatments that had no card anywhere: Acne Surgery, Removal of
  Corns/Warts/Skin Tags/Cysts, Skin Fairness Treatment, Venereal Disease & Sexual
  Health, plus a distinct Ingrowing Toenail Treatment card.
- Added `sitemap.xml`, `robots.txt`, and an explicit `redirect-map.md` (previously
  only described in prose here).
- Added site-wide `MedicalClinic` JSON-LD structured data, `og:image`/`twitter:image`
  meta tags.
- Added `privacy-policy.html`, `terms.html`, `medical-disclaimer.html` — the footer
  links previously pointed to `#`.
- Added a skip-to-content link and `aria-live="polite"` on the appointment stepper.
- Added `loading="lazy"` to below-the-fold card images.

**Still open** (called out honestly, not fixed in this pass): the blog/Insights
section and the one real legacy post ("5 Myths About Laser Hair Removal") were not
rebuilt; no site search; no analytics/GTM wiring or conversion-tracking event
attributes; ~23 treatment cards still link to `#` pending their own template pass
(see Data model section above for how to build them); Physician/FAQPage/Breadcrumb
schema only sketched, not implemented per-page; legal page copy is a starting
template that needs actual legal review before publishing.

## What's in this build


A static, production-styled prototype of the redesign, built from real content pulled
from `mukhijaskinclinic.com` (name, address, phone, email, hours, doctor credentials,
machine list, and the full text of the Acne Scar and Open Pores treatment pages).
No medical claims, numbers, or credentials were invented — anything not explicitly on
the current site (prices, exact success rates, extra awards) was left out rather than
guessed.

**Pages included** (open `index.html` in a browser to start):

| Page | File | Old URL preserved? |
|---|---|---|
| Home | `index.html` | ✅ `/` |
| About Clinic | `about-clinic.html` | ✅ `/about-clinic/` |
| Dr. R. D. Mukhija | `dr-r-d-mukhija.html` | ✅ `/dr-r-d-mukhija/` |
| Dr. Gaurav Mukhija | `dr-gaurav-mukhija-2.html` | ✅ `/dr-gaurav-mukhija-2/` |
| Treatments hub (category browse) | `treatments.html` | new page, see redirect note |
| Acne Scar Treatment (full template) | `acne-scar-treatment-gorakhpur.html` | ✅ `/acne-scar-treatment-gorakhpur/` |
| Open Pores Treatment (full template) | `open-pores-treatment-gorakhpur.html` | ✅ `/open-pores-treatment-gorakhpur/` |
| Before & After | `before-after.html` | ✅ `/before-after/` |
| Contact | `contact-us.html` | ✅ `/contact-us/` |
| Book Appointment | `book-appointment.html` | ✅ `/book-appointment/` |
| 404 | `404.html` | — |

Design system lives in `css/styles.css`; shared interaction (sticky header, mobile
drawer, FAQ accordion, before/after slider, treatment filters, appointment stepper)
lives in `js/main.js`. Pages are assembled by the Python scripts (`build.py` +
`pages*.py`) from shared header/footer partials — that's the "one template, many
pages" pattern the brief asks for, minus a framework. Run `python3 pages.py
pages_treatments.py pages_treatment_detail.py pages_doctors.py pages_about.py
pages_more.py` to rebuild everything from source.

## Design decisions (why it looks this way)

- **Palette**: warm ivory ground (`#FAF6EF`), ink text, a muted bronze accent
  (`#A5793A`) used only for eyebrows/links/hover states, sage green for tags, and a
  deep clinical green (`#232C1E`) for the header-anchored dark sections (trust bar,
  CTA bands, footer) — a stand-in for "premium clinical" that isn't the generic
  cream+terracotta or navy-blue hospital template.
- **Type**: Fraunces (a soft, editorial serif with real optical personality) for
  headings, paired with Inter for body/UI — "medical authority + editorial warmth"
  per the brief, without defaulting to Playfair Display.
- **Signature element**: the hairline-rule stat strip and dashed "prescription pad"
  list styling on the sidebar/snapshot cards nods to the clinic's academic,
  record-keeping heritage (Dr. R. D. Mukhija's 35-year teaching career) rather than
  a generic wellness-brand look.
- Motion is restrained: fades on scroll, hover lifts on cards, no parallax; all
  respects `prefers-reduced-motion`.

## What's placeholder and must be replaced before launch

- **All photography** is stock (Unsplash) purely to show composition/cropping —
  replace with the clinic's real logo, doctor portraits, clinic interior, equipment,
  and **clinic-approved** before/after photography (Section 32 of the brief).
- **Before/after images** use the same stock photo for both sides of the slider —
  it's there to demonstrate the drag-to-compare interaction only, not real results.
- **Testimonials** are the two real Google reviews quoted on the current homepage;
  no testimonials were invented.
- **The appointment form** is frontend-only (see the note printed to the browser
  console on submit). It needs to be wired to a real appointments API, CRM, or at
  minimum an email/SMS notification service before go-live.
- **Google Maps embed** reuses the current site's iframe `src` — swap the API key /
  embed source per your Google Cloud project when you productionise this.

## Data model (Section 35 of the brief)

The two live treatment pages were hand-built from this shape; the same shape scales
to the remaining ~27 treatment pages listed in the brief's Section 42 page inventory:

```ts
type Treatment = {
  slug: string;              // e.g. "hair-fall-treatment-gorakhpur"
  name: string;
  category: "Skin" | "Laser" | "Hair" | "Medical";
  shortDescription: string;  // for cards
  introduction: string;
  understanding: string;
  treatmentOptions: { heading: string; body: string }[];
  howItWorks: string;
  technologiesUsed: string;  // machine names, plain language
  whatToExpect: string;
  isThisRightForYou: string;
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  seoTitle: string;
  metaDescription: string;
  heroImage: string;
};

type Doctor = {
  slug: string;
  name: string;
  role: string;
  credentials: string;
  experienceYears: number;
  education: string[];
  milestones: { year: string; text: string }[];
  memberships: string[];
  clinicalFocus: string[];
  image: string;
};
```

In a real build, `treatment_page()` in `pages_treatment_detail.py` becomes a single
React/Next.js `<TreatmentPage>` component that maps over a `treatments.ts` array —
exactly the "one template, data-driven pages" architecture requested in Section 34.

## Remaining rollout (honest scope note)

This response builds the design system and the highest-priority pages end to end,
with real content. It does **not** attempt all ~27 remaining treatment pages, full
CMS wiring, analytics/schema/redirect implementation, or a Next.js/TypeScript
rebuild in this pass — doing those properly (crawling each legacy page for its real
copy, writing each one without inventing medical detail, and QA'ing every link)
is a multi-session project, not something to rush for the sake of a page count.

**Recommended next steps, in order:**

1. **Content pass** — fetch each remaining treatment URL from the legacy site (list
   in brief Section 42) and fill in the `Treatment` shape above; do not invent
   anything the legacy page doesn't say.
2. **Apply the template** — run each through the same `treatment_page()` pattern
   used for Acne Scar / Open Pores.
3. **Redirect map** — for any URL that changes (e.g. treatments that currently
   `404`-loop to the homepage on the legacy site, like Laser Hair Removal), create
   an explicit `OLD → NEW → 301` entry; nothing should go from a working legacy URL
   to a broken one.
4. **Rebuild in React/Next.js + Tailwind** once content is finalised, importing this
   CSS token system as the Tailwind theme, and wire the appointment form, analytics,
   and schema markup (LocalBusiness + Physician + FAQPage + BreadcrumbList).
5. **QA pass** per brief Section 61 Phase 7 (every link, every phone/WhatsApp/email
   action, every form, every breakpoint 320–1920px).

## Note on the legacy site's medical copy

The legacy pages use marketing language like "best dermatologist in Gorakhpur" and
promotional phrasing throughout. This rebuild keeps the underlying facts (machines,
credentials, contact details, hours) but rewrites the tone to be more measured and
avoids repeating unqualified superlatives, per the brief's own content-style
guidance (Sections 3 and 48).
