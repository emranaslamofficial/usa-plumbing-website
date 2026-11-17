import type { Service } from "@/types";

/**
 * Mock service catalogue. Each service targets ONE search intent (see docs/KEYWORD-MAP.md)
 * to prevent keyword cannibalization. In Phase 2 these records come from the backend
 * (GET /api/v1/services) and are edited in the admin panel.
 */
export const services: Service[] = [
  {
    id: "svc_emergency",
    slug: "emergency-plumbing",
    path: "/emergency-plumbing",
    name: "Emergency Plumbing",
    category: "emergency",
    icon: "siren",
    shortDescription:
      "Burst pipes, overflowing toilets, sewage backups and no hot water — call for priority dispatch.",
    h1: "Emergency Plumber — Fast Help for Urgent Plumbing Problems",
    intro: [
      "Some plumbing problems can't wait for a convenient appointment. A burst pipe can release hundreds of gallons of water in an hour, and a sewer backup creates a health hazard the moment it starts.",
      "When you call, a real person helps you shut off water or gas if needed, then we dispatch a licensed plumber with the parts and tools to stop the damage and make a lasting repair.",
    ],
    signsTitle: "Call an emergency plumber right away if you have",
    signs: [
      "A burst or actively leaking pipe",
      "Sewage backing up into tubs, showers or floor drains",
      "An overflowing toilet that won't stop",
      "No water to the house, or no hot water in winter",
      "Water pooling near the water heater",
      "The smell of gas near a gas appliance or water heater (leave the home and call your gas utility first)",
    ],
    featuresTitle: "Emergency plumbing services",
    features: [
      { title: "Burst & frozen pipes", description: "Stop the leak, repair or replace the damaged section and check for hidden damage." },
      { title: "Sewer & drain backups", description: "Clear main-line blockages and identify why the backup happened." },
      { title: "Water heater failures", description: "Leaking tanks, no hot water and failed tankless units." },
      { title: "Overflowing toilets", description: "Clear the blockage and repair fill valves, flappers and wax seals." },
    ],
    faqs: [
      {
        question: "What should I do while I wait for an emergency plumber?",
        answer:
          "Turn off the main water shut-off valve (usually where the water line enters the home or near the meter), switch off power to the water heater if it's leaking, move valuables away from the water, and take photos for insurance.",
      },
      {
        question: "Do you charge more for after-hours emergency calls?",
        answer:
          "After-hours and holiday visits may carry a different rate. We explain all pricing on the phone and confirm it in writing before any work begins.",
      },
      {
        question: "Is a slow leak an emergency?",
        answer:
          "Not always, but a slow leak behind a wall or under a floor can cause rot and mold. If you see staining, swelling or hear running water when fixtures are off, call to schedule a prompt repair.",
      },
    ],
    relatedServiceSlugs: ["pipe-repair", "drain-cleaning", "water-heater-repair", "sewer-line-repair"],
    relatedPostSlugs: ["how-to-prevent-and-thaw-frozen-pipes", "how-to-unclog-a-toilet"],
    isFeatured: true,
    isEmergency: true,
    sortOrder: 1,
    seo: {
      metaTitle: "Emergency Plumber Near You | 24 Hour Plumbing Service",
      metaDescription:
        "Burst pipe, sewer backup or overflowing toilet? Call our emergency plumbers for fast, professional help. Licensed plumbers, clear pricing.",
      primaryKeyword: "emergency plumber near me",
      secondaryKeywords: ["emergency plumber", "24 hour plumber", "burst pipe repair near me", "emergency water heater repair"],
    },
  },
  {
    id: "svc_drain",
    slug: "drain-cleaning",
    name: "Drain Cleaning",
    category: "drains-sewer",
    icon: "drain",
    shortDescription: "Kitchen sink clogs, slow drains and recurring backups cleared and diagnosed properly.",
    h1: "Professional Drain Cleaning & Drain Repair",
    intro: [
      "Store-bought drain chemicals can damage older pipes and rarely remove the actual blockage. Professional drain cleaning removes grease, hair, soap scum and debris from the full length of the line — not just the first few feet.",
      "For drains that clog again and again, we can run a camera inspection to see whether the cause is buildup, a sagging pipe, roots or a damaged section that needs repair.",
    ],
    signsTitle: "Signs you need drain cleaning",
    signs: [
      "Kitchen sink clogs or water backing up into the second basin",
      "Slow-draining sinks, tubs or showers",
      "Gurgling sounds from drains or toilets",
      "Bad odors coming from drains",
      "More than one fixture backing up at the same time",
    ],
    featuresTitle: "What our drain service covers",
    features: [
      { title: "Kitchen drain clogs", description: "Grease and food buildup removed from sink, disposal and branch lines." },
      { title: "Bathroom drains", description: "Hair and soap clogs in sinks, tubs and showers cleared without damaging fixtures." },
      { title: "Camera inspection", description: "See inside the pipe to find the real cause of recurring clogs." },
      { title: "Drain repairs", description: "Repair of cracked, separated or sagging drain lines when cleaning isn't enough." },
    ],
    faqs: [
      {
        question: "Are chemical drain cleaners safe for my pipes?",
        answer:
          "Caustic drain cleaners generate heat and can soften PVC joints or corrode older metal pipes. They also make the job hazardous for the plumber if the clog doesn't clear. Mechanical cleaning is safer.",
      },
      {
        question: "Why does my kitchen sink keep clogging?",
        answer:
          "The usual cause is grease that hardens inside the pipe and traps food particles. If the clog keeps returning, the line may need hydro jetting or have a slope problem.",
      },
      {
        question: "How often should drains be professionally cleaned?",
        answer:
          "Most homes only need service when a problem appears. Homes with frequent clogs, large households and restaurants benefit from scheduled maintenance.",
      },
    ],
    relatedServiceSlugs: ["hydro-jetting", "sewer-line-repair", "garbage-disposal", "toilet-repair"],
    relatedPostSlugs: ["how-to-unclog-a-toilet", "p-trap-guide", "sewer-line-cleanout-guide"],
    isFeatured: true,
    sortOrder: 2,
    seo: {
      metaTitle: "Drain Cleaning Services | Clogged & Slow Drains Fixed",
      metaDescription:
        "Professional drain cleaning for kitchen sink clogs, slow drains and recurring backups. Camera inspection and drain repair available. Call now.",
      primaryKeyword: "drain cleaning",
      secondaryKeywords: ["kitchen sink clog", "drain repairs", "drain clog repair", "kitchen drain clog", "slow draining sinks"],
    },
  },
  {
    id: "svc_sewer",
    slug: "sewer-line-repair",
    name: "Sewer Line Repair",
    category: "drains-sewer",
    icon: "sewer",
    shortDescription: "Main line backups, root intrusion and broken sewer pipes diagnosed with camera inspection.",
    h1: "Sewer Line Repair, Cleaning & Inspection",
    intro: [
      "Your main sewer line carries every drop of wastewater out of the home. When it clogs, cracks or fills with tree roots, problems show up everywhere at once — usually at the lowest drain in the house.",
      "We locate the problem with a sewer camera, clear the line through the cleanout, and explain your repair options before any digging begins.",
    ],
    signsTitle: "Signs of a sewer line problem",
    signs: [
      "Multiple drains backing up at once",
      "Water coming up from a floor drain or shower when the toilet is flushed",
      "Sewage smell inside or outside the home",
      "Unusually green or soggy patches in the yard",
      "Recurring clogs that come back weeks after cleaning",
    ],
    featuresTitle: "Sewer services",
    features: [
      { title: "Main line cleaning", description: "Blockages cleared through the sewer cleanout with cable machines or water jetting." },
      { title: "Sewer camera inspection", description: "Recorded video locating roots, cracks, bellies and offsets." },
      { title: "Cleanout installation", description: "Install an accessible plumbing cleanout for faster, cheaper future service." },
      { title: "Sewer pipe repair & replacement", description: "Spot repairs or full line replacement, including trenchless options where suitable." },
    ],
    faqs: [
      {
        question: "Where is my sewer cleanout?",
        answer:
          "It's usually a capped pipe a few inches above ground near the foundation, in the yard along the path of the sewer line, or in a basement or garage. Some older homes don't have one.",
      },
      {
        question: "Can tree roots really break a sewer line?",
        answer:
          "Roots seek out moisture and enter through tiny joint gaps, then grow and expand. Over time they block the line and can crack or separate the pipe.",
      },
      {
        question: "Is trenchless sewer repair always possible?",
        answer:
          "Not always. It depends on the pipe's condition, material, access and local code. A camera inspection tells us which options apply.",
      },
    ],
    relatedServiceSlugs: ["hydro-jetting", "drain-cleaning", "emergency-plumbing"],
    relatedPostSlugs: ["sewer-line-cleanout-guide", "sewage-smell-in-house"],
    isFeatured: true,
    sortOrder: 3,
    seo: {
      metaTitle: "Sewer Line Repair & Cleaning | Camera Inspection",
      metaDescription:
        "Sewer backups, root intrusion or a broken main line? We inspect with a camera, clear the line and repair or replace damaged sewer pipe.",
      primaryKeyword: "sewer repair",
      secondaryKeywords: ["sewer line clean out", "plumbing cleanout", "sewer line repair"],
    },
  },
  {
    id: "svc_jetting",
    slug: "hydro-jetting",
    name: "Hydro Jetting",
    category: "drains-sewer",
    icon: "jet",
    shortDescription: "High-pressure water jetting that scours grease, scale and roots from drain and sewer lines.",
    h1: "Hydro Jetting for Drains & Sewer Lines",
    intro: [
      "A drain snake punches a hole through a clog. Hydro jetting cleans the entire inside diameter of the pipe with high-pressure water, removing the grease, scale and sludge that cause clogs to come back.",
      "Because jetting is powerful, we inspect the line with a camera first to make sure the pipe is in good enough condition to be jetted safely.",
    ],
    signsTitle: "Hydro jetting is a good fit when",
    signs: [
      "Drains clog again shortly after being snaked",
      "Grease buildup in kitchen or restaurant lines",
      "Light root intrusion in the sewer line",
      "Scale buildup in older cast iron pipes",
      "Preventive maintenance for commercial kitchens",
    ],
    featuresTitle: "Our hydro jetting process",
    features: [
      { title: "Camera inspection first", description: "We confirm the pipe can handle jetting and locate the problem area." },
      { title: "Full-diameter cleaning", description: "Rotating nozzles scour the pipe walls, not just the center of the clog." },
      { title: "Post-cleaning verification", description: "A second camera pass confirms the line is clear." },
      { title: "Maintenance scheduling", description: "Recurring jetting plans for restaurants and multi-unit buildings." },
    ],
    faqs: [
      {
        question: "Is hydro jetting safe for old pipes?",
        answer:
          "Jetting is safe for pipes in sound condition. Badly deteriorated or broken pipes may need repair first, which is why we inspect before jetting.",
      },
      {
        question: "How is hydro jetting different from snaking?",
        answer:
          "Snaking opens a path through a clog. Jetting removes buildup from the entire pipe wall, so it generally lasts longer on grease and scale problems.",
      },
    ],
    relatedServiceSlugs: ["drain-cleaning", "sewer-line-repair", "commercial-plumbing"],
    relatedPostSlugs: ["sewer-line-cleanout-guide"],
    isFeatured: true,
    sortOrder: 4,
    seo: {
      metaTitle: "Hydro Jetting Services | High-Pressure Drain Cleaning",
      metaDescription:
        "Hydro jetting removes grease, scale and roots from drain and sewer lines. Camera-verified results for homes and commercial kitchens.",
      primaryKeyword: "hydro jetting",
      secondaryKeywords: ["hydro jetting drain cleaning", "sewer jetting"],
    },
  },
  {
    id: "svc_wh_repair",
    slug: "water-heater-repair",
    name: "Water Heater Repair",
    category: "water-heaters",
    icon: "heater",
    shortDescription: "No hot water, leaks, strange noises or rusty water — tank and tankless repairs.",
    h1: "Water Heater Repair for Tank & Tankless Units",
    intro: [
      "When the hot water stops, everything in the house slows down. Many water heater problems — a failed heating element, thermocouple, gas valve or igniter — can be repaired the same day.",
      "We diagnose gas and electric tank heaters and tankless units, explain whether repair or replacement makes more financial sense, and give you the price before we start.",
    ],
    signsTitle: "Common reasons to call for water heater repair",
    signs: [
      "No hot water, or hot water that runs out quickly",
      "Water that is lukewarm or too hot",
      "Rumbling, popping or banging noises from the tank",
      "Rusty or discolored hot water",
      "Water leaking from the tank, valves or connections",
      "Pilot light that won't stay lit, or error codes on a tankless unit",
    ],
    featuresTitle: "Water heater repairs we handle",
    features: [
      { title: "Gas water heaters", description: "Thermocouples, gas valves, burners, venting and pilot assemblies." },
      { title: "Electric water heaters", description: "Heating elements, thermostats and wiring connections." },
      { title: "Tankless water heaters", description: "Error codes, scale buildup, igniters, flow sensors and descaling." },
      { title: "Valves & leaks", description: "Temperature/pressure relief valves, drain valves and supply connections." },
    ],
    faqs: [
      {
        question: "Should I repair or replace my water heater?",
        answer:
          "Tank water heaters typically last around 8–12 years. If yours is near that age and the tank itself is leaking, replacement is usually the better value. Component failures on younger units are often worth repairing.",
      },
      {
        question: "Why is my water heater not heating?",
        answer:
          "On electric units the cause is usually a failed element or thermostat; on gas units it's often the pilot, thermocouple or gas valve. A tripped breaker or a closed gas valve is worth checking first.",
      },
      {
        question: "Is a leaking water heater an emergency?",
        answer:
          "A leak from the tank body usually means the tank has failed. Shut off the water supply and the power or gas to the heater and call us right away.",
      },
    ],
    relatedServiceSlugs: ["water-heater-installation", "tankless-water-heaters", "emergency-plumbing"],
    relatedPostSlugs: ["water-heater-not-heating", "how-to-flush-a-water-heater", "expansion-tank-guide"],
    isFeatured: true,
    sortOrder: 5,
    seo: {
      metaTitle: "Water Heater Repair | Tank & Tankless Hot Water Repairs",
      metaDescription:
        "No hot water? Leaking tank? Our plumbers repair gas, electric and tankless water heaters. Clear pricing before work starts. Call now.",
      primaryKeyword: "water heater repair",
      secondaryKeywords: [
        "water heater repair near me",
        "hot water heater repairs",
        "heater repairs",
        "hot water repairs",
        "water heater repair services",
        "tankless water heater repair",
      ],
    },
  },
  {
    id: "svc_wh_install",
    slug: "water-heater-installation",
    name: "Water Heater Installation",
    category: "water-heaters",
    icon: "flame",
    shortDescription: "Tank water heater replacement and installation — gas or electric, sized for your home.",
    h1: "Water Heater Installation & Replacement",
    intro: [
      "A properly installed water heater is safer, more efficient and lasts longer. We help you choose the right fuel type and capacity for your household, then install it to code — including venting, gas connections, expansion tank and relief valve piping.",
      "We remove and haul away the old unit and walk you through the new heater's settings before we leave.",
    ],
    signsTitle: "It may be time to replace your water heater if",
    signs: [
      "The tank is leaking from the body or bottom",
      "The unit is more than about 10 years old and needs repeated repairs",
      "You routinely run out of hot water",
      "There's rust or corrosion on the tank or fittings",
      "Energy bills have climbed without explanation",
    ],
    featuresTitle: "Installation options",
    features: [
      { title: "Gas water heater installation", description: "Natural gas and propane tank heaters with correct venting and gas connections." },
      { title: "Electric tank installation", description: "Standard and high-efficiency electric models, including heat pump water heaters." },
      { title: "Code-compliant upgrades", description: "Expansion tanks, seismic straps, drain pans and relief valve lines where required." },
      { title: "Permits & haul-away", description: "Permits pulled where required and the old unit removed." },
    ],
    faqs: [
      {
        question: "How long does water heater installation take?",
        answer:
          "A like-for-like tank replacement typically takes a few hours. Switching fuel types, relocating the unit or converting to tankless takes longer.",
      },
      {
        question: "What size water heater do I need?",
        answer:
          "It depends on household size and peak hot water use. Many families of three to four use a 40–50 gallon tank. We size it based on your actual usage.",
      },
      {
        question: "Do I need a permit to replace a water heater?",
        answer: "Many jurisdictions require a permit for water heater replacement. We'll tell you what applies at your address.",
      },
    ],
    relatedServiceSlugs: ["tankless-water-heaters", "water-heater-repair", "gas-line-services"],
    relatedPostSlugs: ["expansion-tank-guide", "how-to-flush-a-water-heater"],
    isFeatured: true,
    sortOrder: 6,
    seo: {
      metaTitle: "Water Heater Installation & Replacement | Gas & Electric",
      metaDescription:
        "Professional water heater installation for gas and electric tank units. Correct sizing, code-compliant install and old unit removal.",
      primaryKeyword: "water heater installation",
      secondaryKeywords: [
        "water heater install",
        "water heater installations",
        "tank water heater installation",
        "gas water heater installation",
        "water heater installation near me",
        "water heater installation services",
        "heater replacement",
      ],
    },
  },
  {
    id: "svc_tankless",
    slug: "tankless-water-heaters",
    name: "Tankless Water Heaters",
    category: "water-heaters",
    icon: "tankless",
    shortDescription: "Tankless water heater installation, conversion from tank units, and descaling service.",
    h1: "Tankless Water Heater Installation",
    intro: [
      "Tankless water heaters heat water on demand, so you don't pay to keep a tank hot around the clock and you don't run out of hot water after back-to-back showers.",
      "Converting from a tank usually requires a larger gas line, new venting and sometimes electrical work. We assess all of it up front so there are no surprises.",
    ],
    signsTitle: "A tankless water heater may be right for you if",
    signs: [
      "Your household regularly runs out of hot water",
      "You want to free up floor space in a closet or garage",
      "Your tank water heater is nearing the end of its life",
      "You plan to stay in your home long enough to benefit from efficiency savings",
    ],
    featuresTitle: "Tankless services",
    features: [
      { title: "Tank-to-tankless conversion", description: "Gas line sizing, venting and condensate drainage handled correctly." },
      { title: "New tankless installation", description: "Whole-home and point-of-use units for new construction and remodels." },
      { title: "Descaling & maintenance", description: "Annual flushing to remove scale — especially important with hard water." },
      { title: "Tankless repair", description: "Error code diagnosis, igniter, flame sensor and flow sensor repairs." },
    ],
    faqs: [
      {
        question: "How long do tankless water heaters last?",
        answer:
          "With regular descaling, many tankless units last around 20 years — roughly twice as long as a typical tank heater.",
      },
      {
        question: "Will a tankless water heater work with my gas line?",
        answer:
          "Gas tankless units need a high gas input, so many homes need a larger gas line from the meter. We check this during the estimate.",
      },
    ],
    relatedServiceSlugs: ["water-heater-installation", "water-heater-repair", "water-softeners"],
    relatedPostSlugs: ["tankless-water-heater-benefits", "how-to-flush-a-water-heater"],
    isFeatured: false,
    sortOrder: 7,
    seo: {
      metaTitle: "Tankless Water Heater Installation | Tank-to-Tankless",
      metaDescription:
        "Endless hot water with a professionally installed tankless water heater. Gas line sizing, venting and descaling service included.",
      primaryKeyword: "tankless water heater installation",
      secondaryKeywords: ["tankless water heater install", "tankless water heater repair"],
    },
  },
  {
    id: "svc_leak_detect",
    slug: "leak-detection",
    name: "Leak Detection",
    category: "leaks-pipes",
    icon: "search",
    shortDescription: "Non-invasive leak detection to find hidden leaks in walls, floors, ceilings and yards.",
    h1: "Leak Detection Services — Find Hidden Leaks Fast",
    intro: [
      "Hidden leaks waste water and quietly damage drywall, flooring and framing. Professional leak detection pinpoints the source so the repair is small and targeted instead of opening walls at random.",
      "Depending on the situation we use acoustic listening equipment, thermal imaging, pressure testing and moisture meters.",
    ],
    signsTitle: "Signs you may have a hidden leak",
    signs: [
      "Water bill higher than usual with no change in use",
      "The water meter moves when every fixture is off",
      "Sound of running water when nothing is on",
      "Damp spots, stains or bubbling paint on walls or ceilings",
      "Musty odors or mold growth",
      "Warm spots on the floor (possible hot water slab leak)",
    ],
    featuresTitle: "Leak detection services",
    features: [
      { title: "Electronic leak detection", description: "Acoustic equipment that hears water escaping under pressure." },
      { title: "Thermal imaging", description: "Locate hot water leaks and moisture behind finished surfaces." },
      { title: "Pressure testing", description: "Isolate which line or zone is losing water." },
      { title: "Documentation", description: "Photos and findings you can share with your insurance company." },
    ],
    faqs: [
      {
        question: "How can I check for a leak myself?",
        answer:
          "Turn off every faucet and water-using appliance, then watch the water meter for 15–30 minutes. If the meter or leak indicator moves, water is leaving the system somewhere.",
      },
      {
        question: "Will you need to cut into my walls?",
        answer:
          "Leak detection is designed to minimize openings. Once we pinpoint the source, any access opening is as small as practical.",
      },
    ],
    relatedServiceSlugs: ["pipe-repair", "slab-leak-repair", "emergency-plumbing"],
    relatedPostSlugs: ["does-homeowners-insurance-cover-plumbing", "toilet-leaking-at-base"],
    isFeatured: true,
    sortOrder: 8,
    seo: {
      metaTitle: "Leak Detection Services | Find Hidden Water Leaks",
      metaDescription:
        "Non-invasive leak detection with acoustic and thermal equipment. Find hidden leaks in walls, floors and slabs before they cause damage.",
      primaryKeyword: "leak detection",
      secondaryKeywords: ["leak detection services", "detecting plumbing leaks", "leak detection experts"],
    },
  },
  {
    id: "svc_pipe",
    slug: "pipe-repair",
    name: "Pipe & Leak Repair",
    category: "leaks-pipes",
    icon: "pipe",
    shortDescription: "Burst, leaking, frozen and corroded pipes repaired — plus repiping when repairs stop making sense.",
    h1: "Pipe Repair & Water Leak Repair",
    intro: [
      "A leaking pipe rarely fixes itself. We repair pinhole leaks, failed fittings, burst and frozen pipes, and corroded sections in copper, galvanized, PEX, CPVC and PVC systems.",
      "If your home has aging galvanized or polybutylene pipe with repeated leaks, we'll explain repiping options so you can stop paying for repairs one leak at a time.",
    ],
    signsTitle: "Call for pipe repair if you notice",
    signs: [
      "Visible drips or spraying water from a pipe or fitting",
      "Low water pressure throughout the house",
      "Green or white crust on copper fittings",
      "Discolored water from older galvanized pipes",
      "Pipes that froze — even if they haven't leaked yet",
    ],
    featuresTitle: "Pipe repair services",
    features: [
      { title: "Burst pipe repair", description: "Emergency repair and replacement of split or burst sections." },
      { title: "Pipe leak repair", description: "Pinhole leaks, failed joints and leaking fittings fixed properly — not just clamped." },
      { title: "Frozen pipes", description: "Safe thawing, damage inspection and insulation of vulnerable lines." },
      { title: "Repiping", description: "Whole-home or partial repiping with PEX or copper." },
    ],
    faqs: [
      {
        question: "Can I use a pipe clamp as a permanent fix?",
        answer:
          "Repair clamps are a short-term fix to limit damage until a plumber can cut out the damaged section and make a proper joint.",
      },
      {
        question: "What causes pinhole leaks in copper pipes?",
        answer:
          "Common causes include water chemistry, high water velocity and age. Repeated pinhole leaks are a sign the system may need repiping.",
      },
    ],
    relatedServiceSlugs: ["leak-detection", "slab-leak-repair", "emergency-plumbing"],
    relatedPostSlugs: ["how-to-prevent-and-thaw-frozen-pipes", "does-homeowners-insurance-cover-plumbing"],
    isFeatured: true,
    sortOrder: 9,
    seo: {
      metaTitle: "Pipe Repair & Water Leak Repair | Burst & Frozen Pipes",
      metaDescription:
        "Leaking, burst or frozen pipes repaired by licensed plumbers. Pinhole leaks, failed fittings and repiping for copper, PEX and galvanized.",
      primaryKeyword: "pipe leak repair",
      secondaryKeywords: ["water leak repair", "pipe leakage repair", "burst pipe repair", "plumbing frozen pipes"],
    },
  },
  {
    id: "svc_slab",
    slug: "slab-leak-repair",
    name: "Slab Leak Repair",
    category: "leaks-pipes",
    icon: "slab",
    shortDescription: "Locate and repair leaks under concrete slab foundations with minimal disruption.",
    h1: "Slab Leak Detection & Repair",
    intro: [
      "A slab leak is a leak in a water line running beneath a concrete foundation. Left alone, it can waste thousands of gallons, damage flooring and, over time, affect the soil under the foundation.",
      "We locate the leak precisely and recommend the least disruptive fix — a spot repair through the slab, rerouting the line through walls or attic, or a full repipe.",
    ],
    signsTitle: "Common slab leak warning signs",
    signs: [
      "Warm or hot spots on the floor",
      "Sound of running water under the floor",
      "Unexplained spike in the water bill",
      "Damp carpet or warped wood flooring",
      "Cracks appearing in walls or flooring",
    ],
    featuresTitle: "Slab leak repair options",
    features: [
      { title: "Precise leak location", description: "Acoustic and thermal tools pinpoint the leak before any concrete is opened." },
      { title: "Direct spot repair", description: "Open the slab only where needed and repair the damaged line." },
      { title: "Line reroute", description: "Abandon the failing under-slab line and run a new line above ground." },
      { title: "Repiping", description: "Recommended when multiple slab leaks point to a system-wide problem." },
    ],
    faqs: [
      {
        question: "Does homeowners insurance cover slab leaks?",
        answer:
          "Many policies cover the cost to access the leak and repair resulting water damage, but not always the pipe itself. Check your policy and keep our documentation for the claim.",
      },
      {
        question: "Is rerouting better than breaking the slab?",
        answer:
          "Rerouting is often less disruptive and avoids future leaks in the same old line, but the right choice depends on the leak location and pipe condition.",
      },
    ],
    relatedServiceSlugs: ["leak-detection", "pipe-repair"],
    relatedPostSlugs: ["does-homeowners-insurance-cover-plumbing"],
    isFeatured: false,
    sortOrder: 10,
    seo: {
      metaTitle: "Slab Leak Repair | Under-Slab Leak Detection & Reroutes",
      metaDescription:
        "Warm floors or a sudden high water bill? We locate slab leaks precisely and repair them with spot repairs, reroutes or repiping.",
      primaryKeyword: "slab leak repair",
      secondaryKeywords: ["slab leak detection", "under slab leak"],
    },
  },
  {
    id: "svc_toilet",
    slug: "toilet-repair",
    name: "Toilet Repair",
    category: "fixtures",
    icon: "toilet",
    shortDescription: "Running, clogged, leaking and wobbling toilets repaired — or replaced and installed.",
    h1: "Toilet Repair & Installation",
    intro: [
      "A running toilet can waste a significant amount of water every day, and a leak at the base can rot the subfloor before you notice. Most toilet problems are quick to fix once diagnosed.",
      "We repair fill valves, flappers, flush valves and wax seals, clear stubborn clogs, and install new toilets when replacement is the better option.",
    ],
    signsTitle: "Common toilet problems we fix",
    signs: [
      "Toilet that runs constantly or refills on its own",
      "Water leaking around the base",
      "Weak or incomplete flushes",
      "Frequent clogs",
      "Toilet that rocks or wobbles",
    ],
    featuresTitle: "Toilet services",
    features: [
      { title: "Running toilet repair", description: "Fill valves, flappers and flush valves replaced and adjusted." },
      { title: "Leak repair", description: "Wax ring and flange repair to stop leaks at the base." },
      { title: "Clog removal", description: "Toilet augers and line clearing for blockages a plunger can't reach." },
      { title: "Toilet installation", description: "New water-efficient toilets installed and sealed correctly." },
    ],
    faqs: [
      {
        question: "Why does my toilet keep running?",
        answer:
          "Usually a worn flapper that doesn't seal, a fill valve set too high, or a flush chain that's too short. See our step-by-step guide to fixing a running toilet.",
      },
      {
        question: "Is a toilet leaking at the base serious?",
        answer:
          "Yes — even a small leak can damage the subfloor and ceiling below. It's usually a failed wax ring or a cracked flange.",
      },
    ],
    relatedServiceSlugs: ["drain-cleaning", "leak-detection", "bathroom-plumbing-remodel"],
    relatedPostSlugs: ["how-to-fix-a-running-toilet", "how-to-unclog-a-toilet", "toilet-leaking-at-base"],
    isFeatured: true,
    sortOrder: 11,
    seo: {
      metaTitle: "Toilet Repair & Installation | Running & Leaking Toilets",
      metaDescription:
        "Running, clogged or leaking toilet? Our plumbers repair fill valves, flappers and wax seals, and install new water-efficient toilets.",
      primaryKeyword: "toilet repair",
      secondaryKeywords: ["running toilet repair", "toilet installation", "toilet leak repair"],
    },
  },
  {
    id: "svc_faucet",
    slug: "faucet-sink-repair",
    name: "Faucet & Sink Repair",
    category: "fixtures",
    icon: "faucet",
    shortDescription: "Dripping faucets fixed, kitchen faucets replaced and sinks installed.",
    h1: "Faucet Repair, Replacement & Sink Installation",
    intro: [
      "A dripping faucet wastes water and money every day. Most leaks come from worn cartridges, washers or O-rings and can be repaired — but when a faucet is corroded or outdated, replacement is often the better value.",
      "We repair and install kitchen and bathroom faucets, replace sinks, and replace the shutoff valves and supply lines that are often overlooked.",
    ],
    signsTitle: "Call us for faucet or sink work when",
    signs: [
      "A faucet drips or leaks around the handle",
      "Low flow or uneven spray",
      "Water leaking under the sink",
      "Stiff or hard-to-turn handles",
      "You're upgrading to a new kitchen faucet or sink",
    ],
    featuresTitle: "Faucet & sink services",
    features: [
      { title: "Dripping faucet repair", description: "Cartridges, washers, O-rings and seats replaced on most brands." },
      { title: "Kitchen faucet replacement", description: "Pull-down, touchless and standard faucets installed cleanly." },
      { title: "Sink replacement", description: "Undermount, drop-in and farmhouse kitchen sink installation." },
      { title: "Shutoff valves & supply lines", description: "Replace seized shutoff valves and old braided or rigid supply lines." },
    ],
    faqs: [
      {
        question: "Is it worth repairing a leaky faucet?",
        answer:
          "Quality faucets are usually worth repairing with a new cartridge. Inexpensive or heavily corroded faucets are often better replaced.",
      },
      {
        question: "Can I supply my own faucet?",
        answer: "Yes. We'll install a customer-supplied faucet and let you know beforehand if any parts are missing or incompatible.",
      },
    ],
    relatedServiceSlugs: ["garbage-disposal", "drain-cleaning", "bathroom-plumbing-remodel"],
    relatedPostSlugs: ["p-trap-guide"],
    isFeatured: true,
    sortOrder: 12,
    seo: {
      metaTitle: "Faucet Repair & Kitchen Faucet Replacement",
      metaDescription:
        "Dripping or leaky faucet? We repair and replace kitchen and bathroom faucets, install sinks and replace shutoff valves.",
      primaryKeyword: "faucet repairs",
      secondaryKeywords: [
        "dripping faucet repair",
        "leaky faucet repair",
        "kitchen faucet replacement",
        "kitchen faucet installation",
        "kitchen sink replacement",
        "shutoff valves",
      ],
    },
  },
  {
    id: "svc_disposal",
    slug: "garbage-disposal",
    name: "Garbage Disposal Repair",
    category: "fixtures",
    icon: "disposal",
    shortDescription: "Jammed, humming, leaking or dead garbage disposals repaired or replaced.",
    h1: "Garbage Disposal Repair & Installation",
    intro: [
      "A garbage disposal that hums, leaks or won't turn on usually has a simple cause — a jam, a tripped reset button or a failed seal. When the unit itself has worn out, we install a properly sized replacement.",
    ],
    signsTitle: "Signs your disposal needs attention",
    signs: [
      "Humming but not spinning",
      "Not turning on at all",
      "Leaking from the bottom or connections",
      "Grinding noises or vibration",
      "Persistent bad odor or slow draining",
    ],
    featuresTitle: "Disposal services",
    features: [
      { title: "Jam & clog clearing", description: "Free stuck flywheels and clear the drain line below the unit." },
      { title: "Leak repair", description: "Mounting assembly, dishwasher connection and drain seal leaks." },
      { title: "Garbage disposal installation", description: "New units installed with correct electrical and drain connections." },
    ],
    faqs: [
      {
        question: "What should never go down a garbage disposal?",
        answer: "Grease, fibrous vegetables like celery, potato peels in quantity, coffee grounds, eggshells, bones and pasta or rice in large amounts.",
      },
      {
        question: "How long does a garbage disposal last?",
        answer: "Typically around 8–15 years depending on the model and how it's used.",
      },
    ],
    relatedServiceSlugs: ["drain-cleaning", "faucet-sink-repair"],
    relatedPostSlugs: ["how-to-fix-a-garbage-disposal"],
    isFeatured: true,
    sortOrder: 13,
    seo: {
      metaTitle: "Garbage Disposal Repair & Installation",
      metaDescription:
        "Garbage disposal jammed, leaking or dead? We repair and install disposals with proper drain and electrical connections. Call today.",
      primaryKeyword: "garbage disposal repair",
      secondaryKeywords: ["garbage disposal installation"],
    },
  },
  {
    id: "svc_gas",
    slug: "gas-line-services",
    name: "Gas Line Services",
    category: "gas",
    icon: "gas",
    shortDescription: "Gas line installation, repair and leak testing by licensed gas plumbers.",
    h1: "Gas Line Installation & Repair by Licensed Gas Plumbers",
    intro: [
      "Gas piping work requires a licensed professional and, in most areas, a permit and inspection. We install and repair gas lines for water heaters, ranges, dryers, fireplaces, outdoor kitchens and generators.",
      "If you smell gas, leave the building immediately and call your gas utility or 911 from a safe distance before calling a plumber.",
    ],
    signsTitle: "Common gas line projects",
    signs: [
      "New gas appliance installation",
      "Upsizing a gas line for a tankless water heater",
      "Gas line for an outdoor grill, fire pit or pool heater",
      "Failed pressure test or suspected leak (after the utility has made it safe)",
    ],
    featuresTitle: "Gas services",
    features: [
      { title: "Gas line installation", description: "Black iron and CSST piping sized to code for the connected load." },
      { title: "Leak detection & repair", description: "Pressure testing and repair of leaking fittings and lines." },
      { title: "Appliance hookups", description: "Ranges, dryers, water heaters and fireplaces connected safely." },
    ],
    faqs: [
      {
        question: "What should I do if I smell gas?",
        answer:
          "Don't operate switches or create sparks. Leave the building, then call your gas utility's emergency line or 911 from outside. Once the utility makes it safe, we can repair the line.",
      },
    ],
    relatedServiceSlugs: ["tankless-water-heaters", "water-heater-installation"],
    relatedPostSlugs: [],
    isFeatured: false,
    sortOrder: 14,
    seo: {
      metaTitle: "Gas Line Installation & Repair | Licensed Gas Plumber",
      metaDescription:
        "Licensed gas plumbers for gas line installation, repair, pressure testing and appliance hookups. Permitted, code-compliant work.",
      primaryKeyword: "licensed gas plumber",
      secondaryKeywords: ["gas line installation", "gas line repair"],
    },
  },
  {
    id: "svc_softener",
    slug: "water-softeners",
    name: "Water Softeners",
    category: "water-treatment",
    icon: "softener",
    shortDescription: "Water softener installation and repair to protect pipes and appliances from hard water.",
    h1: "Water Softener Installation & Repair",
    intro: [
      "Hard water leaves scale in pipes, water heaters, tankless units and fixtures, shortening their life and reducing efficiency. A correctly sized water softener protects your plumbing and makes cleaning easier.",
      "We test your water, recommend the right capacity, install with a bypass valve and drain connection, and repair existing systems.",
    ],
    signsTitle: "Signs of hard water",
    signs: [
      "White, chalky buildup on faucets and shower heads",
      "Spots on dishes and glassware",
      "Soap and shampoo that don't lather well",
      "Scale or rumbling in the water heater",
    ],
    featuresTitle: "Water treatment services",
    features: [
      { title: "Water testing", description: "Hardness testing to size the system correctly." },
      { title: "Water softener installation", description: "Installation with bypass valve, drain and brine line connections." },
      { title: "Water softener repair", description: "Resin, valve, timer and brine tank problems diagnosed and repaired." },
    ],
    faqs: [
      {
        question: "Does a water softener help my water heater?",
        answer: "Yes. Softened water reduces scale buildup in tank and tankless water heaters, which helps maintain efficiency.",
      },
    ],
    relatedServiceSlugs: ["tankless-water-heaters", "water-heater-repair"],
    relatedPostSlugs: ["tankless-water-heater-benefits"],
    isFeatured: false,
    sortOrder: 15,
    seo: {
      metaTitle: "Water Softener Installation & Repair",
      metaDescription:
        "Protect your pipes and water heater from hard water. Water testing, water softener installation and repair by licensed plumbers.",
      primaryKeyword: "water softener installation",
      secondaryKeywords: ["water softener repair"],
    },
  },
  {
    id: "svc_bath",
    slug: "bathroom-plumbing-remodel",
    name: "Bathroom Plumbing & Remodels",
    category: "remodel",
    icon: "bath",
    shortDescription: "Tub-to-shower conversions, fixture relocation and remodel plumbing done to code.",
    h1: "Bathroom Plumbing for Remodels & Tub-to-Shower Conversions",
    intro: [
      "The plumbing behind the walls determines how well a bathroom remodel performs for years to come. We handle rough-in and finish plumbing for remodels, including moving drains and supply lines, installing shower valves and converting tubs to walk-in showers.",
      "We work directly with homeowners or alongside your contractor.",
    ],
    signsTitle: "Common bathroom plumbing projects",
    signs: [
      "Tub to shower conversion",
      "Relocating a toilet, vanity or shower",
      "Replacing an old shower valve",
      "Adding a second sink or a new bathroom",
    ],
    featuresTitle: "Remodel plumbing services",
    features: [
      { title: "Tub-to-shower conversions", description: "Drain relocation, new valves and curbless or low-threshold shower plumbing." },
      { title: "Rough-in plumbing", description: "Drain, waste, vent and supply lines installed to code before walls close." },
      { title: "Fixture installation", description: "Toilets, vanities, faucets, shower systems and freestanding tubs." },
      { title: "Bathroom plumbing repair", description: "Leaks, low pressure and drainage problems in existing bathrooms." },
    ],
    faqs: [
      {
        question: "Can you move my toilet or shower drain?",
        answer: "Usually, yes. On slab foundations it may require cutting concrete. We'll assess the layout and explain the options.",
      },
    ],
    relatedServiceSlugs: ["toilet-repair", "faucet-sink-repair", "drain-cleaning"],
    relatedPostSlugs: ["p-trap-guide"],
    isFeatured: false,
    sortOrder: 16,
    seo: {
      metaTitle: "Bathroom Remodel Plumbing & Tub-to-Shower Conversion",
      metaDescription:
        "Plumbing for bathroom remodels: tub-to-shower conversions, fixture relocation, rough-in and fixture installation by licensed plumbers.",
      primaryKeyword: "tub to shower conversion",
      secondaryKeywords: ["bathroom remodeling", "plumbing remodel", "bathroom plumbing repair"],
    },
  },
  {
    id: "svc_commercial",
    slug: "commercial-plumbing",
    name: "Commercial Plumbing",
    category: "commercial",
    icon: "building",
    shortDescription: "Plumbing service and maintenance for restaurants, offices, retail and multi-unit properties.",
    h1: "Commercial Plumbing Services for Businesses",
    intro: [
      "Downtime costs money. We help restaurants, offices, retail stores, property managers and multi-unit buildings keep restrooms, kitchens and water systems running with responsive repair and planned maintenance.",
      "We can schedule work around your business hours and provide documentation for property managers and owners.",
    ],
    signsTitle: "Commercial plumbing we support",
    signs: [
      "Restaurants and commercial kitchens",
      "Offices and retail spaces",
      "Apartment and multi-unit properties",
      "Warehouses and light industrial facilities",
    ],
    featuresTitle: "Commercial services",
    features: [
      { title: "Commercial drain & sewer", description: "Grease line jetting, main line cleaning and camera inspection." },
      { title: "Water heaters & boilers", description: "Commercial water heater repair and replacement." },
      { title: "Restroom plumbing", description: "Flush valves, sensor faucets, urinals and ADA fixtures." },
      { title: "Preventive maintenance", description: "Scheduled service plans that reduce emergency calls." },
      { title: "Backflow testing", description: "Testing and repair of backflow prevention devices where required." },
    ],
    faqs: [
      {
        question: "Do you offer maintenance agreements for businesses?",
        answer: "Yes. We set up maintenance schedules based on your property type, usage and local requirements.",
      },
      {
        question: "Can you work after hours?",
        answer: "We can schedule work outside your business hours to minimize disruption, subject to availability.",
      },
    ],
    relatedServiceSlugs: ["hydro-jetting", "sewer-line-repair", "water-heater-repair", "emergency-plumbing"],
    relatedPostSlugs: [],
    isFeatured: true,
    sortOrder: 17,
    seo: {
      metaTitle: "Commercial Plumbing Services | Commercial Plumber",
      metaDescription:
        "Commercial plumbing repair and maintenance for restaurants, offices, retail and multi-unit properties. Scheduled around your hours.",
      primaryKeyword: "commercial plumbing",
      secondaryKeywords: ["commercial plumber near me", "commercial plumbing service"],
    },
  },
];
