/**
 * Seeds the database. Safe to re-run:
 *  - roles & permissions are always synced
 *  - content is only seeded into an empty database
 *  - keywords from the sheet are upserted (assignments preserved)
 *  - an Owner account is created when ADMIN_EMAIL + ADMIN_PASSWORD are set
 *
 * Content comes from the website's Phase 1 mock data so nothing is lost in the move to the CMS.
 */
import "../load-env";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/db";
import { PERMISSIONS, DEFAULT_ROLES } from "../src/auth/permissions";
import { hashPassword } from "../src/auth/password";
import { importKeywords, parseKeywordFile, normalizeKeyword } from "../src/modules/keywords.service";
import { siteSettings } from "../../src/lib/api/mock/data/site";
import { services } from "../../src/lib/api/mock/data/services";
import { locations } from "../../src/lib/api/mock/data/locations";
import { blogPosts, blogCategories, authors } from "../../src/lib/api/mock/data/blog";

const ROOT = path.resolve(import.meta.dirname, "../..");
const KEYWORD_SHEET = path.join(ROOT, "USA Plumbing Services SEO Keyword List.xlsx");

const CATEGORY_NAMES: Record<string, string> = {
  emergency: "Emergency",
  "drains-sewer": "Drains & Sewer",
  "water-heaters": "Water Heaters",
  "leaks-pipes": "Leaks & Pipes",
  fixtures: "Fixtures",
  gas: "Gas",
  "water-treatment": "Water Treatment",
  remodel: "Remodel",
  commercial: "Commercial",
};

async function seedRbac() {
  for (const [key, p] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { key }, create: { key, ...p }, update: p });
  }
  const perms = await prisma.permission.findMany();
  for (const r of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({ where: { name: r.name }, create: { name: r.name, description: r.description, isSystem: Boolean(r.isSystem) }, update: { description: r.description } });
    // Owner always gets every permission; other default roles only on first creation
    const existing = await prisma.rolePermission.count({ where: { roleId: role.id } });
    if (r.isSystem || existing === 0) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await prisma.rolePermission.createMany({ data: perms.filter((p) => (r.permissions as string[]).includes(p.key)).map((p) => ({ roleId: role.id, permissionId: p.id })) });
    }
  }
  console.log("✔ roles & permissions");
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ℹ ADMIN_EMAIL/ADMIN_PASSWORD not set — create the first admin with: npm run admin:create -- --email you@company.com --name \"Your Name\"");
    return;
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  const owner = await prisma.role.findUniqueOrThrow({ where: { name: "Owner" } });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return console.log(`ℹ admin ${email} already exists (password unchanged)`);
  await prisma.user.create({ data: { email, name: process.env.ADMIN_NAME ?? "Site Owner", roleId: owner.id, passwordHash: await hashPassword(password) } });
  console.log(`✔ owner account ${email}`);
}

