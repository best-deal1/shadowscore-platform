"use client";

import { useMemo, useState } from "react";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";

function getReferralCode() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const ref =
    params.get("ref") ||
    params.get("partner") ||
    params.get("affiliate") ||
    params.get("utm_source") ||
    "";

  if (ref) {
    localStorage.setItem("shadowscore_referral", ref);
    return ref;
  }

  return localStorage.getItem("shadowscore_referral") || "";
}

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | "payoneer" | "bank">("paypal");

  const cleanPrice = price.replace("$", "");
  const paypalBusiness = "sales@gadgetdeals.co.il";

  const referralCode = useMemo(() => getReferralCode(), []);
  const referralLine = referralCode ? `\nReferral: ${referralCode}` : "";

  const paypalUrl =
    `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusiness)}&item_name=${encodeURIComponent(`ShadowScore ${planName}${referralLine}`)}&amount=${encodeURIComponent(cleanPrice)}&currency_code=USD`;

  const securePaymentMessage = encodeURIComponent(
    `ShadowScore secure checkout request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me a secure payment link.`
  );

  const payoneerMessage = encodeURIComponent(
    `ShadowScore Payoneer payment request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me Payoneer payment details.`
  );

  const bankMessage = encodeURIComponent(
    `ShadowScore bank transfer request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me bank transfer details and invoice instructions.`
  );

  if (!checkoutOpen) {
    return (
      <div className="mt-10">
        <button
          type="button"
          onClick={() => setCheckoutOpen(true)}
          className="w-full rounded-2xl border border-red-400/25 bg-red-600 px-5 py-4 text-center text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500"
        >
          Open Checkout
        </button>

        <div className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
          Pay securely with PayPal, Credit Card, Payoneer or Bank Transfer
        </div>
      </div>
    );
  }

  const actionHref =
    paymentMethod === "paypal"
      ? paypalUrl
      : paymentMethod === "card"
        ? `https://wa.me/${WHATSAPP_NUMBER}?text=${securePaymentMessage}`
        : paymentMethod === "payoneer"
          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${payoneerMessage}`
          : `https://wa.me/${WHATSAPP_NUMBER}?text=${bankMessage}`;

  const actionLabel =
    paymentMethod === "paypal"
      ? "Continue To PayPal"
      : paymentMethod === "card"
        ? "Request Secure Card Link"
        : paymentMethod === "payoneer"
          ? "Request Payoneer Details"
          : "Request Bank Transfer Details";

  const methodTitle =
    paymentMethod === "paypal"
      ? "Pay with PayPal"
      : paymentMethod === "card"
        ? "Pay by Credit Card"
        : paymentMethod === "payoneer"
          ? "Pay with Payoneer"
          : "Bank Transfer";

  const methodDescription =
    paymentMethod === "paypal"
      ? "Protected checkout through PayPal."
      : paymentMethod === "card"
        ? "Secure card payment is processed through an encrypted payment link."
        : paymentMethod === "payoneer"
          ? "Payoneer details are provided privately after request."
          : "Bank transfer details and invoice instructions are provided privately.";

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-black/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_28px_rgba(120,0,20,0.14)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black text-white">Checkout</div>
          <div className="mt-1 text-xs text-zinc-500">
            {planName} · {price}
          </div>
        </div>

        {referralCode && (
          <div className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-200">
            Ref: {referralCode}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ["paypal", "PayPal"],
          ["card", "Card"],
          ["payoneer", "Payoneer"],
          ["bank", "Bank"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPaymentMethod(id as "paypal" | "card" | "payoneer" | "bank")}
            className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
              paymentMethod === id
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-red-400/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl font-black text-black">
          {paymentMethod === "paypal" ? "P" : paymentMethod === "card" ? "💳" : paymentMethod === "payoneer" ? "P" : "🏦"}
        </div>

        <div className="mt-4 text-xl font-black text-white">{methodTitle}</div>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">{methodDescription}</p>

        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
        >
          {actionLabel}
        </a>
      </div>

      <div className="mt-4 text-center text-[11px] leading-5 text-zinc-600">
        Payment request includes plan, amount and referral code when available.
      </div>
    </div>
  );
}
