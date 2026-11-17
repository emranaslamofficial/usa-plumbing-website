import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ResourcePage } from "../components/ResourcePage";
import { Badge, PageHeader, Tabs } from "../components/ui";

const yes = (v: unknown) => (v ? "Yes" : "—");

export function CategoriesPage() {
  const [tab, setTab] = useState<"service" | "blog">("service");
  const common = [
    { name: "name", label: "Name", type: "text" as const, required: true },
    { name: "slug", label: "Slug", type: "text" as const, hint: "Leave blank to generate from the name" },
    { name: "description", label: "Description", type: "textarea" as const },
    { name: "sortOrder", label: "Sort order", type: "number" as const },
  ];
  return (
    <div>
      <PageHeader title="Categories" description="Group services and blog articles." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "service", label: "Service categories" }, { value: "blog", label: "Blog categories" }]} />
      {tab === "service" ? (
        <ResourcePage key="s" embedded title="Service categories" endpoint="/admin/service-categories" writePerm="content:write" fields={common} defaults={{ sortOrder: 0 }}
          columns={[{ label: "Name", render: (r) => <span className="font-medium">{r.name}</span> }, { label: "Slug", render: (r) => r.slug }, { label: "Services", render: (r) => r._count?.services }]}
          toBody={(v) => ({ name: v.name, slug: v.slug || undefined, description: v.description || null, sortOrder: v.sortOrder ?? 0 })} />
      ) : (
        <ResourcePage key="b" embedded title="Blog categories" endpoint="/admin/blog-categories" writePerm="content:write" fields={common} defaults={{ sortOrder: 0, description: "" }}
          columns={[{ label: "Name", render: (r) => <span className="font-medium">{r.name}</span> }, { label: "Slug", render: (r) => `/blog?category=${r.slug}` }, { label: "Posts", render: (r) => r._count?.posts }]}
          toBody={(v) => ({ name: v.name, slug: v.slug || undefined, description: v.description ?? "", sortOrder: v.sortOrder ?? 0 })} />
      )}
    </div>
  );
}

export const TagsPage = () => (
  <ResourcePage title="Tags" description="Tags are also created automatically when you type them in the blog editor." endpoint="/admin/tags" writePerm="content:write"
    fields={[{ name: "name", label: "Name", type: "text", required: true }, { name: "slug", label: "Slug", type: "text" }]}
    columns={[{ label: "Tag", render: (r) => <span className="font-medium">{r.name}</span> }, { label: "Slug", render: (r) => r.slug }, { label: "Posts", render: (r) => r._count?.posts }]}
    toBody={(v) => ({ name: v.name, slug: v.slug || undefined })} />
);

export const AuthorsPage = () => (
  <ResourcePage title="Authors" description="Shown as the byline on articles. Use real people or a team name — never invented experts." endpoint="/admin/authors" writePerm="content:write"
    fields={[
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role / credentials", type: "text", hint: "e.g. Master Plumber, License #12345" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "avatarId", label: "Photo", type: "media" },
    ]}
    columns={[{ label: "Name", render: (r) => <span className="font-medium">{r.name}</span> }, { label: "Role", render: (r) => r.role }, { label: "Posts", render: (r) => r._count?.posts }]}
    toBody={(v) => ({ name: v.name, role: v.role ?? "", bio: v.bio ?? "", avatarId: v.avatarId ?? null })} />
);