async function seedSettings() {
  const s = siteSettings;
  await prisma.businessInfo.create({
    data: {
      id: "default",
      businessName: s.businessName,
      legalName: s.legalName,
      tagline: s.tagline,
      shortDescription: s.shortDescription,
      email: s.email,
      street: s.address.street,
      city: s.address.city,
      region: s.address.region,
      postalCode: s.address.postalCode,
      country: s.address.country,
      serviceAreaLabel: s.serviceAreaLabel,
      licenseNumber: s.licenseNumber,
      priceRange: s.priceRange,
      emergencyAvailable: s.emergency.available,
      emergencyLabel: s.emergency.label,
      emergencyShortLabel: s.emergency.shortLabel,
      trustFootnote: s.trustFootnote,
    },
  });
  await prisma.phoneNumber.create({ data: { label: "Main line", display: s.phone.display, e164: s.phone.e164, type: "MAIN", isPrimary: true } });
  const week = [
    { dayOfWeek: 0, isClosed: true, note: "Emergency calls only" },
    ...[1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, isClosed: false, opensAt: "07:00", closesAt: "19:00" })),
    { dayOfWeek: 6, isClosed: false, opensAt: "08:00", closesAt: "17:00" },
  ];
  await prisma.businessHours.createMany({ data: week });
  await prisma.trustBadge.createMany({ data: s.trustBadges.map((t, i) => ({ label: t.label, description: t.description, icon: t.icon, requiresFootnote: t.requiresFootnote, sortOrder: i })) });
  await prisma.socialLink.createMany({ data: s.social.map((x, i) => ({ platform: x.platform, label: x.label, url: x.url, sortOrder: i })) });
  const nav = (location: "HEADER" | "FOOTER_QUICK_LINKS" | "FOOTER_LEGAL", items: [string, string][]) => items.map(([label, href], i) => ({ location, label, href, sortOrder: i }));
  await prisma.navigationItem.createMany({
    data: [
      ...nav("HEADER", [["Emergency Plumbing", "/emergency-plumbing"], ["Service Areas", "/service-areas"], ["About", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]]),
      ...nav("FOOTER_QUICK_LINKS", [["Request Service", "/request-service"], ["Emergency Plumbing", "/emergency-plumbing"], ["About Us", "/about"], ["Plumbing Tips & Guides", "/blog"], ["Contact", "/contact"]]),
      ...nav("FOOTER_LEGAL", [["Privacy Policy", "/privacy-policy"], ["Terms & Conditions", "/terms-and-conditions"], ["Disclaimer", "/disclaimer"]]),
    ],
  });
  await prisma.footerSettings.create({ data: { id: "default" } });
  await prisma.systemSetting.createMany({
    data: [
      { key: "robots", value: { allowIndexing: true, disallow: ["/api/"], extra: "" } },
      { key: "leadNotifications", value: { emails: [] } },
      { key: "callTracking", value: { provider: "none", scriptUrl: null } },
      { key: "analytics", value: { ga4MeasurementId: null, gtmId: null } },
    ],
  });
  console.log("✔ business settings");
}

async function seedServices() {
  for (const [i, slug] of Object.keys(CATEGORY_NAMES).entries()) {
    await prisma.serviceCategory.create({ data: { slug, name: CATEGORY_NAMES[slug], sortOrder: i } });
  }
  const cats = Object.fromEntries((await prisma.serviceCategory.findMany()).map((c) => [c.slug, c.id]));
  for (const s of services) {
    const seo = await prisma.seoMeta.create({ data: { metaTitle: s.seo.metaTitle, metaDescription: s.seo.metaDescription } });
    await prisma.service.create({
      data: {
        id: s.id,
        slug: s.slug,
        name: s.name,
        categoryId: cats[s.category],
        icon: s.icon,
        shortDescription: s.shortDescription,
        h1: s.h1,
        intro: s.intro,
        signsTitle: s.signsTitle,
        signs: s.signs,
        featuresTitle: s.featuresTitle,
        features: s.features as never,
        pathOverride: s.path,
        isFeatured: s.isFeatured,
        isEmergency: Boolean(s.isEmergency),
        status: "PUBLISHED",
        sortOrder: s.sortOrder,
        seoId: seo.id,
        faqs: { create: s.faqs.map((f, j) => ({ ...f, sortOrder: j })) },
      },
    });
  }
  for (const s of services) {
    await prisma.serviceRelation.createMany({
      data: s.relatedServiceSlugs.map((r, i) => ({ serviceId: s.id, relatedServiceId: services.find((x) => x.slug === r)!.id, sortOrder: i })),
    });
  }
  console.log(`✔ ${services.length} services`);
}

