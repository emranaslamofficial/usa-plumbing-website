import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCtaBar } from "@/components/layout/MobileCtaBar";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Tracking } from "@/components/analytics/Tracking";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.businessName} | Plumbing Services in ${s.serviceAreaLabel}`, template: `%s | ${s.businessName}` },
    description: s.shortDescription,
    applicationName: s.businessName,
    openGraph: { siteName: s.businessName, locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: true },
    ...(s.favicon ? { icons: { icon: s.favicon, apple: s.favicon } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, services, locations] = await Promise.all([api.getSiteSettings(), api.listServices(), api.listLocations()]);
  const hoursSummary = `${settings.hours[0]?.label} ${settings.hours[0]?.value}${settings.emergency.available ? ` · ${settings.emergency.shortLabel}` : ""}`;

  return (
    <html lang="en-US" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <a
          href="#main"
          className="sr-only z-[100] rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <MotionProvider>
          <TopBar settings={settings} />
          <Header
            businessName={settings.businessName}
            phone={settings.phone}
            services={services}
            emergencyLabel={settings.emergency.available ? settings.emergency.shortLabel : undefined}
            hoursSummary={hoursSummary}
            nav={settings.navigation.header}
            logo={settings.logo}
          />
          <main id="main">{children}</main>
          <Footer settings={settings} services={services} locations={locations} />
          <MobileCtaBar phone={settings.phone} />
        </MotionProvider>
        <Tracking />
        {/* Optional third-party scripts — configured in Admin → System, loaded after the page is interactive */}
        {settings.analytics?.gtmId && (
          <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(settings.analytics.gtmId)});`}</Script>
        )}
        {settings.analytics?.ga4MeasurementId && !settings.analytics.gtmId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.analytics.ga4MeasurementId)}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(settings.analytics.ga4MeasurementId)});`}</Script>
          </>
        )}
        {settings.callTracking?.scriptUrl?.startsWith("https://") && <Script src={settings.callTracking.scriptUrl} strategy="lazyOnload" />}
      </body>
    </html>
  );
}
