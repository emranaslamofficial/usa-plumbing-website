# Keyword Analysis & Keyword-to-Page Map

Source: `USA Plumbing Services SEO Keyword List.xlsx` (sheets: *Best Keywords*, *Keywords* — 128 rows, *Sources & Notes*).
Volumes are national US monthly estimates from third-party tools and **disagree between tools** (e.g. "plumber near me" ranges 180K–1.2M). Re-check final targets in Google Keyword Planner / Semrush / Ahrefs set to the real service area before publishing.

## 1. How keywords were selected

Every keyword was scored on: **commercial intent**, **service intent**, **local intent**, **relevance to an actual plumbing job**, **difficulty (KD)** and **CPC** (high CPC = advertisers see buyers there).

Decisions:

| Decision | Keywords affected | Why |
|---|---|---|
| **Use, page-level primary** | One per page (see map) | Highest-intent term the page can genuinely satisfy |
| **Use, secondary on the same page** | Near-synonyms ("water heater install / installations / installation services") | Same intent → same page. Separate pages would cannibalize each other |
| **Homepage only** | plumber, plumbing, local plumbing, local plumber(s) near me, plumbing services near me, residential plumber, residential plumbing repair, trusted plumber, finding a plumber, maintenance plumbing services, plumbing estimates | Broad "find a plumber" intent. The sheet maps all of these to the homepage + Google Business Profile. No separate "Residential Plumbing" page — it would compete with the homepage for the same intent |
| **"near me" handled by local signals, not pages** | *[x] near me* variants | Google answers "near me" from proximity + Google Business Profile + on-page location signals (NAP, service-area pages, LocalBusiness schema) — not from pages titled "near me". We use the phrase naturally, never stuff it |
| **City pages, only where the business operates** | plumber houston/dallas/austin, houston plumbing services, plumber las vegas/seattle/phoenix/… | The sheet lists 14 cities in 8 states; one company can't credibly serve all. Sample data uses the 3 Texas cities; add others **only** if served |
| **Blog (informational)** | how to fix a running toilet, p trap, flush water heater, expansion tank, frozen pipes, etc. | Low KD, high volume, informational. Each article links to the matching service page |
| **Deferred / not built yet** | boiler repair (27.1K), bathroom remodeling (60.5K — general-contractor intent), how often to pump septic tank, how to replace a shower cartridge, how to use a drain snake, kitchen plumbing, plumbing maintenance | Weaker fit or needs its own service line. Listed in §5 as next content |
| **Excluded** | none deleted outright | — |

## 2. Keyword categories

