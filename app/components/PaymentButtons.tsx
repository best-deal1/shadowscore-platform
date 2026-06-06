"use client";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const paymentMethods = ["PayPal", "Payoneer", "Visa", "Mastercard", "Amex", "Bank Transfer"];

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const subject = encodeURIComponent(`ShadowScore payment request - ${planName}`);
  const body = encodeURIComponent(`Hi ShadowScore team,

I would like to start the ${planName} plan (${price}).

Preferred payment method:
- PayPal
- Payoneer
- Credit Card
- Bank Transfer

Please send me the secure payment link.
`);
  const emailHref = `mailto:help@shadowscore.io?subject=${subject}&body=${body}`;

  return (
    <div className="mt-6 space-y-3">
      <a
        href={emailHref}
        className="block rounded-2xl bg-red-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-red-500"
      >
        Pay with PayPal / Card
      </a>
      <a
        href={emailHref}
        className="block rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center text-sm font-bold text-zinc-300 transition hover:border-red-400/30 hover:text-white"
      >
        Request Payoneer / Bank Transfer
      </a>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {paymentMethods.map((method) => (
          <div key={method} className="rounded-xl border border-white/10 bg-black/45 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            {method}
          </div>
        ))}
      </div>
    </div>
  );
}
