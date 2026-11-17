import type { Author, BlogCategory, BlogPost } from "@/types";

export const authors: Author[] = [
  {
    id: "auth_team",
    name: "ClearFlow Plumbing Team",
    role: "Licensed plumbing professionals",
    bio: "Practical guidance from the plumbers who handle these repairs every day. Replace with real author profiles in the admin panel.",
  },
];

export const blogCategories: BlogCategory[] = [
  { slug: "drains-sewers", name: "Drains & Sewers", description: "Clogs, drain care and sewer line basics." },
  { slug: "water-heaters", name: "Water Heaters", description: "Maintenance, troubleshooting and buying guidance for tank and tankless heaters." },
  { slug: "toilets", name: "Toilets", description: "Fixing running, clogged and leaking toilets." },
  { slug: "pipes-leaks", name: "Pipes & Leaks", description: "Preventing frozen pipes, finding leaks and protecting your home." },
  { slug: "homeowner-tips", name: "Homeowner Tips", description: "Plumbing maintenance, insurance and smart homeowner know-how." },
];

/**
 * Mock articles mapped to informational keywords from the keyword sheet.
 * Every article links to the matching service page so readers have a natural next step.
 */
export const blogPosts: BlogPost[] = [
  {
    id: "post_running_toilet",
    slug: "how-to-fix-a-running-toilet",
    title: "How to Fix a Running Toilet (Step-by-Step)",
    excerpt:
      "A running toilet is almost always caused by one of three parts. Here's how to find the culprit and fix it in under an hour.",
    categorySlug: "toilets",
    authorId: "auth_team",
    publishedAt: "2026-10-28",
    intro:
      "A toilet that runs constantly or refills on its own wastes water every hour of the day. The good news: the cause is nearly always the flapper, the fill valve or the chain — and all three are inexpensive parts you can check yourself.",
    body: [
      { type: "h2", id: "how-a-toilet-tank-works", text: "How a toilet tank works" },
      {
        type: "p",
        text: "When you flush, the chain lifts the flapper and tank water rushes into the bowl. The flapper drops back down to seal the flush valve, and the fill valve refills the tank until the float reaches the shut-off point. A running toilet means water is either leaking past the flapper or overflowing into the overflow tube.",
      },
      { type: "h2", id: "find-the-cause", text: "Step 1: Find the cause" },
      {
        type: "ol",
        items: [
          "Remove the tank lid and set it somewhere safe — they break easily.",
          "Look at the water level. If water is spilling into the overflow tube, the fill valve or float is the problem.",
          "If the water level is below the overflow tube, add a few drops of food coloring to the tank and wait 15 minutes without flushing. Colored water in the bowl means the flapper is leaking.",
        ],
      },
      { type: "h2", id: "adjust-the-chain", text: "Step 2: Check the chain" },
      {
        type: "p",
        text: "A chain that's too short holds the flapper slightly open; a chain that's too long can get trapped under it. Leave about half an inch of slack when the flapper is closed.",
      },
      { type: "h2", id: "replace-the-flapper", text: "Step 3: Replace a worn flapper" },
      {
        type: "ol",
        items: [
          "Turn off the supply valve behind the toilet and flush to drain the tank.",
          "Unhook the old flapper from the pegs on the overflow tube and disconnect the chain.",
          "Take the old flapper to the store to match the size (2-inch and 3-inch are most common).",
          "Install the new flapper, reconnect the chain with a little slack, turn the water on and test.",
        ],
      },
      { type: "h2", id: "adjust-or-replace-the-fill-valve", text: "Step 4: Adjust or replace the fill valve" },
      {
        type: "p",
        text: "The water level should sit about an inch below the top of the overflow tube. Most modern fill valves have an adjustment screw or clip on the float — lower it slightly and test. If the valve hisses, won't shut off or refills slowly after adjustment, replace the whole fill valve.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Still running?",
        text: "If you've replaced the flapper and adjusted the fill valve and the toilet still runs, the flush valve seat may be worn or cracked. That repair usually means removing the tank — a good time to call a plumber. See our [toilet repair service](/services/toilet-repair).",
      },
      { type: "h2", id: "when-to-call-a-plumber", text: "When to call a plumber" },
      {
        type: "ul",
        items: [
          "The shut-off valve behind the toilet won't turn or is leaking",
          "Water is leaking at the base of the toilet",
          "The tank or bowl is cracked",
          "Parts are corroded or the toilet is an unusual or older model",
        ],
      },
    ],
    faqs: [
      {
        question: "How much water does a running toilet waste?",
        answer: "It depends on the leak, but a constantly running toilet can waste a large amount of water each day — enough to noticeably raise your water bill.",
      },
      {
        question: "Can I fix a running toilet without turning off the water?",
        answer: "Adjusting the float or chain doesn't require shutting off water, but replacing a flapper or fill valve does.",
      },
    ],
    relatedServiceSlugs: ["toilet-repair", "leak-detection"],
    tags: ["toilet", "diy", "water saving"],
    isFeatured: true,
    isPopular: true,
    seo: {
      metaTitle: "How to Fix a Running Toilet: Step-by-Step Guide",
      metaDescription:
        "Learn how to fix a running toilet by checking the flapper, chain and fill valve. Simple steps, common causes and when to call a plumber.",
      primaryKeyword: "how to fix a running toilet",
      secondaryKeywords: ["running toilet", "toilet keeps running"],
    },
  },
  {
    id: "post_unclog_toilet",
    slug: "how-to-unclog-a-toilet",
    title: "How to Unclog a Toilet With a Plunger (and What to Try Next)",
    excerpt: "The right plunger and the right technique clear most toilet clogs in minutes. Here's exactly how to do it — and what not to do.",
    categorySlug: "toilets",
    authorId: "auth_team",
    publishedAt: "2026-10-14",
    intro:
      "Most toilet clogs are close to the bowl and clear quickly with the right technique. The key is using the right type of plunger and resisting the urge to flush again.",
    body: [
      { type: "h2", id: "stop-the-overflow", text: "First: stop the overflow" },
      {
        type: "p",
        text: "If the bowl is close to overflowing, don't flush again. Lift the tank lid and push the flapper down to stop more water entering the bowl, then turn off the supply valve behind the toilet.",
      },
      { type: "h2", id: "use-the-right-plunger", text: "Use the right plunger" },
      {
        type: "p",
        text: "A flange plunger — the kind with a soft extension sleeve under the cup — seals into the toilet drain opening. A flat cup plunger is designed for sinks and won't seal properly in a toilet.",
      },
      { type: "h2", id: "how-to-plunge-a-toilet", text: "How to plunge a toilet properly" },
      {
        type: "ol",
        items: [
          "Make sure there's enough water in the bowl to cover the plunger cup.",
          "Insert the plunger at an angle so the flange fills with water rather than air.",
          "Press down gently the first time to push the air out, then plunge firmly in and out, keeping the seal, 15–20 times.",
          "Pull the plunger away sharply. If the water drains, flush once to test (with your hand ready on the flapper).",
          "Repeat a few cycles before moving on to another method.",
        ],
      },
      { type: "h2", id: "how-to-unclog-a-toilet-fast", text: "How to unclog a toilet fast without a plunger" },
      {
        type: "ul",
        items: [
          "Dish soap and hot water: add a squeeze of dish soap, then hot (not boiling) tap water. Wait 15–20 minutes. Boiling water can crack porcelain.",
          "Toilet auger (closet auger): the coated tip protects the bowl while the cable reaches clogs a plunger can't.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Skip the chemical drain cleaners",
        text: "Caustic drain cleaners can damage pipes and wax seals, and they make the job hazardous if the clog doesn't clear.",
      },
      { type: "h2", id: "when-its-more-than-a-clog", text: "When it's more than a simple clog" },
      {
        type: "p",
        text: "If water comes up in the tub or shower when you flush, or several drains are slow at once, the blockage is likely in the main line. That needs [drain cleaning](/services/drain-cleaning) or [sewer service](/services/sewer-line-repair), not more plunging.",
      },
    ],
    faqs: [
      {
        question: "Why does my toilet clog so often?",
        answer:
          "Frequent clogs can come from older low-flow toilets, flushing wipes or paper towels, a partially blocked drain line or a venting problem.",
      },
      { question: "Are 'flushable' wipes safe to flush?", answer: "Many wipes don't break down like toilet paper and are a common cause of clogs. Put them in the trash." },
    ],
    relatedServiceSlugs: ["toilet-repair", "drain-cleaning"],
    tags: ["toilet", "clog", "diy"],
    isFeatured: false,
    isPopular: true,
    seo: {
      metaTitle: "How to Unclog a Toilet With a Plunger (Fast Fixes)",
      metaDescription:
        "How to unclog a toilet with a plunger the right way, plus fast fixes without one. Learn when a clog means a bigger drain problem.",
      primaryKeyword: "how to unclog a toilet with a plunger",
      secondaryKeywords: ["how to unclog a toilet fast"],
    },
  },
  {
    id: "post_ptrap",
    slug: "p-trap-guide",
    title: "What Is a P-Trap? How It Works, Common Problems & Fixes",
    excerpt:
      "That curved pipe under your sink keeps sewer gas out of your home. Learn how a P-trap works, why it clogs or smells, and how to clean it.",
    categorySlug: "drains-sewers",
    authorId: "auth_team",
    publishedAt: "2026-09-30",
    intro:
      "The P-trap is the U-shaped section of pipe under sinks, tubs and showers. It's one of the simplest parts of your plumbing — and one of the most important.",
    body: [
      { type: "h2", id: "what-does-a-p-trap-do", text: "What does a P-trap do?" },
      {
        type: "p",
        text: "The curve in the trap holds a small amount of water after every use. That water seal blocks sewer gases from coming up through the drain into your home. It also catches heavy objects — like a dropped ring — before they travel further into the plumbing.",
      },
      { type: "h2", id: "parts-of-a-p-trap", text: "Parts of a sink P-trap" },
      {
        type: "ul",
        items: [
          "Tailpiece: the straight pipe coming down from the sink drain.",
          "Trap bend (J-bend): the U-shaped curve that holds water.",
          "Trap arm: the horizontal pipe that connects the bend to the drain in the wall.",
          "Slip nuts and washers: the threaded connections that let you remove the trap by hand.",
        ],
      },
      { type: "h2", id: "common-p-trap-problems", text: "Common P-trap problems" },
      { type: "h3", id: "clogs", text: "Clogs" },
      { type: "p", text: "Hair, soap and grease collect in the bend. A slow sink is often just a dirty trap." },
      { type: "h3", id: "leaks", text: "Leaks" },
      { type: "p", text: "Loose slip nuts or worn washers cause drips under the sink. Hand-tighten first; replace washers if it still leaks." },
      { type: "h3", id: "sewer-smell", text: "Sewer smell" },
      {
        type: "p",
        text: "A trap that's rarely used can dry out and lose its seal. Run water in guest bathrooms and floor drains every few weeks. If a trap that's used daily smells, the vent may be blocked — see our guide to [sewage smell in the house](/blog/sewage-smell-in-house).",
      },
      { type: "h2", id: "how-to-clean-a-p-trap", text: "How to clean a P-trap" },
      {
        type: "ol",
        items: [
          "Put a bucket under the trap and have towels nearby.",
          "Loosen both slip nuts by hand (use pliers gently if needed) and remove the bend.",
          "Empty and clean the trap with a brush, and check the trap arm for buildup.",
          "Reinstall with the washers seated correctly and hand-tighten the nuts.",
          "Run water and check for drips.",
        ],
      },
      {
        type: "callout",
        variant: "info",
        title: "S-traps and drum traps",
        text: "Older homes sometimes have S-traps or drum traps, which can siphon dry or clog easily. Modern codes generally require a vented P-trap. A plumber can convert them during a [faucet or sink replacement](/services/faucet-sink-repair).",
      },
    ],
    faqs: [
      { question: "Can I replace a P-trap myself?", answer: "Yes, PVC P-trap kits are designed for DIY replacement. Match the diameter (usually 1¼\" for bathroom sinks, 1½\" for kitchen sinks)." },
      { question: "Why is there no water in my P-trap?", answer: "Evaporation from lack of use, a leak, or siphoning caused by a venting problem." },
    ],
    relatedServiceSlugs: ["drain-cleaning", "faucet-sink-repair"],
    tags: ["p trap", "sink", "drain"],
    isFeatured: false,
    isPopular: true,
    seo: {
      metaTitle: "What Is a P-Trap? How It Works & How to Clean It",
      metaDescription:
        "Learn what a P-trap does, the parts of a bathroom sink trap, why it clogs or smells, and how to clean or replace one step by step.",
      primaryKeyword: "p trap",
      secondaryKeywords: ["p trap plumbing", "bathroom sink plumbing diagram"],
    },
  },
  {
    id: "post_flush_wh",
    slug: "how-to-flush-a-water-heater",
    title: "How to Flush a Water Heater (Tank & Tankless)",
    excerpt:
      "Flushing removes the sediment that makes water heaters noisy and inefficient. Follow these safe steps for tank and tankless units.",
    categorySlug: "water-heaters",
    authorId: "auth_team",
    publishedAt: "2026-09-16",
    intro:
      "Sediment from minerals in your water settles at the bottom of a tank water heater over time. It reduces efficiency, causes popping and rumbling sounds and can shorten the heater's life. Many manufacturers recommend flushing about once a year — more often with hard water.",
    body: [
      {
        type: "callout",
        variant: "warning",
        title: "Safety first",
        text: "Water in the tank can be hot enough to scald. Let it cool for a few hours or use extreme care. On electric heaters, the power must be off before the tank is drained — elements can burn out if powered without water.",
      },
      { type: "h2", id: "what-you-need", text: "What you'll need" },
      { type: "ul", items: ["Garden hose", "Flat-head screwdriver (for some drain valves)", "Gloves", "Bucket"] },
      { type: "h2", id: "flush-a-tank-water-heater", text: "How to flush a tank water heater" },
      {
        type: "ol",
        items: [
          "Turn off power at the breaker (electric) or set the gas control to 'Pilot' (gas).",
          "Close the cold water supply valve at the top of the heater.",
          "Open a hot water faucet nearby to let air into the system.",
          "Connect a garden hose to the drain valve and run it to a floor drain or outside.",
          "Open the drain valve and let the tank empty.",
          "Briefly open the cold supply to stir up and flush remaining sediment; repeat until water runs clear.",
          "Close the drain valve, remove the hose and open the cold supply.",
          "When water flows steadily from the open hot faucet (no sputtering), close it.",
          "Restore power or set the gas control back to 'On'.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        text: "If the drain valve won't close fully after flushing, sediment may be stuck in it. Capping it with a garden hose cap stops minor drips until it can be replaced.",
      },
      { type: "h2", id: "flush-a-tankless-water-heater", text: "How to descale a tankless water heater" },
      {
        type: "p",
        text: "Tankless units need descaling rather than draining. With the power off and isolation valves closed, a small pump circulates a descaling solution or white vinegar through the heat exchanger for about an hour, followed by a fresh-water flush. Check your manufacturer's instructions — some units have specific requirements.",
      },
      { type: "h2", id: "when-to-call-a-pro", text: "When to call a professional" },
      {
        type: "p",
        text: "If the drain valve is clogged, the water won't run clear, or the heater is leaking or still noisy afterwards, schedule [water heater repair](/services/water-heater-repair). If your heater is more than 10 years old and full of sediment, it may be time to consider [replacement](/services/water-heater-installation).",
      },
    ],
    faqs: [
      { question: "How often should I flush my water heater?", answer: "About once a year for most homes, and every six months in areas with very hard water — follow your manufacturer's guidance." },
      { question: "Is it too late to flush an old water heater?", answer: "Flushing a heater that has never been maintained can dislodge sediment that clogs the drain valve. It's still worth doing, but go slowly or have a plumber do it." },
    ],
    relatedServiceSlugs: ["water-heater-repair", "water-heater-installation", "tankless-water-heaters"],
    tags: ["water heater", "maintenance"],
    isFeatured: false,
    isPopular: true,
    seo: {
      metaTitle: "How to Flush a Water Heater: Tank & Tankless Guide",
      metaDescription:
        "Step-by-step instructions to safely flush a tank water heater and descale a tankless unit. Reduce sediment, noise and energy waste.",
      primaryKeyword: "flush water heater",
      secondaryKeywords: ["how to flush a water heater", "descale tankless water heater"],
    },
  },
  {
    id: "post_expansion_tank",
    slug: "expansion-tank-guide",
    title: "Water Heater Expansion Tanks: What They Do & When You Need One",
    excerpt: "That small tank above your water heater protects your plumbing from pressure spikes. Here's how it works and how to tell if it has failed.",
    categorySlug: "water-heaters",
    authorId: "auth_team",
    publishedAt: "2026-08-26",
    intro:
      "When water heats up, it expands. In many homes that extra volume has nowhere to go — so pressure rises throughout the plumbing every time the water heater runs. An expansion tank gives that water somewhere safe to go.",
    body: [
      { type: "h2", id: "why-thermal-expansion-matters", text: "Why thermal expansion matters" },
      {
        type: "p",
        text: "Homes with a check valve, backflow preventer or pressure-reducing valve on the main water line have a 'closed' system. Expanding water can't push back into the city main, so pressure spikes. Over time that can cause a dripping relief valve, leaking fixtures, running toilets and stress on the water heater tank.",
      },
      { type: "h2", id: "how-an-expansion-tank-works", text: "How an expansion tank works" },
      {
        type: "p",
        text: "An expansion tank is divided by a rubber diaphragm or bladder. One side connects to your water supply; the other side holds pressurized air. As water expands, it pushes into the tank and compresses the air cushion, keeping system pressure stable.",
      },
      { type: "h2", id: "do-you-need-one", text: "Do you need an expansion tank?" },
      {
        type: "ul",
        items: [
          "Your home has a pressure-reducing valve, check valve or backflow preventer",
          "Your local code requires one for water heater installations (many do)",
          "Your water heater's relief valve drips periodically",
        ],
      },
      { type: "h2", id: "signs-of-a-failed-expansion-tank", text: "Signs of a failed expansion tank" },
      {
        type: "ol",
        items: [
          "Tap the tank: the top half should sound hollow. If it sounds solid all over, it may be full of water.",
          "Briefly press the air valve on the end. Water coming out means the bladder has failed.",
          "The water heater relief valve is dripping or pressure readings spike when the heater runs.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        text: "The tank's air pre-charge should match your home's water pressure. A plumber sets this during installation with a gauge — getting it wrong reduces the tank's effectiveness.",
      },
      {
        type: "p",
        text: "We install and replace expansion tanks as part of [water heater installation](/services/water-heater-installation) and [water heater repair](/services/water-heater-repair).",
      },
    ],
    faqs: [
      { question: "How long do expansion tanks last?", answer: "Often 5–10 years, depending on water quality and pressure. It's smart to check it whenever the water heater is serviced." },
    ],
    relatedServiceSlugs: ["water-heater-installation", "water-heater-repair"],
    tags: ["water heater", "expansion tank", "water pressure"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Expansion Tank for Water Heater: How It Works & Signs of Failure",
      metaDescription:
        "Learn what a water heater expansion tank does, whether your home needs one, and how to tell when it has failed.",
      primaryKeyword: "expansion tank",
      secondaryKeywords: ["water heater expansion tank", "thermal expansion tank"],
    },
  },
  {
    id: "post_cleanout",
    slug: "sewer-line-cleanout-guide",
    title: "Sewer Line Cleanout: How to Find It and When to Use It",
    excerpt: "Your sewer cleanout gives plumbers direct access to the main line. Learn where it usually is, how it's used and why it matters in a backup.",
    categorySlug: "drains-sewers",
    authorId: "auth_team",
    publishedAt: "2026-08-12",
    intro:
      "A plumbing cleanout is a capped access pipe that connects to your main sewer line. In a backup, it's the fastest way to clear the line — and a quick way to tell where the blockage is.",
    body: [
      { type: "h2", id: "where-is-the-sewer-cleanout", text: "Where is the sewer cleanout?" },
      {
        type: "ul",
        items: [
          "Outside, near the foundation, often on the side of the house facing the street",
          "In the yard along the path of the sewer line, sometimes near the property line",
          "Indoors in a basement, garage, crawlspace or utility room in some homes",
        ],
      },
      { type: "p", text: "It's typically a 3–4 inch pipe with a threaded or push-in cap, sometimes marked 'S' or 'C/O'." },
      { type: "h2", id: "why-cleanouts-matter", text: "Why cleanouts matter" },
      {
        type: "p",
        text: "Without a cleanout, a plumber has to pull a toilet or go through a roof vent to reach the main line, which takes longer and costs more. A cleanout also lets you relieve a backup outside instead of inside the home.",
      },
      { type: "h2", id: "opening-a-cleanout-safely", text: "Opening a cleanout safely" },
      {
        type: "callout",
        variant: "warning",
        title: "Caution during a backup",
        text: "If the line is backed up, sewage can be under pressure behind the cap. Loosen it slowly, stand to the side, and wear gloves and eye protection — or leave it to a plumber.",
      },
      {
        type: "p",
        text: "If you open the cleanout and it's full of water, the blockage is further down the line toward the street. If it's dry while drains inside are backing up, the clog is between the house and the cleanout.",
      },
      { type: "h2", id: "no-cleanout", text: "What if my home doesn't have one?" },
      {
        type: "p",
        text: "Many older homes don't. Installing a cleanout makes future maintenance easier and cheaper. We install cleanouts as part of [sewer line repair](/services/sewer-line-repair), and use them for [hydro jetting](/services/hydro-jetting) and camera inspection.",
      },
    ],
    faqs: [
      { question: "Is the sewer cleanout my responsibility?", answer: "Generally the homeowner is responsible for the sewer lateral from the house to the property line or city connection, but this varies by city." },
    ],
    relatedServiceSlugs: ["sewer-line-repair", "hydro-jetting", "drain-cleaning"],
    tags: ["sewer", "cleanout"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Sewer Line Cleanout: Where It Is & How It's Used",
      metaDescription:
        "Find your sewer line cleanout, learn how plumbers use it to clear backups, and how to open it safely. Plus what to do if you don't have one.",
      primaryKeyword: "sewer line clean out",
      secondaryKeywords: ["plumbing cleanout", "sewer cleanout"],
    },
  },
  {
    id: "post_frozen",
    slug: "how-to-prevent-and-thaw-frozen-pipes",
    title: "Frozen Pipes: How to Prevent Them and Thaw Them Safely",
    excerpt: "A burst pipe can cause serious water damage in minutes. Here's how to protect your pipes before a freeze — and thaw them safely if they freeze.",
    categorySlug: "pipes-leaks",
    authorId: "auth_team",
    publishedAt: "2026-11-04",
    intro:
      "Water expands as it freezes, building pressure inside the pipe. Pipes often burst not where the ice forms, but between the ice and a closed faucet. A few simple steps before a cold snap prevent most problems.",
    body: [
      { type: "h2", id: "frozen-pipes-prevention", text: "Frozen pipes prevention checklist" },
      {
        type: "ul",
        items: [
          "Insulate pipes in attics, crawlspaces, garages and exterior walls with foam pipe insulation.",
          "Disconnect, drain and store garden hoses; close interior shut-offs to outdoor faucets if you have them.",
          "Open cabinet doors under sinks on exterior walls to let warm air reach the pipes.",
          "Let faucets on vulnerable lines drip during hard freezes — moving water is less likely to freeze.",
          "Keep the thermostat at a steady temperature day and night, even when you're away.",
          "Seal gaps and air leaks near pipes where cold air gets in.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Know your main shut-off",
        text: "Find your main water shut-off valve before winter and make sure it turns. If a pipe bursts, shutting it off quickly is the single best way to limit damage.",
      },
      { type: "h2", id: "signs-your-pipes-are-frozen", text: "Signs your pipes are frozen" },
      {
        type: "ul",
        items: ["Little or no water from a faucet in freezing weather", "Frost on exposed pipe", "Bulging pipe sections", "Unusual odors from drains"],
      },
      { type: "h2", id: "how-to-thaw-frozen-pipes", text: "How to thaw frozen pipes safely" },
      {
        type: "ol",
        items: [
          "Open the faucet the frozen pipe feeds so water and steam can escape as it thaws.",
          "Start warming the pipe nearest the faucet and work back toward the frozen section.",
          "Use a hair dryer, heating pad, or towels soaked in hot water. Keep space heaters a safe distance from anything flammable.",
          "Keep applying heat until full water pressure returns, then check all faucets — other pipes may be frozen too.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Never use an open flame",
        text: "Never thaw pipes with a torch, propane heater or any open flame. It's a serious fire risk and can damage the pipe.",
      },
      { type: "h2", id: "if-a-pipe-bursts", text: "If a pipe bursts" },
      {
        type: "p",
        text: "Shut off the main water valve, turn off electricity to affected areas if water is near outlets or appliances, and call for [emergency plumbing](/emergency-plumbing). We repair burst sections and check for hidden damage as part of our [pipe repair service](/services/pipe-repair).",
      },
    ],
    faqs: [
      { question: "At what temperature do pipes freeze?", answer: "Pipes in unheated or exposed spaces are at risk once outdoor temperatures drop to around 20°F or below, especially for several hours." },
      { question: "Will frozen pipes thaw on their own?", answer: "They may, but a frozen pipe can burst as it thaws. Thawing it under control with the faucet open is safer." },
    ],
    relatedServiceSlugs: ["pipe-repair", "emergency-plumbing", "leak-detection"],
    tags: ["frozen pipes", "winter", "burst pipe"],
    isFeatured: false,
    isPopular: true,
    seo: {
      metaTitle: "Frozen Pipes: Prevention Tips & How to Thaw Them Safely",
      metaDescription:
        "Prevent frozen pipes with this winter checklist, learn the signs of frozen pipes and how to thaw them safely. Plus what to do if a pipe bursts.",
      primaryKeyword: "frozen pipes prevention",
      secondaryKeywords: ["how to thaw frozen pipes", "plumbing frozen pipes"],
    },
  },
  {
    id: "post_wh_not_heating",
    slug: "water-heater-not-heating",
    title: "Water Heater Not Heating? 8 Common Causes and Fixes",
    excerpt: "No hot water, or not enough? Work through these common causes for gas, electric and tankless water heaters before calling for repair.",
    categorySlug: "water-heaters",
    authorId: "auth_team",
    publishedAt: "2026-07-22",
    intro:
      "A water heater that stops heating usually has a specific, fixable cause. Some are simple checks you can do in a few minutes; others need a plumber's diagnosis.",
    body: [
      { type: "h2", id: "electric-water-heaters", text: "Electric water heater not heating" },
      { type: "h3", id: "tripped-breaker", text: "1. Tripped breaker" },
      { type: "p", text: "Check the panel. If the breaker trips again after resetting, stop and call a professional — there's an electrical fault." },
      { type: "h3", id: "high-limit-reset", text: "2. High-limit reset button tripped" },
      {
        type: "p",
        text: "Many electric heaters have a red reset button behind the upper access panel. With the power off, pressing it may restore heat. If it keeps tripping, a thermostat or element has likely failed.",
      },
      { type: "h3", id: "failed-element", text: "3. Failed heating element" },
      { type: "p", text: "Lukewarm water that runs out quickly often means the upper or lower element has burned out. Elements must be tested with power off." },
      { type: "h2", id: "gas-water-heaters", text: "Gas water heater not heating" },
      { type: "h3", id: "pilot-light-out", text: "4. Pilot light out" },
      { type: "p", text: "Follow the relighting instructions on the heater's label. If the pilot won't stay lit, the thermocouple or flame sensor may need replacing." },
      { type: "h3", id: "gas-supply", text: "5. Gas supply" },
      { type: "p", text: "Make sure the gas valve to the heater is open and other gas appliances are working." },
      {
        type: "callout",
        variant: "warning",
        text: "If you smell gas, don't try to relight anything. Leave the home and call your gas utility from outside.",
      },
      { type: "h2", id: "any-water-heater", text: "Causes that affect any water heater" },
      { type: "h3", id: "thermostat-setting", text: "6. Thermostat set too low" },
      { type: "p", text: "Around 120°F is a common setting that balances comfort, efficiency and scald prevention." },
      { type: "h3", id: "sediment", text: "7. Sediment buildup" },
      { type: "p", text: "Sediment insulates the water from the burner or lower element. See [how to flush a water heater](/blog/how-to-flush-a-water-heater)." },
      { type: "h3", id: "undersized-or-old", text: "8. Undersized or aging heater" },
      { type: "p", text: "If demand has grown or the heater is past 10 years old, it may simply not keep up anymore." },
      { type: "h2", id: "tankless-not-heating", text: "Tankless water heater not heating" },
      {
        type: "p",
        text: "Look for an error code on the display, check that the flow rate is high enough to activate the unit, and consider scale buildup if you have hard water. Undersized gas lines are also a common cause after tank-to-tankless conversions.",
      },
      {
        type: "p",
        text: "Still no hot water? Our plumbers handle [water heater repair](/services/water-heater-repair) for gas, electric and tankless units.",
      },
    ],
    faqs: [
      { question: "Why do I have hot water but it runs out fast?", answer: "Common causes are a failed lower element (electric), heavy sediment, a broken dip tube, or a heater that's too small for your household." },
    ],
    relatedServiceSlugs: ["water-heater-repair", "water-heater-installation", "tankless-water-heaters"],
    tags: ["water heater", "troubleshooting"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Water Heater Not Heating? 8 Causes & Fixes",
      metaDescription:
        "Hot water heater not working? Troubleshoot breakers, reset buttons, elements, pilot lights and sediment for gas, electric and tankless heaters.",
      primaryKeyword: "water heater not heating",
      secondaryKeywords: ["hot water heater not working"],
    },
  },
  {
    id: "post_toilet_base",
    slug: "toilet-leaking-at-base",
    title: "Toilet Leaking at the Base? Causes and How to Fix It",
    excerpt: "Water around the base of the toilet can damage the subfloor fast. Here's how to find the source and when the wax ring needs replacing.",
    categorySlug: "toilets",
    authorId: "auth_team",
    publishedAt: "2026-07-08",
    intro:
      "Water around the base of a toilet isn't always coming from the base. Before pulling the toilet, rule out the simpler causes.",
    body: [
      { type: "h2", id: "find-the-source", text: "Find the real source" },
      {
        type: "ul",
        items: [
          "Supply line: check the connection at the shut-off valve and under the tank.",
          "Tank bolts: look for drips under the tank where it bolts to the bowl.",
          "Condensation: in humid weather, a cold tank 'sweats' and drips onto the floor.",
          "Wax ring: water appears at the base after flushing, often with a sewer smell.",
        ],
      },
      { type: "h2", id: "tighten-the-closet-bolts", text: "Try tightening the closet bolts" },
      {
        type: "p",
        text: "If the toilet rocks, gently snug the nuts on the bolts at the base, alternating sides. Don't overtighten — porcelain cracks easily.",
      },
      { type: "h2", id: "replace-the-wax-ring", text: "Replacing the wax ring" },
      {
        type: "ol",
        items: [
          "Turn off the water, flush, and sponge out remaining water.",
          "Disconnect the supply line and remove the nuts from the closet bolts.",
          "Lift the toilet straight up and set it on cardboard.",
          "Scrape off the old wax and inspect the flange for cracks or rust.",
          "Install a new wax ring and bolts, set the toilet straight down, and tighten evenly.",
          "Reconnect the supply, turn on the water and check for leaks.",
        ],
      },
      {
        type: "callout",
        variant: "info",
        text: "A broken or corroded flange, a floor that feels soft, or a ceiling stain below are signs the problem has gone beyond the wax ring. Our [toilet repair service](/services/toilet-repair) covers flange repair and resetting.",
      },
    ],
    faqs: [{ question: "Can I use caulk to stop a toilet leak at the base?", answer: "No. Caulk around the base is cosmetic. It can hide a leak while the subfloor rots underneath." }],
    relatedServiceSlugs: ["toilet-repair", "leak-detection"],
    tags: ["toilet", "leak"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Toilet Leaking at Base: Causes & How to Fix It",
      metaDescription:
        "Toilet leaking at the base? Learn how to find the source, when to replace the wax ring, and signs of flange or subfloor damage.",
      primaryKeyword: "toilet leaking at base",
      secondaryKeywords: ["replace toilet wax ring"],
    },
  },
  {
    id: "post_sewage_smell",
    slug: "sewage-smell-in-house",
    title: "Sewage Smell in the House: 6 Causes and What to Do",
    excerpt: "A sewer smell usually means sewer gas is getting past a seal somewhere. Here's how to track down the source.",
    categorySlug: "drains-sewers",
    authorId: "auth_team",
    publishedAt: "2026-06-17",
    intro:
      "Sewer gas is unpleasant and, in high concentrations, unhealthy. The source is usually something simple — but it's worth finding quickly.",
    body: [
      {
        type: "callout",
        variant: "warning",
        title: "Rotten egg smell near gas appliances?",
        text: "Natural gas has an added odor that smells like rotten eggs. If the smell is near a gas appliance or meter, leave the home and call your gas utility from outside.",
      },
      { type: "h2", id: "common-causes", text: "Common causes of sewage smells" },
      { type: "h3", id: "dry-traps", text: "1. Dry P-traps" },
      { type: "p", text: "Unused sinks, showers and floor drains lose their water seal. Run water for a minute to refill them." },
      { type: "h3", id: "wax-ring", text: "2. Failed toilet wax ring" },
      { type: "p", text: "A smell around the toilet base, often with a slight wobble, points to the seal." },
      { type: "h3", id: "vent-problems", text: "3. Blocked or cracked vent pipe" },
      { type: "p", text: "Vents let sewer gas exit through the roof. A blocked vent can siphon traps dry; a cracked vent can leak gas into walls or the attic." },
      { type: "h3", id: "biofilm", text: "4. Buildup in sink overflows and drains" },
      { type: "p", text: "Organic buildup in a sink overflow or drain can smell surprisingly similar to sewage." },
      { type: "h3", id: "sewer-line", text: "5. Damaged or clogged sewer line" },
      { type: "p", text: "Smells combined with slow drains or backups suggest a main line issue." },
      { type: "h3", id: "cleanout-cap", text: "6. Loose or missing cleanout cap" },
      { type: "p", text: "Check indoor and outdoor cleanout caps — see our [sewer cleanout guide](/blog/sewer-line-cleanout-guide)." },
      {
        type: "p",
        text: "If the smell persists after refilling traps, a plumber can smoke-test the system to find the leak. See our [sewer line repair](/services/sewer-line-repair) and [drain cleaning](/services/drain-cleaning) services.",
      },
    ],
    faqs: [{ question: "Is sewer gas dangerous?", answer: "Low levels are mainly unpleasant, but sewer gas contains hydrogen sulfide and methane. Ventilate the area and find the source promptly." }],
    relatedServiceSlugs: ["sewer-line-repair", "drain-cleaning"],
    tags: ["sewer gas", "odor"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Sewage Smell in House? 6 Common Causes & Fixes",
      metaDescription:
        "Why does my house smell like sewage? Learn the common causes — dry traps, wax rings, vent problems, sewer line issues — and how to fix them.",
      primaryKeyword: "sewage smell in house",
      secondaryKeywords: ["sewer smell in bathroom"],
    },
  },
  {
    id: "post_insurance",
    slug: "does-homeowners-insurance-cover-plumbing",
    title: "Does Homeowners Insurance Cover Plumbing Problems?",
    excerpt: "What's typically covered, what usually isn't, and how to document plumbing damage for a claim.",
    categorySlug: "homeowner-tips",
    authorId: "auth_team",
    publishedAt: "2026-05-27",
    intro:
      "Coverage depends entirely on your policy, but most standard homeowners policies follow a similar pattern: they tend to cover sudden and accidental damage, not wear and tear. This guide is general information — always confirm with your insurer.",
    body: [
      { type: "h2", id: "usually-covered", text: "What's often covered" },
      {
        type: "ul",
        items: [
          "Water damage from a sudden pipe burst or appliance failure",
          "Accessing a hidden leak (for example, opening a wall or slab) under some policies",
          "Repairing interior damage caused by the covered event",
        ],
      },
      { type: "h2", id: "usually-not-covered", text: "What's often not covered" },
      {
        type: "ul",
        items: [
          "Gradual leaks and damage that developed over time",
          "The failed pipe or appliance itself, in many policies",
          "Sewer or drain backups — often requires a separate endorsement",
          "Flood damage from outside water — requires separate flood insurance",
          "Damage from lack of maintenance",
        ],
      },
      { type: "h2", id: "documenting-a-claim", text: "How to document plumbing damage" },
      {
        type: "ol",
        items: [
          "Stop the water and take photos and video before cleanup.",
          "Keep damaged materials if safe, or photograph them before disposal.",
          "Get a written report from your plumber describing the cause and repair.",
          "Save every invoice and receipt.",
          "Notify your insurer promptly.",
        ],
      },
      {
        type: "callout",
        variant: "info",
        text: "We provide photos and written findings with [leak detection](/services/leak-detection) and [slab leak repair](/services/slab-leak-repair) to support your claim. We can't determine coverage — only your insurer can.",
      },
    ],
    faqs: [{ question: "Does insurance cover slab leaks?", answer: "Some policies cover tear-out and resulting damage but not the pipe repair itself. Review your policy or ask your agent." }],
    relatedServiceSlugs: ["leak-detection", "slab-leak-repair", "pipe-repair"],
    tags: ["insurance", "water damage"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Does Homeowners Insurance Cover Plumbing? What to Know",
      metaDescription:
        "What homeowners insurance typically covers for plumbing — burst pipes, leaks, sewer backups — and how to document damage for a claim.",
      primaryKeyword: "does homeowners insurance cover plumbing",
      secondaryKeywords: ["does insurance cover water damage from pipes"],
    },
  },
  {
    id: "post_disposal",
    slug: "how-to-fix-a-garbage-disposal",
    title: "How to Fix a Garbage Disposal That Won't Work",
    excerpt: "Humming, silent or leaking? Most garbage disposal problems can be fixed safely in a few minutes with the right steps.",
    categorySlug: "homeowner-tips",
    authorId: "auth_team",
    publishedAt: "2026-05-06",
    intro: "Before replacing a garbage disposal, try these safe fixes. Always turn off the power first — and never put your hand inside the unit.",
    body: [
      { type: "h2", id: "disposal-humming", text: "If the disposal hums but doesn't spin" },
      {
        type: "ol",
        items: [
          "Turn off the switch and unplug the unit or switch off the breaker.",
          "Insert a disposal hex wrench (¼\") into the socket on the bottom center of the unit.",
          "Work it back and forth until the flywheel turns freely.",
          "Use tongs to remove any object from the chamber.",
          "Press the red reset button, restore power and test with cold water running.",
        ],
      },
      { type: "h2", id: "disposal-wont-turn-on", text: "If it won't turn on at all" },
      { type: "p", text: "Press the reset button on the bottom, check the breaker or GFCI outlet, and make sure the unit is plugged in." },
      { type: "h2", id: "disposal-leaking", text: "If it's leaking" },
      {
        type: "ul",
        items: [
          "Top (sink flange): plumber's putty or mounting bolts need attention.",
          "Side (dishwasher or drain connection): tighten clamps or replace the gasket.",
          "Bottom: usually an internal seal failure — the unit typically needs replacement.",
        ],
      },
      {
        type: "p",
        text: "If these steps don't work, our plumbers handle [garbage disposal repair and installation](/services/garbage-disposal), and can clear the [kitchen drain](/services/drain-cleaning) below it.",
      },
    ],
    faqs: [{ question: "Why does my garbage disposal smell?", answer: "Food residue builds up under the splash guard and on the grinding plate. Grind ice cubes and citrus peels and clean the splash guard." }],
    relatedServiceSlugs: ["garbage-disposal", "drain-cleaning"],
    tags: ["garbage disposal", "kitchen"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "How to Fix a Garbage Disposal: Humming, Leaking or Dead",
      metaDescription:
        "Fix a garbage disposal that hums, won't turn on or leaks. Safe step-by-step instructions and when to call a plumber.",
      primaryKeyword: "how to fix garbage disposal",
      secondaryKeywords: ["garbage disposal humming"],
    },
  },
  {
    id: "post_tankless_benefits",
    slug: "tankless-water-heater-benefits",
    title: "Tankless Water Heater Benefits, Drawbacks & Lifespan",
    excerpt: "Is a tankless water heater worth it? An honest look at efficiency, lifespan, upfront cost and what installation really involves.",
    categorySlug: "water-heaters",
    authorId: "auth_team",
    publishedAt: "2026-04-15",
    intro:
      "Tankless water heaters are popular for good reasons, but they aren't the right fit for every home. Here's a balanced look to help you decide.",
    body: [
      { type: "h2", id: "benefits", text: "Benefits of a tankless water heater" },
      {
        type: "ul",
        items: [
          "Continuous hot water — no waiting for a tank to recover.",
          "Lower standby energy loss, since water isn't kept hot 24/7. The U.S. Department of Energy notes demand water heaters can be roughly 24%–34% more energy efficient for homes using 41 gallons or less of hot water daily.",
          "Compact, wall-mounted units free up floor space.",
          "Longer service life — often around 20 years with maintenance.",
        ],
      },
      { type: "h2", id: "drawbacks", text: "Drawbacks to consider" },
      {
        type: "ul",
        items: [
          "Higher upfront cost for the unit and installation.",
          "Gas models often need a larger gas line and new venting.",
          "Flow rate limits — running several showers at once may exceed a single unit's capacity.",
          "Annual descaling is important, especially with hard water.",
        ],
      },
      { type: "h2", id: "tankless-water-heater-lifespan", text: "Tankless water heater lifespan" },
      {
        type: "p",
        text: "Many tankless units last about 20 years, compared to roughly 8–12 years for a typical tank. Scale is the biggest threat to that lifespan — [descaling](/blog/how-to-flush-a-water-heater) and a [water softener](/services/water-softeners) in hard-water areas help.",
      },
      {
        type: "p",
        text: "Thinking about switching? Our [tankless water heater installation](/services/tankless-water-heaters) service includes gas line sizing and venting assessment up front.",
      },
    ],
    faqs: [{ question: "Can a tankless water heater run out of hot water?", answer: "It won't run out like a tank, but if demand exceeds its flow rating, water temperature can drop. Proper sizing prevents this." }],
    relatedServiceSlugs: ["tankless-water-heaters", "water-heater-installation", "water-softeners"],
    tags: ["tankless", "water heater", "energy efficiency"],
    isFeatured: false,
    isPopular: false,
    seo: {
      metaTitle: "Tankless Water Heater Benefits, Drawbacks & Lifespan",
      metaDescription:
        "Are tankless water heaters worth it? Compare benefits, drawbacks, energy efficiency and lifespan before you switch from a tank.",
      primaryKeyword: "tankless water heater benefits",
      secondaryKeywords: ["tankless water heater lifespan"],
    },
  },
];
