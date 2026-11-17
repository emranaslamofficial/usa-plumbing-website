"use client";

import { m, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article";
}

/** Fades + slides content up once when it scrolls into view. */
export function Reveal({ children, className, delay = 0, y = 18, as = "div" }: RevealProps) {
  const Cmp = m[as];
  return (
    <Cmp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </Cmp>
  );
}

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Container that staggers its <RevealItem> children. */
export function RevealGroup({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const Cmp = m[as];
  return (
    <Cmp className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -60px 0px" }}>
      {children}
    </Cmp>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Cmp = m[as];
  return (
    <Cmp className={className} variants={item}>
      {children}
    </Cmp>
  );
}
