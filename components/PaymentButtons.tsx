"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WHATSAPP_NUMBER, PAYPAL_BUSINESS_EMAIL } from "../lib/config";
import { LEGAL_ACCEPTANCE_VERSION, generateReportId, legalAcceptanceBullets } from "../lib/legal";

type PaymentButtonsProps = {
  planName: string;
  price: string;
  buttonLabel?: string;
};

type AcceptanceRecord = {
  reportId: string;
  planName: string;
  price: string;
  method: string;
  acceptedAt: string;
  legalVersion: string;
  source: string;
};

function numericAmount(price: string) {
  const match = price.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? match[0] : "";
}

function buildPaypalHref(planName: string, price: string, reportId: string) {
  const amount = numericAmount(price);
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_BUSINESS_EMAIL,
    item_name: `ShadowScore - ${planName}`,
    currency_code: "USD",
    custom: `${reportId}|${LEGAL_ACCEPTANCE_VERSION}`,
    invoice: reportId,
  });

  if (amount) params.set("amount", amount);

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

function buildWhatsappHref(planName: string, price: string, method: string, reportId: string, acceptedAt: string) {
  const message = `Hi ShadowScore team,

I would like to continue with:
${planName} - ${price}

Preferred payment method: ${method}

Legal acceptance:
Accepted Terms and Privacy Policy: Yes
Acceptance version: ${LEGAL_ACCEPTANCE_VERSION}
Accepted at: ${acceptedAt}
Reference ID: ${reportId}

Please send me the secure payment link and next steps.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function persistAcceptance(record: AcceptanceRecord) {
  try {
    const key = "shadowscoreLegalAcceptances";
    const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
    const next = Array.isArray(existing) ? [record, ...existing].slice(0, 25) : [record];
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Local storage can be unavailable in private mode. Payment links still include the reference ID.
  }
}

export default function PaymentButtons({ planName, price, buttonLabel = "Open Checkout" }: PaymentButtonsProps) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [reportId, setReportId] = useState("");
  const [acceptedAt, setAcceptedAt] = useState("");

  const legalSummary = useMemo(() => legalAcceptanceBullets, []);

  function openCheckout() {
    setAccepted(false);
    setAcceptedAt("");
    setReportId(generateReportId());
    setOpen(true);
  }

  function handleAccept(next: boolean) {
    setAccepted(next);
    if (next) {
      const now = new Date().toISOString();
      setAcceptedAt(now);
      if (!reportId) setReportId(generateReportId());
    } else {
      setAcceptedAt("");
    }
  }

  function proceed(method: string) {
    if (!accepted) return;

    const finalAcceptedAt = acceptedAt || new Date().toISOString();
    const finalReportId = reportId || generateReportId();

    persistAcceptance({
      reportId: finalReportId,
      planName,
      price,
      method,
      acceptedAt: finalAcceptedAt,
      legalVersion: LEGAL_ACCEPTANCE_VERSION,
      source: "checkout-modal",
    });

    if (method === "PayPal") {
      openNewTab(buildPaypalHref(planName, price, finalReportId));
      return;
    }

    openNewTab(buildWhatsappHref(planName, price, method, finalReportId, finalAcceptedAt));
  }

  const whatsappHelpHref = buildWhatsappHref(planName, price, "General help before payment", reportId || "SS-PREPAYMENT", acceptedAt || "Not accepted yet");

  return (
    <>
      <button
        type="button"
        onClick={openCheckout}
        className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_0_28px_rgba(16,185,129,0.28)] transition hover:bg-emerald-400"
      >
        {buttonLabel}
      </button>

      <div className="mt-3 text-center text-xs leading-5 text-zinc-600">
        Pay by PayPal, credit card, Payoneer or bank transfer. Secure checkout options available worldwide.
      </div>

      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-5 backdrop-blur-xl">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#050505] p-6 shadow-[0_0_80px_rgba(16,185,129,0.14)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-emerald-400/30 hover:text-white"
            >
              Close
            </button>

            <div className="pr-20">
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
                Secure Checkout
              </div>
              <h3 className="mt-3 text-3xl font-black text-white">{planName}</h3>
              <div className="mt-2 text-lg font-bold text-zinc-400">{price}</div>
              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-zinc-500">
                Reference ID: {reportId || "Generating..."}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
              Choose a payment method. PayPal opens a PayPal checkout page. Card, Payoneer and bank transfer requests open WhatsApp so we can send the correct secure payment request.
            </div>

            <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-sm leading-6 text-zinc-300">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Required Legal Acceptance</div>
              <ul className="mt-4 space-y-3">
                {legalSummary.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 text-red-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/45 p-4">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => handleAccept(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black accent-red-500"
                />
                <span>
                  I have read, understood and agree to the <Link href="/terms" className="font-bold text-red-200 hover:text-white">Terms of Service</Link> and <Link href="/privacy" className="font-bold text-red-200 hover:text-white">Privacy Policy</Link> before payment.
                </span>
              </label>

              {accepted && (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  Acceptance recorded locally for reference. Accepted at: {acceptedAt || "now"}. Version: {LEGAL_ACCEPTANCE_VERSION}.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => proceed("PayPal")}
                disabled={!accepted}
                className="flex min-h-[74px] disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-sky-400 hover:shadow-[0_0_26px_rgba(56,189,248,0.22)]"
                aria-label="Pay with PayPal"
              >
                <img src="/payments/paypal-logo.png" alt="PayPal" className="h-12 max-w-[190px] object-contain" />
              </button>

              <button
                type="button"
                onClick={() => proceed("Credit Card")}
                disabled={!accepted}
                className="flex min-h-[64px] disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500 px-5 py-4 text-sm font-black text-black shadow-[0_0_22px_rgba(16,185,129,0.20)] transition hover:bg-emerald-400"
                aria-label="Pay with credit card"
              >
                <span className="mr-3 text-lg">💳</span>
                Pay With Credit Card
              </button>

              <button
                type="button"
                onClick={() => proceed("Payoneer")}
                disabled={!accepted}
                className="flex min-h-[74px] disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-orange-400 hover:shadow-[0_0_26px_rgba(249,115,22,0.22)]"
                aria-label="Pay with Payoneer"
              >
                <img src="/payments/payoneer-logo.png" alt="Payoneer" className="h-12 max-w-[215px] object-contain" />
              </button>

              <button
                type="button"
                onClick={() => proceed("Bank Transfer")}
                disabled={!accepted}
                className="flex min-h-[62px] disabled:cursor-not-allowed disabled:opacity-40 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/12 px-5 py-4 text-sm font-black text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.10)] transition hover:border-emerald-300/50 hover:bg-emerald-500/20 hover:text-white"
                aria-label="Pay by bank transfer"
              >
                <span className="mr-3 text-lg">🏦</span>
                Bank Transfer
              </button>
            </div>

            {!accepted && <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center text-xs font-bold text-zinc-500">Payments unlock only after legal acceptance.</div>}

            <button
              type="button"
              onClick={() => openNewTab(whatsappHelpHref)}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-sm font-black text-black shadow-[0_0_22px_rgba(37,211,102,0.24)] transition hover:bg-[#1ebe5d]"
            >
              <span className="text-lg">💬</span>
              Need help? Talk on WhatsApp
            </button>

            <div className="mt-5 text-center text-xs leading-6 text-zinc-600">
              ShadowScore does not guarantee marketplace outcomes, reinstatement, suspension prevention, verification approval or payment release.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