async function seedLocations() {
  for (const l of locations) {
    const state = await prisma.state.upsert({ where: { code: l.stateCode }, create: { code: l.stateCode, name: l.stateName, slug: l.stateName.toLowerCase() }, update: {} });
    const city = await prisma.city.create({ data: { name: l.city, slug: l.city.toLowerCase().replace(/\s+/g, "-"), stateId: state.id, lat: l.geo?.lat, lng: l.geo?.lng } });
    const seo = await prisma.seoMeta.create({ data: { metaTitle: l.seo.metaTitle, metaDescription: l.seo.metaDescription } });
    await prisma.serviceArea.create({
      data: {
        id: l.id,
        slug: l.slug,
        cityId: city.id,
        description: l.intro[0].slice(0, 300),
        intro: l.intro,
        localConsiderations: l.localConsiderations as never,
        nearbyAreas: l.nearbyAreas,
        zipCodes: l.zipCodes,
        status: "PUBLISHED",
        sortOrder: l.sortOrder,
        seoId: seo.id,
        faqs: { create: l.faqs.map((f, j) => ({ ...f, sortOrder: j })) },
        // Every published service is offered in every sample area; featured ones are highlighted
        services: { create: services.map((s, j) => ({ serviceId: s.id, isFeatured: l.featuredServiceSlugs.includes(s.slug), sortOrder: j })) },
      },
    });
  }
  console.log(`✔ ${locations.length} service areas`);
}

async function seedBlog() {
  for (const [i, c] of blogCategories.entries()) await prisma.blogCategory.create({ data: { ...c, sortOrder: i } });
  for (const a of authors) await prisma.author.create({ data: { id: a.id, slug: "clearflow-team", name: a.name, role: a.role, bio: a.bio } });
  const cats = Object.fromEntries((await prisma.blogCategory.findMany()).map((c) => [c.slug, c.id]));
  for (const p of blogPosts) {
    const seo = await prisma.seoMeta.create({ data: { metaTitle: p.seo.metaTitle, metaDescription: p.seo.metaDescription } });
    await prisma.post.create({
      data: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        intro: p.intro,
        body: p.body,
        categoryId: cats[p.categorySlug],
        authorId: p.authorId,
        status: "PUBLISHED",
        publishedAt: new Date(`${p.publishedAt}T14:00:00Z`),
        isFeatured: p.isFeatured,
        isPopular: p.isPopular,
        seoId: seo.id,
        faqs: { create: p.faqs.map((f, j) => ({ ...f, sortOrder: j })) },
        services: { create: p.relatedServiceSlugs.map((s, j) => ({ serviceId: services.find((x) => x.slug === s)!.id, sortOrder: j })) },
        tags: {
          create: await Promise.all(
            p.tags.map(async (t) => {
              const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const tag = await prisma.tag.upsert({ where: { slug }, create: { slug, name: t }, update: {} });
              return { tagId: tag.id };
            }),
          ),
        },
      },
    });
  }
  // Link service pages to their "Helpful guides"
  for (const s of services) {
    for (const [j, slug] of s.relatedPostSlugs.entries()) {
      const post = blogPosts.find((p) => p.slug === slug);
      if (post) await prisma.postService.upsert({ where: { postId_serviceId: { postId: post.id, serviceId: s.id } }, create: { postId: post.id, serviceId: s.id, sortOrder: j }, update: {} });
    }
  }
  console.log(`✔ ${blogPosts.length} blog posts`);
}