| # | Category | Keywords from the sheet |
|---|---|---|
| 1 | Emergency Plumbing | emergency plumber near me (90.5K), emergency plumber (27–74K), 24 hour plumber (4.4K), burst pipe repair near me (2.4K), emergency water heater repair (7.8K) |
| 2 | Drain Cleaning | drain cleaning (135K), kitchen sink clog (8.1K, KD 5), drain repairs (3.6K, KD 4), drain clog repair ($49.94 CPC), kitchen drain clog, slow draining sinks |
| 3 | Sewer & Drain | sewer repair (22.2K), sewer line clean out (13K, KD 1), plumbing cleanout (1.4K, KD 0) |
| 4 | Water Heater | water heater repair (165K), water heater installation (135K), tankless water heater installation (40.5K), tankless water heater install (33.1K, **KD 1**), water heater install (33.1K), heater repairs (14.8K), hot water heater repairs ($42.56), tank water heater installation ($50.45), gas water heater installation (KD 3), hot water repairs (**$54.19 — highest CPC**), water heater repair/installation near me, heater replacement, tankless repair |
| 5 | Leak Repair | water leak repair (4.4K), pipe leak repair (2.4K, KD 2), pipe leakage repair (KD 1), leak detection (27.1K), leak detection services, detecting plumbing leaks, leak detection experts |
| 6 | Toilet Repair | (no direct commercial term in sheet) → served by how to fix a running toilet (29K), toilet leaking at base, how to unclog a toilet |
| 7 | Faucet & Sink | faucet repairs (5.4K), dripping faucet repair (8.1K), leaky faucet repair (8.1K), kitchen faucet replacement (9.9K, KD 2), kitchen faucet installation, kitchen sink replacement, shutoff valves (12.1K) |
| 8 | Pipe Repair | burst pipe repair, plumbing frozen pipes (5.8K), frozen pipes prevention, how to thaw frozen pipes |
| 9 | Garbage Disposal | garbage disposal repair (12.1K), garbage disposal installation (18.1K), how to fix garbage disposal |
| 10 | Gas Plumbing | licensed gas plumber (KD 3, $37.66) |
| 11 | Slab Leak | slab leak repair (14.8K — high-ticket job) |
| 12 | Hydro Jetting | hydro jetting (74K) |
| 13 | Commercial Plumbing | commercial plumbing (18.1K), commercial plumber near me (2.4K), commercial plumbing service (KD 5) |
| 14 | Residential Plumbing | residential plumber (6.6K), residential plumbing repair ($53.47) → homepage |
| 15 | Local / City | plumber [city] ×13, houston plumbing services, plumber near me san francisco |
| 16 | Informational / Blog | see §4 |
| 17 | High-conversion (CPC ≥ $35 or KD ≤ 5 with buyer intent) | hot water repairs $54.19, residential plumbing repair $53.47, tank WH installation $50.45, drain clog repair $49.94, hot water heater repairs $42.56, plumber seattle $55.18, plumber las vegas $49.70 · quick wins: tankless install (KD 1), local plumbing (KD 7), kitchen faucet replacement (KD 2), pipe leak repair (KD 2), gas WH install (KD 3) |
| + | Water Treatment (extra) | water softener installation (110K), water softener repair (33.1K) |
| + | Remodel (extra) | tub to shower conversion (5.9K, KD 5), plumbing remodel, bathroom plumbing repair |

## 3. Keyword → page map (built pages)

One primary intent per URL. Secondary keywords are used naturally in headings/body — never repeated mechanically.

