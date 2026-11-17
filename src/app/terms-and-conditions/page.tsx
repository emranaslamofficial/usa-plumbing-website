import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata, seoOverrides } from "@/lib/seo";
import { CmsPageView } from "@/components/sections/CmsPageView";
import { LegalPage } from "@/components/sections/LegalPage";

const fallbackMetadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for using this website and requesting plumbing services.",
  path: "/terms-and-conditions",
});

/** Content is edited in Admin → Pages; the template below is the fallback when no CMS page is published. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await api.getPage("terms-and-conditions");
  return page ? pageMetadata({ title: page.seo.metaTitle, description: page.seo.metaDescription, path: "/terms-and-conditions", ...seoOverrides(page.seo) }) : fallbackMetadata;
}

export default async function TermsPage() {
  const page = await api.getPage("terms-and-conditions");
  if (page) return <CmsPageView page={page} path="/terms-and-conditions" />;
  const s = await api.getSiteSettings();
  return (
    <LegalPage
      title="Terms & Conditions"
      path="/terms-and-conditions"
      updated="November 16, 2026"
      intro={`By using this website, you agree to these Terms & Conditions. If you do not agree, please do not use the site. These terms apply to ${s.legalName}.`}
      sections={[
        {
          heading: "Use of this website",
          body: <p>This website provides general information about our plumbing services. You agree to use it only for lawful purposes and not to interfere with its operation.</p>,
        },
        {
          heading: "Service requests",
          body: (
            <p>
              Submitting a service request does not guarantee an appointment. Appointments are confirmed when we contact you. Service availability,
              arrival times and pricing depend on location, scheduling and the nature of the work, and are confirmed before work begins.
            </p>
          ),
        },
        {
          heading: "Estimates and pricing",
          body: <p>Any estimate is based on the information available at the time. If conditions differ once work begins, we will explain any change and obtain your approval before proceeding.</p>,
        },
        {
          heading: "Warranties",
          body: <p>Warranty terms for parts and labor, if any, are provided in writing with your invoice. Manufacturer warranties are governed by the manufacturer&apos;s terms.</p>,
        },
        {
          heading: "Limitation of liability",
          body: <p>To the extent permitted by law, we are not liable for indirect or consequential damages arising from use of this website or reliance on its general information.</p>,
        },
        {
          heading: "Changes to these terms",
          body: <p>We may update these terms from time to time. The &quot;Last updated&quot; date above shows when they were last revised.</p>,
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms? Contact {s.legalName} at {s.email} or {s.phone.display}.
            </p>
          ),
        },
      ]}
    />
  );
}
