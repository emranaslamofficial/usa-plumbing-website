import type { SiteSettings } from "@/types";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

interface Props {
  settings: SiteSettings;
  title?: string;
  text?: string;
}

export function CtaBand({
  settings,
  title = "Ready to get your plumbing fixed?",
  text = "Call now to talk to a plumber, or request service online and we'll contact you to confirm a time.",
}: Props) {
  return (
    <section aria-label="Contact us" className="py-16 sm:py-20">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-12 text-center sm:px-12 sm:py-14">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
              <p className="mt-4 text-lg text-brand-100">{text}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <CallButton phone={settings.phone} size="lg" showNumber />
                <ButtonLink href="/request-service" variant="outline-light" size="lg" arrow>
                  Request Service
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
