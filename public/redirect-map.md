# Redirect Map

## URLs that keep their exact legacy path (no redirect needed)

```
/                                        -> unchanged
/about-clinic/                           -> unchanged
/dr-r-d-mukhija/                         -> unchanged
/dr-gaurav-mukhija-2/                    -> unchanged
/acne-scar-treatment-gorakhpur/          -> unchanged
/open-pores-treatment-gorakhpur/         -> unchanged
/excessive-sweating-treatment-gorakhpur/ -> unchanged (page to be rebuilt on template)
/geriatric-dermatology/                  -> unchanged (page to be rebuilt on template)
/hair-fall-treatment-gorakhpur/          -> unchanged (page to be rebuilt on template)
/laser-pigmentation-removal-gorakhpur/   -> unchanged (page to be rebuilt on template)
/leprosy-treatment-gorakhpur/            -> unchanged (page to be rebuilt on template)
/prp-therapy-gorakhpur/                  -> unchanged (page to be rebuilt on template)
/skin-fairness-treatment-gorakhpur/      -> unchanged (page to be rebuilt on template)
/before-after/                           -> unchanged
/contact-us/                             -> unchanged
```

## New URLs added by the redesign (301 not required — nothing legacy pointed here)

```
NEW -> /treatments/            (category hub — did not exist on legacy site)
NEW -> /book-appointment/       (legacy "Book Now" links pointed to "/", i.e. the homepage —
                                  recommend redirecting old query-string booking links here if any exist
                                  in ad campaigns or GMB profile)
NEW -> /privacy-policy/
NEW -> /terms/
NEW -> /medical-disclaimer/
```

## Legacy links that were already broken on mukhijaskinclinic.com (not introduced by this redesign)

The current live site's nav menu links many treatments (Acne Surgery, Laser Hair Removal, Melasma
Treatment, Mole Removal, Psoriasis Treatment, Tattoo Removal, Vitiligo Treatment, Wrinkles Treatment,
and others) to `https://www.mukhijaskinclinic.com/` — i.e. they silently fall back to the homepage
rather than a dedicated page. These are **pre-existing gaps**, not pages this redesign is deleting.
Each should get a real URL and a genuine 301 from nowhere (since nothing worked before), for example:

```
(none, previously fell back to /) -> /laser-hair-removal-gorakhpur/
(none, previously fell back to /) -> /melasma-treatment-gorakhpur/
(none, previously fell back to /) -> /mole-removal-gorakhpur/
(none, previously fell back to /) -> /psoriasis-treatment-gorakhpur/
(none, previously fell back to /) -> /tattoo-removal-gorakhpur/
(none, previously fell back to /) -> /vitiligo-treatment-gorakhpur/
(none, previously fell back to /) -> /wrinkles-treatment-gorakhpur/
... (continue for each remaining item in the Section 42 page inventory)
```

## Action before launch

Before deploying, re-crawl `mukhijaskinclinic.com` one URL at a time (a proper crawler, not manual
fetches) to get a complete, verified list of every currently-resolving legacy URL, and diff it against
this table. Do not go live until every legacy URL in that crawl either (a) resolves unchanged, or
(b) has an explicit 301 target in this file.