| URL | Page type | Primary keyword | Secondary keywords | Intent | H1 | Meta title | Internal links to |
|---|---|---|---|---|---|---|---|
| `/` | Home | local plumbing | plumber, plumbing, plumber near me, plumbing services near me, local plumber(s) near me, residential plumber, residential plumbing repair, trusted plumber | Commercial / local | Fast, Reliable Plumbing Services When You Need Them | Local Plumbing Services & Residential Plumber \| Brand | featured services, /emergency-plumbing, /service-areas, /request-service, blog |
| `/emergency-plumbing` | Landing | emergency plumber near me | emergency plumber, 24 hour plumber, burst pipe repair near me, emergency water heater repair | Transactional / urgent | Emergency Plumber — Fast Help for Urgent Plumbing Problems | Emergency Plumber Near You \| 24 Hour Plumbing Service | pipe-repair, drain-cleaning, water-heater-repair, sewer-line-repair, frozen pipes article |
| `/services` | Hub | plumbing services | — | Navigational | Plumbing Services | Plumbing Services \| Repairs, Drains, Water Heaters & More | every service |
| `/services/drain-cleaning` | Service | drain cleaning | kitchen sink clog, drain repairs, drain clog repair, kitchen drain clog, slow draining sinks | Transactional | Professional Drain Cleaning & Drain Repair | Drain Cleaning Services \| Clogged & Slow Drains Fixed | hydro-jetting, sewer, disposal, toilet; unclog / p-trap / cleanout articles |
| `/services/sewer-line-repair` | Service | sewer repair | sewer line clean out, plumbing cleanout | Transactional | Sewer Line Repair, Cleaning & Inspection | Sewer Line Repair & Cleaning \| Camera Inspection | hydro-jetting, drain, emergency; cleanout, sewage smell |
| `/services/hydro-jetting` | Service | hydro jetting | — | Commercial | Hydro Jetting for Drains & Sewer Lines | Hydro Jetting Services \| High-Pressure Drain Cleaning | drain, sewer, commercial |
| `/services/water-heater-repair` | Service | water heater repair | water heater repair near me, hot water heater repairs, heater repairs, hot water repairs, water heater repair services, tankless water heater repair | Transactional | Water Heater Repair for Tank & Tankless Units | Water Heater Repair \| Tank & Tankless Hot Water Repairs | installation, tankless, emergency; not-heating / flush / expansion-tank |
| `/services/water-heater-installation` | Service | water heater installation | water heater install(ations), tank WH installation, gas WH installation, WH installation near me / services, heater replacement | Transactional | Water Heater Installation & Replacement | Water Heater Installation & Replacement \| Gas & Electric | tankless, repair, gas-line; expansion-tank, flush |
| `/services/tankless-water-heaters` | Service | tankless water heater installation | tankless water heater install, tankless water heater repair | Transactional | Tankless Water Heater Installation | Tankless Water Heater Installation \| Tank-to-Tankless | installation, repair, softeners; tankless-benefits |
| `/services/leak-detection` | Service | leak detection | leak detection services, detecting plumbing leaks, leak detection experts | Transactional | Leak Detection Services — Find Hidden Leaks Fast | Leak Detection Services \| Find Hidden Water Leaks | pipe-repair, slab-leak, emergency; insurance, toilet-base |
| `/services/pipe-repair` | Service | pipe leak repair | water leak repair, pipe leakage repair, burst pipe repair, plumbing frozen pipes | Transactional | Pipe Repair & Water Leak Repair | Pipe Repair & Water Leak Repair \| Burst & Frozen Pipes | leak-detection, slab, emergency; frozen pipes, insurance |
| `/services/slab-leak-repair` | Service | slab leak repair | slab leak detection | Transactional | Slab Leak Detection & Repair | Slab Leak Repair \| Under-Slab Leak Detection & Reroutes | leak-detection, pipe-repair; insurance |
| `/services/toilet-repair` | Service | toilet repair | running toilet repair, toilet installation | Transactional | Toilet Repair & Installation | Toilet Repair & Installation \| Running & Leaking Toilets | drain, leak, remodel; running-toilet, unclog, toilet-base |
| `/services/faucet-sink-repair` | Service | faucet repairs | dripping/leaky faucet repair, kitchen faucet replacement/installation, kitchen sink replacement, shutoff valves | Transactional | Faucet Repair, Replacement & Sink Installation | Faucet Repair & Kitchen Faucet Replacement | disposal, drain, remodel; p-trap |
| `/services/garbage-disposal` | Service | garbage disposal repair | garbage disposal installation | Transactional | Garbage Disposal Repair & Installation | Garbage Disposal Repair & Installation | drain, faucet; fix-disposal |
| `/services/gas-line-services` | Service | licensed gas plumber | gas line installation/repair | Transactional | Gas Line Installation & Repair by Licensed Gas Plumbers | Gas Line Installation & Repair \| Licensed Gas Plumber | tankless, WH installation |
| `/services/water-softeners` | Service | water softener installation | water softener repair | Transactional | Water Softener Installation & Repair | Water Softener Installation & Repair | tankless, WH repair |
| `/services/bathroom-plumbing-remodel` | Service | tub to shower conversion | bathroom remodeling, plumbing remodel, bathroom plumbing repair | Commercial | Bathroom Plumbing for Remodels & Tub-to-Shower Conversions | Bathroom Remodel Plumbing & Tub-to-Shower Conversion | toilet, faucet, drain |
| `/services/commercial-plumbing` | Service | commercial plumbing | commercial plumber near me, commercial plumbing service | Commercial / B2B | Commercial Plumbing Services for Businesses | Commercial Plumbing Services \| Commercial Plumber | jetting, sewer, WH repair, emergency |
| `/service-areas` | Hub | plumbing service areas | — | Navigational | Serving Homeowners & Businesses Across [Area] | Service Areas \| Plumbers Serving [Area] | each location |
| `/service-areas/houston-tx` | Location | houston plumbing services | plumber houston, emergency plumber houston | Local | Plumbing Services in Houston, TX | Plumber in Houston, TX \| Plumbing Repair & Emergency Service | slab-leak, sewer, WH repair, drain |
| `/service-areas/dallas-tx` | Location | plumber dallas | dallas plumbing services | Local | Plumbing Services in Dallas, TX | Plumber in Dallas, TX \| Leak Detection, Drains & Water Heaters | leak-detection, pipe, sewer, WH install |
| `/service-areas/austin-tx` | Location | plumber austin | austin plumbing services | Local | Plumbing Services in Austin, TX | Plumber in Austin, TX \| Water Heaters, Drains & Repairs | softeners, tankless, jetting, remodel |