async function seedPagesAndFaqs() {
  const homeFaqs = [
    ["Do you offer residential and commercial plumbing?", "Yes. We work in single-family homes, condos and apartments as well as restaurants, offices, retail spaces and multi-unit properties. See [commercial plumbing](/services/commercial-plumbing) for business services."],
    ["How quickly can a plumber get to me?", "It depends on your location and the schedule that day. Call us and we'll give you a realistic arrival window. Emergencies like burst pipes and sewer backups are prioritized."],
    ["Will I know the price before work starts?", "Yes. Your plumber diagnoses the problem, explains your options and confirms the price in writing before beginning any work."],
    ["What areas do you serve?", "See our [service areas](/service-areas) page for the cities and communities we cover. If you don't see yours, give us a call."],
  ];
  await prisma.faq.createMany({ data: homeFaqs.map(([question, answer], i) => ({ question, answer, group: "home", sortOrder: i })) });

  // Tokens like {{legalName}} are filled from Business Settings at render time.
  const pages: { slug: string; title: string; intro: string; body: unknown[] }[] = [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      intro: 'This Privacy Policy explains how {{legalName}} ("we", "us") collects, uses and protects information when you visit this website or request our services.',
      body: [
        { type: "h2", id: "information-we-collect", text: "Information we collect" },
        { type: "ul", items: ["Information you provide: name, phone number, email address, ZIP code, service details and messages submitted through our forms or by phone.", "Technical information: pages visited, referring pages, device type and campaign parameters (UTM), collected to understand how visitors find us."] },
        { type: "h2", id: "how-we-use-information", text: "How we use information" },
        { type: "ul", items: ["To respond to service requests, schedule appointments and provide plumbing services.", "To communicate with you about your request by phone, text message or email.", "To improve our website and services.", "To comply with legal obligations."] },
        { type: "h2", id: "sharing", text: "Sharing of information" },
        { type: "p", text: "We do not sell your personal information. We may share information with service providers who help us operate our business, only as needed to provide our services, or when required by law." },
        { type: "h2", id: "cookies", text: "Cookies and analytics" },
        { type: "p", text: "We use a first-party browser storage entry to remember how you arrived at the site (for example, the campaign that brought you here) so we can attribute service requests. You can clear it at any time in your browser settings." },
        { type: "h2", id: "your-rights", text: "Your choices and rights" },
        { type: "p", text: "Depending on where you live, you may have rights to access, correct or delete your personal information. Contact us at {{email}} or {{phone}}." },
        { type: "h2", id: "contact", text: "Contact us" },
        { type: "p", text: "{{legalName}}, {{address}}. Email: {{email}}. Phone: {{phone}}." },
      ],
    },
    {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      intro: "By using this website, you agree to these Terms & Conditions. If you do not agree, please do not use the site. These terms apply to {{legalName}}.",
      body: [
        { type: "h2", id: "use", text: "Use of this website" },
        { type: "p", text: "This website provides general information about our plumbing services. You agree to use it only for lawful purposes and not to interfere with its operation." },
        { type: "h2", id: "requests", text: "Service requests" },
        { type: "p", text: "Submitting a service request does not guarantee an appointment. Appointments are confirmed when we contact you. Availability, arrival times and pricing depend on location, scheduling and the work required, and are confirmed before work begins." },
        { type: "h2", id: "estimates", text: "Estimates and pricing" },
        { type: "p", text: "Any estimate is based on the information available at the time. If conditions differ once work begins, we will explain any change and obtain your approval before proceeding." },
        { type: "h2", id: "warranties", text: "Warranties" },
        { type: "p", text: "Warranty terms for parts and labor, if any, are provided in writing with your invoice." },
        { type: "h2", id: "liability", text: "Limitation of liability" },
        { type: "p", text: "To the extent permitted by law, we are not liable for indirect or consequential damages arising from use of this website or reliance on its general information." },
        { type: "h2", id: "contact", text: "Contact" },
        { type: "p", text: "Questions about these terms? Contact {{legalName}} at {{email}} or {{phone}}." },
      ],
    },
    {
      slug: "disclaimer",
      title: "Disclaimer",
      intro: "The information on this website is provided by {{legalName}} for general informational purposes only.",
      body: [
        { type: "h2", id: "not-advice", text: "Not professional advice" },
        { type: "p", text: "Articles and guides describe common plumbing situations and are not a substitute for an on-site inspection by a licensed plumber. Plumbing, gas and electrical work can be dangerous and may require permits." },
        { type: "h2", id: "safety", text: "Safety" },
        { type: "p", text: "If you smell gas, leave the building immediately and call your gas utility or 911 from a safe location. Do not attempt gas repairs yourself." },
        { type: "h2", id: "licensing", text: "Licensing, insurance and availability" },
        { type: "p", text: "{{trustFootnote}} Service areas, hours and emergency availability may change without notice." },
        { type: "h2", id: "insurance", text: "Insurance information" },
        { type: "p", text: "Any discussion of insurance coverage is general. Only your insurance provider can determine what your policy covers." },
      ],
    },
  ];
  for (const p of pages) {
    const seo = await prisma.seoMeta.create({ data: { metaTitle: p.title, metaDescription: p.intro.replace(/\{\{\w+\}\}/g, "us").slice(0, 155) } });
    await prisma.page.create({ data: { ...p, body: p.body as never, status: "PUBLISHED", isSystem: true, seoId: seo.id } });
  }
  console.log("✔ legal pages & home FAQs");
}

