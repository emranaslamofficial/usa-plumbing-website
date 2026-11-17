import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata, seoOverrides } from "@/lib/seo";
import { CmsPageView } from "@/components/sections/CmsPageView";
import { LegalPage } from "@/components/sections/LegalPage";

const fallbackMetadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How we collect, use and protect the personal information you share with us.",
  path: "/privacy-policy",
});

/** Content is edited in Admin → Pages; the template below is the fallback when no CMS page is published. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await api.getPage("privacy-policy");
  return page ? pageMetadata({ title: page.seo.metaTitle, description: page.seo.metaDescription, path: "/privacy-policy", ...seoOverrides(page.seo) }) : fallbackMetadata;
}

export default async function PrivacyPage() {
  const page = await api.getPage("privacy-policy");
  if (page) return <CmsPageView page={page} path="/privacy-policy" />;
  const s = await api.getSiteSettings();
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy-policy"
      updated="November 16, 2026"
      intro={`This Privacy Policy explains how ${s.legalName} ("we", "us") collects, uses and protects information when you visit this website or request our services.`}
      sections={[
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li>Information you provide: name, phone number, email address, ZIP code, service details and messages submitted through our forms or by phone.</li>
              <li>Technical information: browser type, device, pages visited and referring pages, collected through server logs and, if enabled, analytics tools.</li>
            </ul>
          ),
        },
        {
          heading: "How we use information",
          body: (
            <ul>
              <li>To respond to service requests, schedule appointments and provide plumbing services.</li>
              <li>To communicate with you about your request by phone, text message or email.</li>
              <li>To improve our website and services.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          ),
        },
        {
          heading: "Sharing of information",
          body: (
            <p>
              We do not sell your personal information. We may share information with service providers who help us operate our business (such as
              scheduling, hosting or communication tools), only as needed to provide our services, or when required by law.
            </p>
          ),
        },
        {
          heading: "Cookies and analytics",
          body: (
            <p>
              We may use cookies and similar technologies to understand how visitors use the site. You can control cookies through your browser
              settings. If we use third-party analytics or advertising tools, they are described here.
            </p>
          ),
        },
        {
          heading: "Data security and retention",
          body: <p>We use reasonable safeguards to protect your information and keep it only as long as needed for the purposes described above or as required by law.</p>,
        },
        {
          heading: "Your choices and rights",
          body: (
            <p>
              Depending on where you live, you may have rights to access, correct or delete your personal information. To make a request, contact
              us at {s.email} or {s.phone.display}.
            </p>
          ),
        },
        {
          heading: "Contact us",
          body: (
            <p>
              {s.legalName}, {s.address.street}, {s.address.city}, {s.address.region} {s.address.postalCode}. Email: {s.email}. Phone: {s.phone.display}.
            </p>
          ),
        },
      ]}
    />
  );
}
