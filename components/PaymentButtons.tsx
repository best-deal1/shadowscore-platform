"use client";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";
const SUPPORT_EMAIL = "help@shadowscore.io";

function buildEmailHref(planName: string, price: string, method: string) {
  const subject = encodeURIComponent(`ShadowScore secure payment request - ${planName}`);
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

I would like help with my marketplace risk assessment.

Selected option: ${planName}
Amount: ${price}

Please send me the next steps and the secure payment options.

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
        className="flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-sm font-black text-black shadow-[0_0_28px_rgba(37,211,102,0.32)] transition hover:bg-[#1ebe5d]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-lg">💬</span>
        <span>Talk To A Marketplace Risk Analyst</span>
      </a>

      <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="mb-3 text-center text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
          Secure Payment Options
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <a
            href={paypalHref}
            className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 transition hover:border-sky-400 hover:shadow-[0_0_24px_rgba(56,189,248,0.16)]"
            aria-label="Pay with PayPal"
          >
            <img
              src="/payments/paypal-logo.png"
              alt="PayPal"
              className="h-12 max-w-[170px] object-contain"
            />
          </a>

          <a
            href={payoneerHref}
            className="flex min-h-[74px] items-center justify-center rounded-2xl border border-white/10 bg-white px-4 py-3 transition hover:border-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.16)]"
            aria-label="Pay with Payoneer"
          >
            <img
              src="/payments/payoneer-logo.png"
              alt="Payoneer"
              className="h-12 max-w-[190px] object-contain"
            />
          </a>
        </div>

        <a
          href={cardHref}
          className="mt-3 flex min-h-[64px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-black text-white transition hover:border-red-400/30 hover:bg-white/[0.07]"
          aria-label="Pay with credit card"
        >
          <span className="mr-3 text-xl">💳</span>
          Pay With Credit Card
        </a>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Visa", "Mastercard", "Amex"].map((method) => (
            <div
              key={method}
              className="rounded-xl border border-white/10 bg-black/55 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400"
            >
              {method}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center text-xs leading-6 text-zinc-500">
        Secure payment request. Payment links are sent manually until live checkout is connected.
      </div>
    </div>
  );
}
