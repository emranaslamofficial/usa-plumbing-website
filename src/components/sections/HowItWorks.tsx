import { PhoneCall, ClipboardCheck, Wrench, ThumbsUp } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

const STEPS = [
  { icon: PhoneCall, title: "Call or request service", text: "Tell us what's happening. We'll ask a few questions and help with immediate steps if needed." },
  { icon: ClipboardCheck, title: "Diagnosis & clear pricing", text: "A plumber inspects the problem, explains the options and confirms the price before starting." },
  { icon: Wrench, title: "The repair, done right", text: "Work is completed to code with quality parts, and we protect your home while we work." },
  { icon: ThumbsUp, title: "Clean up & walkthrough", text: "We clean the work area, test everything and explain what we did and how to prevent repeats." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-ink-50 py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="how-heading" eyebrow="How it works" title="Simple from the first call to the final walkthrough" align="center" />
        <RevealGroup as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <RevealItem as="li" key={s.title} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
              <span className="font-display text-sm font-extrabold text-brand-300">0{i + 1}</span>
              <s.icon aria-hidden="true" className="mt-3 size-8 text-brand-600" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{s.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
