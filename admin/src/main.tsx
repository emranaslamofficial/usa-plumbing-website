import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { Spinner, ToastProvider } from "./components/ui";
import { Layout } from "./components/Layout";
import { Login, ForgotPassword, ResetPassword } from "./pages/Login";
import { Dashboard, AnalyticsPage } from "./pages/Dashboard";
import { LeadsPage, LeadDetailPage } from "./pages/Leads";
import { ServicesList, ServiceEditor, AreasList, AreaEditor } from "./pages/Services";
import { PostsList, PostEditor, PagesList, PageEditor } from "./pages/Posts";
import { KeywordsPage, SeoOverview, MediaLibrary } from "./pages/Seo";
import { BusinessSettings, HoursSettings, FooterSettingsPage, SystemSettings, UsersPage, RolesPage, AuditLogPage, AccountPage } from "./pages/Settings";
import { CategoriesPage, TagsPage, AuthorsPage, FaqsPage, TestimonialsPage, RedirectsPage, PhonesPage, TrustBadgesPage, NavigationPage, SocialPage } from "./pages/Resources";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } } });

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking session…" />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

/** Hides a page from roles that lack the permission (the API enforces it regardless). */
function Perm({ p, children }: { p: string; children: ReactNode }) {
  const { can } = useAuth();
  return can(p) ? <>{children}</> : <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">You don't have permission to view this page.</div>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename="/admin">
            <Routes>
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<Protected><Layout /></Protected>}>
                <Route index element={<Perm p="dashboard:view"><Dashboard /></Perm>} />
                <Route path="analytics" element={<Perm p="dashboard:view"><AnalyticsPage /></Perm>} />
                <Route path="leads" element={<Perm p="leads:read"><LeadsPage /></Perm>} />
                <Route path="leads/:id" element={<Perm p="leads:read"><LeadDetailPage /></Perm>} />
                <Route path="services" element={<Perm p="content:read"><ServicesList /></Perm>} />
                <Route path="services/:id" element={<Perm p="content:read"><ServiceEditor /></Perm>} />
                <Route path="service-areas" element={<Perm p="content:read"><AreasList /></Perm>} />
                <Route path="service-areas/:id" element={<Perm p="content:read"><AreaEditor /></Perm>} />
                <Route path="posts" element={<Perm p="content:read"><PostsList /></Perm>} />
                <Route path="posts/:id" element={<Perm p="content:read"><PostEditor /></Perm>} />
                <Route path="pages" element={<Perm p="content:read"><PagesList /></Perm>} />
                <Route path="pages/:id" element={<Perm p="content:read"><PageEditor /></Perm>} />
                <Route path="categories" element={<Perm p="content:read"><CategoriesPage /></Perm>} />
                <Route path="tags" element={<Perm p="content:read"><TagsPage /></Perm>} />
                <Route path="authors" element={<Perm p="content:read"><AuthorsPage /></Perm>} />
                <Route path="faqs" element={<Perm p="content:read"><FaqsPage /></Perm>} />
                <Route path="testimonials" element={<Perm p="content:read"><TestimonialsPage /></Perm>} />
                <Route path="media" element={<Perm p="content:read"><MediaLibrary /></Perm>} />
                <Route path="seo" element={<Perm p="content:read"><SeoOverview /></Perm>} />
                <Route path="keywords" element={<Perm p="content:read"><KeywordsPage /></Perm>} />
                <Route path="redirects" element={<Perm p="seo:write"><RedirectsPage /></Perm>} />
                <Route path="settings/business" element={<Perm p="settings:write"><BusinessSettings /></Perm>} />
                <Route path="settings/phones" element={<Perm p="settings:write"><PhonesPage /></Perm>} />
                <Route path="settings/hours" element={<Perm p="settings:write"><HoursSettings /></Perm>} />
                <Route path="settings/trust" element={<Perm p="settings:write"><TrustBadgesPage /></Perm>} />
                <Route path="settings/navigation" element={<Perm p="settings:write"><NavigationPage /></Perm>} />
                <Route path="settings/footer" element={<Perm p="settings:write"><FooterSettingsPage /></Perm>} />
                <Route path="settings/social" element={<Perm p="settings:write"><SocialPage /></Perm>} />
                <Route path="settings/system" element={<Perm p="system:write"><SystemSettings /></Perm>} />
                <Route path="users" element={<Perm p="users:manage"><UsersPage /></Perm>} />
                <Route path="roles" element={<Perm p="users:manage"><RolesPage /></Perm>} />
                <Route path="audit-logs" element={<Perm p="audit:read"><AuditLogPage /></Perm>} />
                <Route path="account" element={<AccountPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
