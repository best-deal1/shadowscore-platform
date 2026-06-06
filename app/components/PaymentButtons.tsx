"use client";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";
const SUPPORT_EMAIL = "help@shadowscore.io";

const cards = ["Visa", "Mastercard", "Amex"];

function buildEmailHref(planName: string, price: string, method: string) {
  const subject = encodeURIComponent(`ShadowScore payment request - ${planName}`);
  const body = encodeURIComponent(`Hi ShadowScore team,

I would like to start the ${planName} plan (${price}).

Preferred payment method: ${method}

Please send me the secure payment link and next steps.
`);

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function buildWhatsappHref(planName: string, price: string) {
  const message = `Hi ShadowScore team,

I want to start the ${planName} plan (${price}).

Please send me the payment link and next steps.

Preferred options:
- PayPal
- Payoneer
- Credit Card
- Bank Transfer`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const whatsappHref = buildWhatsappHref(planName, price);
  const paypalHref = buildEmailHref(planName, price, "PayPal");
  const payoneerHref = buildEmailHref(planName, price, "Payoneer");
  const cardHref = buildEmailHref(planName, price, "Credit Card");

  return (
    <div className="mt-6 space-y-4">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-3.5 text-center text-sm font-black text-black shadow-[0_0_22px_rgba(37,211,102,0.22)] transition hover:bg-[#1ebe5d]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-lg">☎</span>
        <span>Start On WhatsApp</span>
      </a>

      <div className="grid gap-3 md:grid-cols-2">
        <a
          href={paypalHref}
          className="flex min-h-[70px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 transition hover:border-sky-400 hover:shadow-[0_0_24px_rgba(56,189,248,0.16)]"
        >
          <img
            src="/payments/paypal-logo.png"
            alt="PayPal"
            className="h-10 max-w-[150px] object-contain"
          />
        </a>

        <a
          href={payoneerHref}
          className="flex min-h-[70px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 transition hover:border-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.16)]"
        >
          <img
            src="/payments/payoneer-logo.png"
            alt="Payoneer"
            className="h-10 max-w-[165px] object-contain"
          />
        </a>
      </div>

      <a
        href={cardHref}
        className="block rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center text-sm font-bold text-zinc-300 transition hover:border-red-400/30 hover:text-white"
      >
        Pay With Credit Card
      </a>

      <div className="grid grid-cols-3 gap-2 pt-1">
        {cards.map((method) => (
          <div
            key={method}
            className="rounded-xl border border-white/10 bg-black/45 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400"
          >
            {method}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center text-xs leading-6 text-zinc-500">
        Secure payment options: PayPal, Payoneer, credit card and bank transfer. Payment links are sent manually until live checkout is connected.
      </div>
    </div>
  );
}
