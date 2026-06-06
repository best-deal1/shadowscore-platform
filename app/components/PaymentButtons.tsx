"use client";

import { useMemo, useState } from "react";

type PaymentMethod = "paypal" | "card" | "payoneer" | "bank";
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

const methods: Array<{
  id: PaymentMethod;
  title: string;
  logo: string;
  sub: string;
  border: string;
}> = [
  { id: "paypal", title: "PayPal", logo: "PayPal", sub: "Buyer-protected checkout", border: "hover:border-blue-400/60" },
  { id: "card", title: "Credit Card", logo: "VISA · MC · AMEX", sub: "Secure card payment link", border: "hover:border-zinc-300/60" },
  { id: "payoneer", title: "Payoneer", logo: "payoneer", sub: "Business payment request", border: "hover:border-orange-400/60" },
  { id: "bank", title: "Bank Transfer", logo: "BANK", sub: "Invoice and wire details", border: "hover:border-emerald-400/60" },
];

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const referralCode = useMemo(() => getReferralCode(), []);
  const referralLine = referralCode ? `\nReferral: ${referralCode}` : "";
  const paypalBusiness = "sales@gadgetdeals.co.il";
  const cleanPrice = price.replace("$", "");

  const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusiness)}&item_name=${encodeURIComponent(`ShadowScore ${planName}${referralLine}`)}&amount=${encodeURIComponent(cleanPrice)}&currency_code=USD`;

  const whatsappMessage = (method: string) => encodeURIComponent(`ShadowScore payment request\nPlan: ${planName}\nPrice: ${price}\nPayment method: ${method}${referralLine}\nPlease send me the secure payment details.`);

  const actionHref = paymentMethod === "paypal"
    ? paypalUrl
    : `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage(paymentMethod === "card" ? "Credit Card" : paymentMethod === "payoneer" ? "Payoneer" : "Bank Transfer")}`;

  const selected = methods.find((method) => method.id === paymentMethod) || methods[0];
  const actionLabel = paymentMethod === "paypal" ? "Continue To PayPal" : paymentMethod === "card" ? "Request Secure Card Link" : paymentMethod === "payoneer" ? "Request Payoneer Details" : "Request Bank Transfer Details";

  return (
    <>
      <div className="mt-10">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); setCheckoutOpen(true); }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm font-black text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
        >
          Choose Payment Method
        </button>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] font-black text-zinc-500">
          <div>PayPal</div><div>Cards</div><div>Payoneer</div><div>Bank</div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-xl" onClick={(event) => { event.stopPropagation(); setCheckoutOpen(false); }}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-black p-6 shadow-[0_0_80px_rgba(34,197,94,0.16)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-black text-white">Secure Checkout</div>
                <div className="mt-2 text-sm leading-6 text-zinc-500">{planName} · {price}</div>
              </div>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:border-emerald-400/30 hover:text-white">Close</button>
            </div>

            {referralCode && <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">Referral detected: {referralCode}</div>}

            <div className="grid gap-3 md:grid-cols-4">
              {methods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-2xl border px-3 py-5 text-center transition ${method.border} ${paymentMethod === method.id ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className="text-lg font-black text-white">{method.logo}</div>
                  <div className="mt-2 text-xs font-bold text-zinc-400">{method.title}</div>
                  <div className="mt-1 text-[10px] leading-4 text-zinc-600">{method.sub}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-7 text-center">
              <div className="mx-auto inline-flex min-w-40 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 py-4 text-2xl font-black text-black shadow-[0_0_28px_rgba(255,255,255,0.10)]">
                {selected.logo}
              </div>
              <div className="mt-5 text-2xl font-black text-white">{selected.title}</div>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">{selected.sub}. Payment request includes the selected plan and amount.</p>
              <a href={actionHref} target="_blank" rel="noreferrer" className="mt-6 block rounded-2xl bg-emerald-600 px-5 py-4 text-center text-sm font-black text-white shadow-[0_0_28px_rgba(34,197,94,0.22)] transition hover:bg-emerald-500">
                {actionLabel}
              </a>
            </div>

            <div className="mt-5 text-center text-[11px] leading-5 text-zinc-600">
              PayPal is direct checkout. Card, Payoneer and bank transfer are handled through secure private payment instructions.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