Exact meta descriptions live with each record (`seo.metaDescription`) in `src/lib/api/mock/data/*.ts`.

## 4. Blog map (informational → service)

| URL `/blog/…` | Primary keyword | Secondary | Vol / KD | Links to service |
|---|---|---|---|---|
| how-to-fix-a-running-toilet | how to fix a running toilet | running toilet | 29K / 3 | toilet-repair |
| p-trap-guide | p trap | p trap plumbing, bathroom sink plumbing diagram | 23K / 3 | drain-cleaning, faucet-sink-repair |
| how-to-flush-a-water-heater | flush water heater | descale tankless | 18.1K / 6 | WH repair / installation |
| sewer-line-cleanout-guide | sewer line clean out | plumbing cleanout | 13K / 1 | sewer-line-repair, hydro-jetting |
| expansion-tank-guide | expansion tank | WH expansion tank | 10K / 2 | WH installation |
| how-to-unclog-a-toilet | how to unclog a toilet with a plunger | how to unclog a toilet fast | 6.4K / 1 | toilet-repair, drain-cleaning |
| how-to-prevent-and-thaw-frozen-pipes | frozen pipes prevention | how to thaw frozen pipes, plumbing frozen pipes | 4.4K + 1.1K | pipe-repair, emergency |
| toilet-leaking-at-base | toilet leaking at base | — | 3.8K / 0 | toilet-repair |
| water-heater-not-heating | water heater not heating | hot water heater not working | 2.3K + 3.4K / 1 | WH repair |
| how-to-fix-a-garbage-disposal | how to fix garbage disposal | — | 3.3K / 1 | garbage-disposal |
| tankless-water-heater-benefits | tankless water heater benefits | tankless water heater lifespan | 1.9K + 1.6K | tankless |
| sewage-smell-in-house | sewage smell in house | — | 1.7K / 0 | sewer, drain |
| does-homeowners-insurance-cover-plumbing | does homeowners insurance cover plumbing | — | 1.7K / 7 | leak-detection, slab-leak |

**Cannibalization notes**
- *flush water heater* is mapped to "Water Heater service page" in the sheet. We put it in a **blog article** instead because the intent is DIY/how-to; the service page targets repair (transactional). They link to each other.
- *water heater not heating / hot water heater not working* → article (troubleshooting), not the repair page.
- *sewer line clean out / plumbing cleanout* appear on both the sewer service page (as features) and an article. The **article** owns the informational query; the service page owns *sewer repair*.
- Leak **detection** (finding) and pipe/leak **repair** (fixing) are separate intents with separate pages; slab leak is its own high-ticket page.

## 5. Next content (prioritized, not yet built)

1. `/services/boiler-repair` — boiler repair (27.1K) if the business services boilers.
2. Seasonal: *plumbing maintenance checklist* (3.1K), *how to use a drain snake* (2.3K), *how often to pump septic tank* (2.3K — only if septic is serviced), *how to replace a shower cartridge* (700), *kitchen plumbing* (3.2K).
3. City pages for each additional real service area — each needs unique local content (see `Location.localConsiderations`).
4. Optional service-in-city pages (e.g. `/service-areas/houston-tx/water-heater-repair`) **only** for high-value combos and only with unique content; otherwise they become thin doorway pages.

## 6. Where keywords live in code

- Services → `seo` object on each record in `src/lib/api/mock/data/services.ts`
- Locations → `src/lib/api/mock/data/locations.ts`
- Articles → `src/lib/api/mock/data/blog.ts`
- In Phase 2 the same `SeoFields` shape is stored per record in the database and edited in the admin panel (see `docs/BACKEND-API.md`).
