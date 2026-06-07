"use client";

import { useState } from "react";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";
const SUPPORT_EMAIL = "help@shadowscore.io";

function buildEmailHref(planName: string, price: string, method: string) {
  const subject = encodeURIComponent(`ShadowScore payment request - ${planName}`);
  const body = encodeURIComponent(`Hi ShadowScore team,

I would like to start: ${planName}
Amount: ${price}
Preferred payment method: ${method}

Please send me the secure payment link and next steps.
`);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function buildWhatsappHref(planName: string, price: string) {
  const message = `Hi ShadowScore team,

I would like to continue with:
${planName} - ${price}

Please send me the next steps and secure payment options.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const [open, setOpen] = useState(false);

  const whatsappHref = buildWhatsappHref(planName, price);
  const paypalHref = "https://www.paypal.com/paypalme/YOURPAYPAL";
  const payoneerHref = whatsappHref + "%0APayment:%20Payoneer";
  const cardHref = whatsappHref + "%0APayment:%20Credit%20Card";
  const bankHref = whatsappHref + "%0APayment:%20Bank%20Transfer";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_0_28px_rgba(16,185,129,0.28)] transition hover:bg-emerald-400"
      >
        Open Checkout
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
              Choose a payment method. Each option is clickable and opens the relevant payment request.
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href={paypalHref}
                className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-sky-400 hover:shadow-[0_0_26px_rgba(56,189,248,0.22)]"
                aria-label="Pay with PayPal"
              >
                <img src="/payments/paypal-logo.png" alt="PayPal" className="h-12 max-w-[190px] object-contain" />
              </a>

              <a
                href={cardHref}
                className="flex min-h-[64px] items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500 px-5 py-4 text-sm font-black text-black shadow-[0_0_22px_rgba(16,185,129,0.20)] transition hover:bg-emerald-400"
                aria-label="Pay with credit card"
              >
                <span className="mr-3 text-lg">💳</span>
                Pay With Credit Card
              </a>

              <a
                href={payoneerHref}
                className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 transition hover:border-orange-400 hover:shadow-[0_0_26px_rgba(249,115,22,0.22)]"
                aria-label="Pay with Payoneer"
              >
                <img src="/payments/payoneer-logo.png" alt="Payoneer" className="h-12 max-w-[215px] object-contain" />
              </a>

              <a
                href={bankHref}
                className="flex min-h-[58px] items-center justify-center rounded-2xl border border-white/10 bg-black px-5 py-4 text-sm font-bold text-zinc-300 transition hover:border-emerald-400/30 hover:text-white"
                aria-label="Pay by bank transfer"
              >
                Bank Transfer
              </a>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-sm font-black text-black shadow-[0_0_22px_rgba(37,211,102,0.24)] transition hover:bg-[#1ebe5d]"
            >
              <span className="text-lg">💬</span>
              Need help? Talk on WhatsApp
            </a>

            <div className="mt-5 text-center text-xs leading-6 text-zinc-600">
              ShadowScore does not guarantee marketplace outcomes, reinstatement or payment release.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
