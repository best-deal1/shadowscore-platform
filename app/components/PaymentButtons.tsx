"use client";

import { useState } from "react";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const cleanPrice = price.replace("$", "");
  const paypalBusiness = "sales@gadgetdeals.co.il";

  const paypalUrl =
    `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusiness)}&item_name=${encodeURIComponent(`ShadowScore ${planName}`)}&amount=${encodeURIComponent(cleanPrice)}&currency_code=USD`;

  const cardMessage = encodeURIComponent(
    `ShadowScore secure card checkout request\nPlan: ${planName}\nPrice: ${price}\nPlease send me an encrypted credit card payment link.`
  );

  if (!showCheckout) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowCheckout(true)}
          className="w-full rounded-xl border border-red-400/25 bg-red-600 px-4 py-3 text-center text-sm font-black text-white shadow-[0_0_22px_rgba(220,38,38,0.22)] transition hover:bg-red-500"
        >
          Start Assessment
        </button>
        <div className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
          Secure checkout via PayPal or Credit Card
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/45 p-4">
      <div className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        Choose Payment Method
      </div>

      <div className="grid gap-2">
        <a
          href={paypalUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-red-400/25 bg-red-600/90 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
        >
          Pay with PayPal
        </a>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${cardMessage}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white transition hover:border-red-400/30 hover:bg-white/[0.07]"
        >
          Pay by Credit Card
        </a>
      </div>

      <div className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
        Secure card payment is processed through an encrypted payment link.
      </div>
    </div>
  );
}
