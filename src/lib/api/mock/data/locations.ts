import type { Location } from "@/types";

/**
 * SAMPLE service areas. Replace with the areas the business actually serves.
 * Each location MUST have unique, genuinely local content (intro + local considerations)
 * so location pages are useful to visitors and not thin "doorway" pages.
 * Managed in the admin panel in Phase 2 (GET /api/v1/locations).
 */
export const locations: Location[] = [
  {
    id: "loc_houston",
    slug: "houston-tx",
    city: "Houston",
    stateCode: "TX",
    stateName: "Texas",
    intro: [
      "Houston homes deal with a combination of shifting clay soil, heavy rain and long stretches of heat — all of which affect plumbing. Slab foundations are common, which means water and sewer lines often run under concrete.",
      "We provide plumbing repair, drain and sewer service, water heater work and emergency plumbing for homeowners and businesses across the Houston area.",
    ],
    localConsiderations: [
      {
        title: "Slab leaks and soil movement",
        description:
          "Expansive clay soil swells when wet and shrinks during droughts. That movement stresses under-slab water and sewer lines, so warm floors or an unexplained high water bill are worth checking quickly.",
      },
      {
        title: "Heavy rain and sewer backups",
        description:
          "Intense storms can overwhelm sewer systems. A backwater valve and a clear main line reduce the risk of sewage backing up into the home.",
      },
      {
        title: "Occasional hard freezes",
        description:
          "Freezes are infrequent but can be severe. Insulating exposed pipes and knowing where your main shut-off is can prevent major damage.",
      },
    ],
    nearbyAreas: ["Sugar Land", "Katy", "Pearland", "The Woodlands", "Pasadena", "Cypress"],
    zipCodes: [],
    featuredServiceSlugs: ["slab-leak-repair", "sewer-line-repair", "water-heater-repair", "drain-cleaning"],
    faqs: [
      {
        question: "Are slab leaks common in Houston?",
        answer:
          "Slab foundations and expansive clay soil make slab leaks a common concern in the Houston area. Early detection keeps repairs smaller.",
      },
      {
        question: "Do you provide emergency plumbing in Houston?",
        answer: "Yes — call us any time for burst pipes, sewer backups and other urgent plumbing problems.",
      },
    ],
    geo: { lat: 29.7604, lng: -95.3698 },
    isActive: true,
    sortOrder: 1,
    seo: {
      metaTitle: "Plumber in Houston, TX | Plumbing Repair & Emergency Service",
      metaDescription:
        "Licensed plumbers serving Houston, TX: slab leaks, drain and sewer service, water heaters and emergency plumbing. Call now or request service.",
      primaryKeyword: "houston plumbing services",
      secondaryKeywords: ["plumber houston", "emergency plumber houston"],
    },
  },
  {
    id: "loc_dallas",
    slug: "dallas-tx",
    city: "Dallas",
    stateCode: "TX",
    stateName: "Texas",
    intro: [
      "Many Dallas-area homes sit on expansive clay soil and slab foundations, and the region sees both summer heat and the occasional hard freeze. That mix puts real stress on water lines, sewer lines and water heaters.",
      "We help Dallas homeowners and businesses with plumbing repairs, leak detection, drain cleaning, water heater service and emergency calls.",
    ],
    localConsiderations: [
      {
        title: "Foundation movement and leaks",
        description:
          "Clay soil movement can crack or separate under-slab pipes. Leak detection pinpoints the problem before deciding between a spot repair and a reroute.",
      },
      {
        title: "Winter freeze preparation",
        description:
          "Exposed pipes in attics, garages and exterior walls are most vulnerable. Insulation and dripping faucets during hard freezes help prevent bursts.",
      },
      {
        title: "Aging sewer lines",
        description:
          "Older neighborhoods may still have clay or cast-iron sewer lines, which are more prone to roots and cracking. A camera inspection shows their condition.",
      },
    ],
    nearbyAreas: ["Richardson", "Garland", "Irving", "Plano", "Mesquite", "Carrollton"],
    zipCodes: [],
    featuredServiceSlugs: ["leak-detection", "pipe-repair", "sewer-line-repair", "water-heater-installation"],
    faqs: [
      {
        question: "How do I prepare my Dallas home's plumbing for a freeze?",
        answer:
          "Insulate exposed pipes, disconnect garden hoses, open cabinet doors on exterior walls and let faucets drip during hard freezes. Read our frozen pipes guide for more.",
      },
    ],
    geo: { lat: 32.7767, lng: -96.797 },
    isActive: true,
    sortOrder: 2,
    seo: {
      metaTitle: "Plumber in Dallas, TX | Leak Detection, Drains & Water Heaters",
      metaDescription:
        "Plumbing services in Dallas, TX: leak detection, pipe repair, sewer service, water heaters and emergency plumbing. Call now.",
      primaryKeyword: "plumber dallas",
      secondaryKeywords: ["dallas plumbing services", "emergency plumber dallas"],
    },
  },
  {
    id: "loc_austin",
    slug: "austin-tx",
    city: "Austin",
    stateCode: "TX",
    stateName: "Texas",
    intro: [
      "Austin-area water is hard, which means mineral scale builds up in water heaters, tankless units and fixtures over time. Mature trees in established neighborhoods also send roots looking for sewer lines.",
      "We provide water heater service, water softener installation, drain and sewer cleaning, and general plumbing repair for Austin homes and businesses.",
    ],
    localConsiderations: [
      {
        title: "Hard water and scale",
        description:
          "Scale reduces water heater efficiency and clogs tankless heat exchangers. Annual flushing or descaling, and a water softener, help equipment last longer.",
      },
      {
        title: "Tree roots in sewer lines",
        description:
          "Roots enter through small joint gaps in older sewer pipe. Recurring slow drains are often the first sign — a camera inspection confirms it.",
      },
      {
        title: "Growth and remodeling",
        description:
          "Remodels and additions often require relocating fixtures or upsizing gas lines for tankless water heaters and outdoor kitchens.",
      },
    ],
    nearbyAreas: ["Round Rock", "Cedar Park", "Pflugerville", "Georgetown", "Leander", "Bee Cave"],
    zipCodes: [],
    featuredServiceSlugs: ["water-softeners", "tankless-water-heaters", "hydro-jetting", "bathroom-plumbing-remodel"],
    faqs: [
      {
        question: "Should I install a water softener in Austin?",
        answer:
          "With hard water, a softener can reduce scale in pipes, fixtures and water heaters. We can test your water and recommend a properly sized system.",
      },
    ],
    geo: { lat: 30.2672, lng: -97.7431 },
    isActive: true,
    sortOrder: 3,
    seo: {
      metaTitle: "Plumber in Austin, TX | Water Heaters, Drains & Repairs",
      metaDescription:
        "Plumbing services in Austin, TX: water heaters, tankless and water softeners, drain and sewer cleaning, repairs and emergency service.",
      primaryKeyword: "plumber austin",
      secondaryKeywords: ["austin plumbing services", "emergency plumber austin"],
    },
  },
];