/** Imports the keyword sheet, then assigns keywords to the pages that already target them. */
async function seedKeywords() {
  if (!existsSync(KEYWORD_SHEET)) return console.log("ℹ keyword sheet not found — skipped");
  const owner = await prisma.user.findFirst({ where: { role: { name: "Owner" } } });
  const records = await parseKeywordFile(await readFile(KEYWORD_SHEET), path.basename(KEYWORD_SHEET));
  const imp = await importKeywords(records, path.basename(KEYWORD_SHEET), owner?.id ?? null);
  console.log(`✔ keywords imported: ${imp.createdCount} new, ${imp.updatedCount} updated, ${imp.skippedCount} skipped`);

  const assign = async (kw: string, role: "PRIMARY" | "SECONDARY", target: Record<string, unknown>) => {
    const normalized = normalizeKeyword(kw);
    const existing = await prisma.keyword.findUnique({ where: { normalized } });
    if (existing && existing.status !== "UNASSIGNED") return;
    await prisma.keyword.upsert({
      where: { normalized },
      create: { keyword: kw, normalized, role, status: "ASSIGNED", source: "page mapping", ...target },
      update: { role, status: "ASSIGNED", ...target },
    });
  };
  // Primaries first, so a page that OWNS a keyword wins over another page listing it as secondary
  const targets = [
    ...services.map((s) => ({ seo: s.seo, target: { serviceId: s.id } })),
    ...locations.map((l) => ({ seo: l.seo, target: { serviceAreaId: l.id } })),
    ...blogPosts.map((p) => ({ seo: p.seo, target: { postId: p.id } })),
  ];
  await assign("local plumbing", "PRIMARY", { isHome: true });
  for (const t of targets) await assign(t.seo.primaryKeyword, "PRIMARY", t.target);
  for (const t of targets) for (const k of t.seo.secondaryKeywords) await assign(k, "SECONDARY", t.target);
  for (const k of ["plumber", "plumbing", "plumber near me", "plumbing services near me", "local plumber", "local plumber near me", "local plumbers near me", "residential plumber", "residential plumbing repair", "trusted plumber", "plumbing companies near me", "best plumbers near me", "finding a plumber", "local plumbing service", "professional plumbers near me", "maintenance plumbing services", "plumbing estimates"]) {
    await assign(k, "SECONDARY", { isHome: true });
  }
  const counts = await prisma.keyword.groupBy({ by: ["status"], _count: true });
  console.log("✔ keyword assignments:", Object.fromEntries(counts.map((c) => [c.status, c._count])));
}

async function main() {
  await seedRbac();
  await seedAdmin();
  if (await prisma.businessInfo.findUnique({ where: { id: "default" } })) {
    console.log("ℹ content already present — skipping content seed");
  } else {
    await seedSettings();
    await seedServices();
    await seedLocations();
    await seedBlog();
    await seedPagesAndFaqs();
  }
  await seedKeywords();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
