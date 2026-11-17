import type { Faq, SiteSettings } from "@/types";

/**
 * PLACEHOLDER BUSINESS DATA — every value here must be replaced with the real,
 * verified business information before launch. In Phase 2 this object is served by
 * GET /api/v1/settings and edited from the admin panel.
 *
 * 555-01xx numbers are reserved for fictional use and will not reach a real person.
 */
export const siteSettings: SiteSettings = {
  businessName: "ClearFlow Plumbing",
  legalName: "ClearFlow Plumbing LLC",
  tagline: "Plumbing done right, the first time.",
  shortDescription:
    "Residential and commercial plumbing repair, drain cleaning, water heater service and emergency plumbing for homeowners and businesses.",
  phone: { display: "(555) 555-0123", e164: "+15555550123" },
  email: "service@example.com",
  address: {
    street: "123 Main Street, Suite 100",
    city: "Houston",
    region: "TX",
    postalCode: "77002",
    country: "US",
  },
  serviceAreaLabel: "Houston, Dallas & Austin",
  hours: [
    { label: "Mon – Fri", value: "7:00 AM – 7:00 PM" },
    { label: "Saturday", value: "8:00 AM – 5:00 PM" },
    { label: "Sunday", value: "Emergency calls only" },
  ],
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "19:00" },
    { days: ["Saturday"], opens: "08:00", closes: "17:00" },
  ],
  // Set `available: false` if the business does not offer after-hours emergency service.
  emergency: { available: true, label: "24/7 Emergency Plumbing", shortLabel: "24/7 Emergency" },
  licenseNumber: "[LICENSE #]",
  trustBadges: [
    {
      id: "licensed",
      label: "Licensed & Insured",
      description: "State-licensed plumbers with liability coverage on every job.",
      icon: "shield",
      requiresFootnote: true,
    },
    {
      id: "experienced",
      label: "Experienced Professionals",
      description: "Trained technicians who handle residential and commercial systems.",
      icon: "users",
      requiresFootnote: true,
    },
    {
      id: "response",
      label: "Fast Response",
      description: "Same-day appointments when available and priority emergency dispatch.",
      icon: "clock",
      requiresFootnote: true,
    },
    {
      id: "res-com",
      label: "Residential & Commercial",
      description: "From single-family homes to restaurants, offices and multi-unit properties.",
      icon: "building",
      requiresFootnote: false,
    },
    {
      id: "transparent",
      label: "Transparent Service",
      description: "Clear explanation of the problem and written pricing before work begins.",
      icon: "receipt",
      requiresFootnote: false,
    },
  ],
  trustFootnote:
    "*License #[LICENSE #]. Licensing, insurance and response times vary by location and availability. Contact us for details.",
  social: [
    { platform: "google", label: "Google", url: "https://www.google.com/maps" },
    { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/" },
    { platform: "yelp", label: "Yelp", url: "https://www.yelp.com/" },
    { platform: "nextdoor", label: "Nextdoor", url: "https://nextdoor.com/" },
  ],
  priceRange: "$$",
  navigation: {
    header: [
      { label: "Emergency Plumbing", href: "/emergency-plumbing" },
      { label: "Service Areas", href: "/service-areas" },
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    quickLinks: [
      { label: "Request Service", href: "/request-service" },
      { label: "Emergency Plumbing", href: "/emergency-plumbing" },
      { label: "About Us", href: "/about" },
      { label: "Plumbing Tips & Guides", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
  footer: { showServices: true, servicesLimit: 10, showServiceAreas: true, showHours: true },
};

/** Homepage FAQs ("home" group). Managed under Admin → FAQs in Phase 2. */
export const homeFaqs: Faq[] = [
  {
    question: "Do you offer residential and commercial plumbing?",
    answer:
      "Yes. We work in single-family homes, condos and apartments as well as restaurants, offices, retail spaces and multi-unit properties. See [commercial plumbing](/services/commercial-plumbing) for business services.",
  },
  {
    question: "How quickly can a plumber get to me?",
    answer:
      "It depends on your location and the schedule that day. Call us and we'll give you a realistic arrival window. Emergencies like burst pipes and sewer backups are prioritized.",
  },
  {
    question: "Will I know the price before work starts?",
    answer: "Yes. Your plumber diagnoses the problem, explains your options and confirms the price in writing before beginning any work.",
  },
  {
    question: "What areas do you serve?",
    answer: "See our [service areas](/service-areas) page for the cities and communities we cover. If you don't see yours, give us a call.",
  },
];
