import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata, seoOverrides } from "@/lib/seo";
import { CmsPageView } from "@/components/sections/CmsPageView";
import { LegalPage } from "@/components/sections/LegalPage";

const fallbackMetadata: Metadata = pageMetadata({
  title: "Disclaimer",
  description: "Important information about the general nature of the content on this website.",
  path: "/disclaimer",
});

/** Content is edited in Admin → Pages; the template below is the fallback when no CMS page is published. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await api.getPage("disclaimer");
  return page ? pageMetadata({ title: page.seo.metaTitle, description: page.seo.metaDescription, path: "/disclaimer", ...seoOverrides(page.seo) }) : fallbackMetadata;
}

export default async function DisclaimerPage() {
  const page = await api.getPage("disclaimer");
  if (page) return <CmsPageView page={page} path="/disclaimer" />;
  const s = await api.getSiteSettings();
  return (
    <LegalPage
      title="Disclaimer"
      path="/disclaimer"
      updated="November 16, 2026"
      intro={`The information on this website is provided by ${s.legalName} for general informational purposes only.`}
      sections={[
        {
          heading: "Not professional advice",
          body: (
            <p>
              Articles and guides describe common plumbing situations and are not a substitute for an on-site inspection by a licensed plumber.
              Plumbing, gas and electrical work can be dangerous and may require permits. If you are unsure, contact a qualified professional.
            </p>
          ),
        },
        {
          heading: "Safety",
          body: <p>If you smell gas, leave the building immediately and call your gas utility or 911 from a safe location. Do not attempt gas repairs yourself.</p>,
        },
        {
          heading: "Licensing, insurance and availability",
          body: <p>{s.trustFootnote.replace(/^\*/, "")} Service areas, hours and emergency availability may change without notice.</p>,
        },
        {
          heading: "Insurance information",
          body: <p>Any discussion of insurance coverage is general. Only your insurance provider can determine what your policy covers.</p>,
        },
        {
          heading: "External links",
          body: <p>Links to third-party websites are provided for convenience. We are not responsible for their content or practices.</p>,
        },
      ]}
    />
  );
}