export function FaqsPage() {
  return (
    <ResourcePage title="FAQs" description="Group FAQs (e.g. “home” shows on the homepage). FAQs for a specific service, area, article or page are edited inside that editor." endpoint="/admin/faqs" writePerm="content:write"
      defaults={{ group: "home", isActive: true, sortOrder: 0 }}
      fields={[
        { name: "question", label: "Question", type: "text", required: true },
        { name: "answer", label: "Answer", type: "textarea", hint: "Links: [text](/path)" },
        { name: "group", label: "Group", type: "text", hint: "e.g. home" },
        { name: "sortOrder", label: "Sort order", type: "number" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { label: "Question", render: (r) => <span className="font-medium">{r.question}</span> },
        { label: "Shown on", render: (r) => r.group ? `Group: ${r.group}` : r.service ? `Service: ${r.service.name}` : r.serviceArea ? `Area: ${r.serviceArea.slug}` : r.post ? `Post: ${r.post.title}` : r.page ? `Page: ${r.page.title}` : "—" },
        { label: "Active", render: (r) => yes(r.isActive) },
      ]}
      toForm={(r) => ({ question: r.question, answer: r.answer, group: r.group, sortOrder: r.sortOrder, isActive: r.isActive })}
      toBody={(v) => ({ question: v.question, answer: v.answer, group: v.group || null, sortOrder: v.sortOrder ?? 0, isActive: Boolean(v.isActive) })} />
  );
}

export function TestimonialsPage() {
  const { data: services } = useQuery({ queryKey: ["/admin/services", "active"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/services") });
  return (
    <ResourcePage title="Testimonials" description={<>Only add <strong>real reviews from real customers</strong>. A review must be marked verified before it can be published — fabricated reviews violate FTC rules.</>} endpoint="/admin/testimonials" writePerm="content:write"
      defaults={{ isVerified: false, isPublished: false, sortOrder: 0 }}
      fields={[
        { name: "authorName", label: "Customer name", type: "text", required: true, hint: "First name + last initial is common" },
        { name: "location", label: "Location", type: "text" },
        { name: "rating", label: "Rating (1–5)", type: "number" },
        { name: "body", label: "Review text", type: "textarea" },
        { name: "source", label: "Source", type: "text", placeholder: "Google, Yelp…" },
        { name: "sourceUrl", label: "Link to original review", type: "url" },
        { name: "serviceId", label: "Service", type: "select", nullable: true, options: (services ?? []).map((s) => ({ value: s.id, label: s.name })) },
        { name: "receivedAt", label: "Review date", type: "date" },
        { name: "isVerified", label: "Verified genuine", type: "checkbox", hint: "I confirm this is a real review from a real customer." },
        { name: "isPublished", label: "Published on website", type: "checkbox" },
      ]}
      columns={[
        { label: "Customer", render: (r) => <span className="font-medium">{r.authorName}</span> },
        { label: "Review", render: (r) => <span className="line-clamp-2 max-w-md text-xs">{r.body}</span> },
        { label: "Rating", render: (r) => (r.rating ? "★".repeat(r.rating) : "—") },
        { label: "Status", render: (r) => r.isPublished ? <Badge tone="PUBLISHED">Published</Badge> : r.isVerified ? <Badge tone="SECONDARY">Verified</Badge> : <Badge tone="DRAFT">Unverified</Badge> },
      ]}
      toForm={(r) => { const { id: _i, createdAt: _c, updatedAt: _u, service: _s, ...rest } = r; return rest; }}
      toBody={(v) => ({ ...v, rating: v.rating ? Number(v.rating) : null, receivedAt: v.receivedAt || null, sourceUrl: v.sourceUrl || null })} />
  );
}

export const RedirectsPage = () => (
  <ResourcePage title="Redirects" description="Send old URLs to new ones (301 = permanent). The website applies these before rendering pages." endpoint="/admin/redirects" writePerm="seo:write" createLabel="Add redirect"
    defaults={{ statusCode: "301", isActive: true }}
    fields={[
      { name: "source", label: "From path", type: "text", required: true, placeholder: "/old-page" },
      { name: "destination", label: "To", type: "text", required: true, placeholder: "/new-page or https://…" },
      { name: "statusCode", label: "Type", type: "select", options: [{ value: "301", label: "301 Permanent" }, { value: "302", label: "302 Temporary" }, { value: "308", label: "308 Permanent (keep method)" }, { value: "307", label: "307 Temporary (keep method)" }] },
      { name: "note", label: "Note", type: "text" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ]}
    columns={[{ label: "From", render: (r) => <code className="text-xs">{r.source}</code> }, { label: "To", render: (r) => <code className="text-xs">{r.destination}</code> }, { label: "Type", render: (r) => r.statusCode }, { label: "Hits", render: (r) => r.hits }, { label: "Active", render: (r) => yes(r.isActive) }]}
    toForm={(r) => ({ source: r.source, destination: r.destination, statusCode: String(r.statusCode), note: r.note, isActive: r.isActive })}
    toBody={(v) => ({ source: v.source, destination: v.destination, statusCode: Number(v.statusCode), note: v.note || null, isActive: Boolean(v.isActive) })} />
);

export const PhonesPage = () => (
  <ResourcePage title="Phone numbers" description="The primary number powers every “Call Now” button and the tel: links on the website." endpoint="/admin/settings/phones" writePerm="settings:write" createLabel="Add number"
    defaults={{ type: "MAIN", isPrimary: false, isActive: true, sortOrder: 0 }}
    fields={[
      { name: "label", label: "Label", type: "text", required: true, placeholder: "Main line" },
      { name: "display", label: "Display format", type: "text", required: true, placeholder: "(555) 555-0123" },
      { name: "e164", label: "Dialing format (E.164)", type: "text", required: true, placeholder: "+15555550123" },
      { name: "type", label: "Type", type: "select", options: ["MAIN", "EMERGENCY", "TRACKING", "SMS"].map((v) => ({ value: v, label: v.toLowerCase() })) },
      { name: "isPrimary", label: "Primary (used for Call Now buttons)", type: "checkbox" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ]}
    columns={[{ label: "Label", render: (r) => <span className="font-medium">{r.label}</span> }, { label: "Number", render: (r) => r.display }, { label: "Dial", render: (r) => <code className="text-xs">{r.e164}</code> }, { label: "Type", render: (r) => r.type.toLowerCase() }, { label: "Primary", render: (r) => (r.isPrimary ? <Badge tone="PUBLISHED">Primary</Badge> : "—") }]}
    toForm={(r) => ({ label: r.label, display: r.display, e164: r.e164, type: r.type, isPrimary: r.isPrimary, isActive: r.isActive, sortOrder: r.sortOrder })} />
);

export const TrustBadgesPage = () => (
  <ResourcePage title="Trust badges" description="Only list claims you can verify. Badges marked “needs footnote” get an asterisk linked to the trust footnote (Business Info)." endpoint="/admin/settings/trust-badges" writePerm="settings:write"
    defaults={{ icon: "shield", requiresFootnote: false, isActive: true, sortOrder: 0 }}
    fields={[
      { name: "label", label: "Label", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon", type: "select", options: ["shield", "users", "clock", "building", "receipt", "home", "wrench"].map((v) => ({ value: v, label: v })) },
      { name: "requiresFootnote", label: "Needs footnote (*)", type: "checkbox" },
      { name: "isActive", label: "Active", type: "checkbox" },
      { name: "sortOrder", label: "Sort order", type: "number" },
    ]}
    columns={[{ label: "Badge", render: (r) => <span className="font-medium">{r.label}{r.requiresFootnote && "*"}</span> }, { label: "Description", render: (r) => <span className="text-xs">{r.description}</span> }, { label: "Active", render: (r) => yes(r.isActive) }]}
    toForm={(r) => ({ label: r.label, description: r.description, icon: r.icon, requiresFootnote: r.requiresFootnote, isActive: r.isActive, sortOrder: r.sortOrder })} />
);

export function NavigationPage() {
  const [loc, setLoc] = useState<"HEADER" | "FOOTER_QUICK_LINKS" | "FOOTER_LEGAL">("HEADER");
  return (
    <div>
      <PageHeader title="Navigation" description="The Services menu is generated from published services automatically. Links here appear after it." />
      <Tabs value={loc} onChange={setLoc} tabs={[{ value: "HEADER", label: "Header menu" }, { value: "FOOTER_QUICK_LINKS", label: "Footer quick links" }, { value: "FOOTER_LEGAL", label: "Footer legal links" }]} />
      <ResourcePage key={loc} embedded title="Links" endpoint="/admin/settings/navigation" query={{ location: loc }} writePerm="settings:write" createLabel="Add link"
        defaults={{ location: loc, isActive: true, sortOrder: 0 }}
        fields={[
          { name: "label", label: "Label", type: "text", required: true },
          { name: "href", label: "Link", type: "text", required: true, placeholder: "/about or https://…" },
          { name: "sortOrder", label: "Order", type: "number" },
          { name: "isActive", label: "Visible", type: "checkbox" },
        ]}
        columns={[{ label: "Order", render: (r) => r.sortOrder }, { label: "Label", render: (r) => <span className="font-medium">{r.label}</span> }, { label: "Link", render: (r) => <code className="text-xs">{r.href}</code> }, { label: "Visible", render: (r) => yes(r.isActive) }]}
        toForm={(r) => ({ location: r.location, label: r.label, href: r.href, sortOrder: r.sortOrder, isActive: r.isActive })} />
    </div>
  );
}

export const SocialPage = () => (
  <ResourcePage title="Social links" description="Shown in the footer and added to the business schema (sameAs)." endpoint="/admin/settings/social-links" writePerm="settings:write"
    defaults={{ platform: "google", isActive: true, sortOrder: 0 }}
    fields={[
      { name: "platform", label: "Platform", type: "select", options: ["google", "facebook", "instagram", "yelp", "nextdoor", "linkedin", "youtube", "x", "tiktok", "bbb"].map((v) => ({ value: v, label: v })) },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "url", label: "Profile URL", type: "url", required: true, placeholder: "https://" },
      { name: "isActive", label: "Visible", type: "checkbox" },
      { name: "sortOrder", label: "Order", type: "number" },
    ]}
    columns={[{ label: "Platform", render: (r) => r.platform }, { label: "Label", render: (r) => <span className="font-medium">{r.label}</span> }, { label: "URL", render: (r) => <span className="text-xs">{r.url}</span> }, { label: "Visible", render: (r) => yes(r.isActive) }]}
    toForm={(r) => ({ platform: r.platform, label: r.label, url: r.url, isActive: r.isActive, sortOrder: r.sortOrder })} />
);
