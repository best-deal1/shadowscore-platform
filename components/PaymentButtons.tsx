"use client";

import { useMemo, useState } from "react";

type PaymentButtonsProps = { planName: string; price: string };

const WHATSAPP_NUMBER = "972557293979";

function getReferralCode() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref") || params.get("partner") || params.get("affiliate") || params.get("utm_source") || "";
  if (ref) {
    localStorage.setItem("shadowscore_referral", ref);
    return ref;
  }
  return localStorage.getItem("shadowscore_referral") || "";
}

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | "payoneer" | "bank">("paypal");
  const referralCode = useMemo(() => getReferralCode(), []);
  const referralLine = referralCode ? `\nReferral: ${referralCode}` : "";
  const paypalBusiness = "sales@gadgetdeals.co.il";
  const cleanPrice = price.replace("$", "");
  const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusiness)}&item_name=${encodeURIComponent(`ShadowScore ${planName}${referralLine}`)}&amount=${encodeURIComponent(cleanPrice)}&currency_code=USD`;
  const cardMessage = encodeURIComponent(`ShadowScore secure checkout request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me a secure payment link.`);
  const payoneerMessage = encodeURIComponent(`ShadowScore Payoneer payment request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me Payoneer payment details.`);
  const bankMessage = encodeURIComponent(`ShadowScore bank transfer request\nPlan: ${planName}\nPrice: ${price}${referralLine}\nPlease send me bank transfer details and invoice instructions.`);

  const actionHref = paymentMethod === "paypal" ? paypalUrl : paymentMethod === "card" ? `https://wa.me/${WHATSAPP_NUMBER}?text=${cardMessage}` : paymentMethod === "payoneer" ? `https://wa.me/${WHATSAPP_NUMBER}?text=${payoneerMessage}` : `https://wa.me/${WHATSAPP_NUMBER}?text=${bankMessage}`;
  const actionLabel = paymentMethod === "paypal" ? "Continue To PayPal" : paymentMethod === "card" ? "Request Secure Card Link" : paymentMethod === "payoneer" ? "Request Payoneer Details" : "Request Bank Transfer Details";
  const methodTitle = paymentMethod === "paypal" ? "Pay with PayPal" : paymentMethod === "card" ? "Pay by Credit Card" : paymentMethod === "payoneer" ? "Pay with Payoneer" : "Bank Transfer";
  const methodDescription = paymentMethod === "paypal" ? "Protected checkout through PayPal." : paymentMethod === "card" ? "Secure card payment is processed through an encrypted payment link." : paymentMethod === "payoneer" ? "Payoneer details are provided privately after request." : "Bank transfer details and invoice instructions are provided privately.";

  return (
    <>
      <div className="mt-10">
        <button type="button" onClick={(event) => { event.stopPropagation(); setCheckoutOpen(true); }} className="w-full rounded-2xl border border-red-400/25 bg-red-600 px-5 py-4 text-center text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500">
          Open Checkout
        </button>
        <div className="mt-3 text-center text-[11px] leading-5 text-zinc-600">Pay securely with PayPal, Credit Card, Payoneer or Bank Transfer</div>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-xl" onClick={(event) => { event.stopPropagation(); setCheckoutOpen(false); }}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[32px] border border-white/10 bg-black p-6 shadow-[0_0_80px_rgba(220,38,38,0.20)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><div className="text-3xl font-black text-white">Checkout</div><div className="mt-2 text-sm leading-6 text-zinc-500">{planName} · {price}</div></div>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:border-red-400/30 hover:text-white">Close</button>
            </div>
            {referralCode && <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">Referral detected: {referralCode}</div>}
            <div className="grid grid-cols-2 gap-3">
              {[["paypal", "PayPal"], ["card", "Card"], ["payoneer", "Payoneer"], ["bank", "Bank Transfer"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setPaymentMethod(id as "paypal" | "card" | "payoneer" | "bank")} className={`rounded-2xl border px-4 py-4 text-sm font-black transition ${paymentMethod === id ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-red-400/30"}`}>{label}</button>
              ))}
            </div>
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-7 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-2xl font-black text-black">{paymentMethod === "paypal" ? "P" : paymentMethod === "card" ? "💳" : paymentMethod === "payoneer" ? "P" : "🏦"}</div>
              <div className="mt-5 text-2xl font-black text-white">{methodTitle}</div>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">{methodDescription}</p>
              <a href={actionHref} target="_blank" rel="noreferrer" className="mt-6 block rounded-2xl bg-red-600 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-red-500">{actionLabel}</a>
            </div>
            <div className="mt-5 text-center text-[11px] leading-5 text-zinc-600">Payment request includes plan, amount and referral code when available.</div>
          </div>
        </div>
      )}
    </>
  );
}
