"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { trackMarketingEvent, type MarketingEvent } from "../lib/analytics";
export function MarketingPageView({ event }: { event: MarketingEvent }) { useEffect(() => { trackMarketingEvent(event); }, [event]); return null; }
export function MarketingCta({ children, event = "start_due_diligence_clicked", className }: { children: ReactNode; event?: MarketingEvent; className: string }) { return <Link href="/intake" onClick={() => trackMarketingEvent(event)} className={className}>{children}</Link>; }
