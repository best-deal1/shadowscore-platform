"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession } from "../lib/auth";
import { createCheckoutIntent, reportIdForPayment } from "../lib/workspace";

type PaymentButtonsProps = { planName: string; price: string; buttonLabel?: string; intakeId?: string };

export default function PaymentButtons({ planName, price, buttonLabel = "Unlock Full Report", intakeId }: PaymentButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function beginUnlock() {
    if (!intakeId || loading) return;
    const session = getCurrentSession();
    if (!session) {
      const returnTo = `/intake?resume=${encodeURIComponent(intakeId)}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const intent = await createCheckoutIntent(session, { planName, price, method: "PayPal", intakeId });
      router.push(`/reports/${reportIdForPayment(intent.id)}/unlock`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return <div className="w-full">
    <button type="button" onClick={beginUnlock} disabled={!intakeId || loading} className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? "Opening secure payment..." : intakeId ? buttonLabel : "Save investigation to continue"}
    </button>
    {error && <p className="mt-3 text-sm text-red-200" role="alert">{error}</p>}
  </div>;
}
