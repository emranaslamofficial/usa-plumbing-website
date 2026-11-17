/** Single source of truth for permission keys. Seeded into the Permission table. */
export const PERMISSIONS = {
  "dashboard:view": { group: "Dashboard", description: "View dashboard and analytics" },
  "leads:read": { group: "Leads", description: "View leads and contact messages" },
  "leads:write": { group: "Leads", description: "Update lead status, notes and assignment" },
  "leads:delete": { group: "Leads", description: "Delete leads" },
  "leads:export": { group: "Leads", description: "Export leads to CSV" },
  "content:read": { group: "Content", description: "View services, areas, posts, pages, FAQs" },
  "content:write": { group: "Content", description: "Create and edit content" },
  "content:publish": { group: "Content", description: "Publish, unpublish and schedule content" },
  "content:delete": { group: "Content", description: "Delete and restore content" },
  "media:write": { group: "Media", description: "Upload and manage media" },
  "seo:write": { group: "SEO", description: "Edit SEO metadata, redirects and robots" },
  "keywords:write": { group: "SEO", description: "Import and assign keywords" },
  "settings:write": { group: "Settings", description: "Edit business info, phones, hours, navigation, footer" },
  "users:manage": { group: "Users", description: "Create, edit and deactivate users" },
  "roles:manage": { group: "Users", description: "Edit roles and permissions" },
  "audit:read": { group: "System", description: "View audit logs" },
  "system:write": { group: "System", description: "Edit system settings" },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

export const DEFAULT_ROLES: { name: string; description: string; isSystem?: boolean; permissions: PermissionKey[] }[] = [
  { name: "Owner", description: "Full access. Cannot be deleted.", isSystem: true, permissions: ALL_PERMISSIONS },
  {
    name: "Administrator",
    description: "Everything except role management",
    permissions: ALL_PERMISSIONS.filter((p) => p !== "roles:manage"),
  },
  {
    name: "Editor",
    description: "Content, media, SEO and keywords",
    permissions: ["dashboard:view", "content:read", "content:write", "content:publish", "media:write", "seo:write", "keywords:write"],
  },
  {
    name: "Dispatcher",
    description: "Works the lead inbox",
    permissions: ["dashboard:view", "leads:read", "leads:write", "leads:export"],
  },
];
