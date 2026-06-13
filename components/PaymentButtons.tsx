"use client";

import { useState } from "react";
import { WHATSAPP_NUMBER, PAYPAL_BUSINESS_EMAIL } from "../lib/config";

type PaymentButtonsProps = {
  planName: string;
  price: string;
  buttonLabel?: string;
};


function numericAmount(price: string) {
  const match = price.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? match[0] : "";
}

function buildPaypalHref(planName: string, price: string) {
  const amount = numericAmount(price);
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_BUSINESS_EMAIL,
    item_name: `ShadowScore - ${planName}`,
    currency_code: "USD",
  });

  if (amount) params.set("amount", amount);

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

function buildWhatsappHref(planName: string, price: string, method: string) {
  const message = `Hi ShadowScore team,

I would like to continue with:
${planName} - ${price}

Preferred payment method: ${method}

Please send me the secure payment link and next steps.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function PaymentButtons({ planName, price, buttonLabel = "Open Checkout" }: PaymentButtonsProps) {
  const [open, setOpen] = useState(false);

  const paypalHref = buildPaypalHref(planName, price);
  const cardHref = buildWhatsappHref(planName, price, "Credit Card");
  const payoneerHref = buildWhatsappHref(planName, price, "Payoneer");
  const bankHref = buildWhatsappHref(planName, price, "Bank Transfer");
  const whatsappHref = buildWhatsappHref(planName, price, "General help");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_0_28px_rgba(16,185,129,0.28)] transition hover:bg-emerald-400"
      >
        {buttonLabel}
      </button>

      <div className="mt-3 text-center text-xs leading-5 text-zinc-600">
        Pay by PayPal, credit card, Payoneer or bank transfer.
      </div>

      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-5 backdrop-blur-xl">
          <div className="relative w-full max-w-xl rounded-[30px] border border-white/10 bg-[#050505] p-6 shadow-[0_0_80px_rgba(16,185,129,0.14)]">
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
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
              Choose a payment method. PayPal opens a real PayPal payment page. Other payment methods open WhatsApp so we can send the correct secure payment request.
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => openNewTab(paypalHref)}
                className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-sky-400 hover:shadow-[0_0_26px_rgba(56,189,248,0.22)]"
                aria-label="Pay with PayPal"
              >
                <img src="/payments/paypal-logo.png" alt="PayPal" className="h-12 max-w-[190px] object-contain" />
              </button>

              <button
                type="button"
                onClick={() => openNewTab(cardHref)}
                className="flex min-h-[64px] items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500 px-5 py-4 text-sm font-black text-black shadow-[0_0_22px_rgba(16,185,129,0.20)] transition hover:bg-emerald-400"
                aria-label="Pay with credit card"
              >
                <span className="mr-3 text-lg">💳</span>
                Pay With Credit Card
              </button>

              <button
                type="button"
                onClick={() => openNewTab(payoneerHref)}
                className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-orange-400 hover:shadow-[0_0_26px_rgba(249,115,22,0.22)]"
                aria-label="Pay with Payoneer"
              >
                <img src="/payments/payoneer-logo.png" alt="Payoneer" className="h-12 max-w-[215px] object-contain" />
              </button>

              <button
                type="button"
                onClick={() => openNewTab(bankHref)}
                className="flex min-h-[62px] items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/12 px-5 py-4 text-sm font-black text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.10)] transition hover:border-emerald-300/50 hover:bg-emerald-500/20 hover:text-white"
                aria-label="Pay by bank transfer"
              >
                <span className="mr-3 text-lg">🏦</span>
                Bank Transfer
              </button>
            </div>

            <button
              type="button"
              onClick={() => openNewTab(whatsappHref)}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-sm font-black text-black shadow-[0_0_22px_rgba(37,211,102,0.24)] transition hover:bg-[#1ebe5d]"
            >
              <span className="text-lg">💬</span>
              Need help? Talk on WhatsApp
            </button>

            <div className="mt-5 text-center text-xs leading-6 text-zinc-600">
              ShadowScore does not guarantee marketplace outcomes, reinstatement or payment release.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
