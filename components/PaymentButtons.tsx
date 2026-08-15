"use client";

import { useState } from "react";
import { getCurrentSession } from "../lib/auth";
import { prepareInvestigationCheckout } from "../lib/investigationCheckout";
import type { PaymentIntent } from "../lib/workspace";

type PaymentButtonsProps = {
  planName: string;
  price: string;
  buttonLabel?: string;
  intakeId?: string;
  email?: string;
  onEmailResolved?: (email: string) => void;
  onPersistIntake?: (email: string) => Promise<string>;
};

export default function PaymentButtons({ buttonLabel = "Unlock Executive Report", intakeId, email = "", onEmailResolved, onPersistIntake }: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createIntent(resolvedIntakeId: string) {
    const response = await fetch("/api/checkout/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intakeId: resolvedIntakeId }),
    });
    const text = await response.text();
    let body: { intent?: PaymentIntent; reportId?: string; error?: string } = {};
    if (text.trim()) {
      try { body = JSON.parse(text); }
      catch { throw new Error(`Checkout returned an invalid response (${response.status}).`); }
    }
    if (!response.ok) throw new Error(body.error || `Checkout could not be started (${response.status}).`);
    if (!body.intent || !body.reportId) throw new Error("Checkout did not create a report.");
    return body;
  }

  async function beginUnlock() {
    if (loading) return;
    const session = getCurrentSession();
    if (!session) {
      setLoading(true);
      setError("");
      try {
        if (!onPersistIntake) throw new Error("Save the investigation before continuing.");
        await onPersistIntake(email);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The investigation could not be saved.");
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await prepareInvestigationCheckout({
        intakeId,
        email,
        authenticatedEmail: session.email,
        persistIntake: onPersistIntake || (async () => { throw new Error("Save the investigation before starting checkout."); }),
        createIntent,
      });
      onEmailResolved?.(result.email);
      window.location.assign("/workspace");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return <div className="w-full">
    <button type="button" onClick={beginUnlock} disabled={loading} className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? (intakeId ? "Opening secure payment..." : "Saving investigation...") : intakeId ? buttonLabel : "Save investigation to continue"}
    </button>
    {error && <p className="mt-3 text-sm text-red-200" role="alert">{error}</p>}
  </div>;
}
