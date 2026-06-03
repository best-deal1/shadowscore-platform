"use client";

type PaymentButtonsProps = {
  planName: string;
  price: string;
};

const WHATSAPP_NUMBER = "972557293979";

export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const cleanPrice = price.replace("$", "");
  const paypalBusiness = "sales@gadgetdeals.co.il";
  const paypalUrl =
    `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalBusiness)}&item_name=${encodeURIComponent(`ShadowScore ${planName}`)}&amount=${encodeURIComponent(cleanPrice)}&currency_code=USD`;

  const cardMessage = encodeURIComponent(
    `ShadowScore payment request\nPlan: ${planName}\nPrice: ${price}\nPlease send me a secure credit card payment link.`
  );

  return (
    <div className="mt-4 grid gap-2">
      <a
        href={paypalUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white transition hover:border-red-400/30 hover:bg-white/[0.07]"
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

      <div className="text-center text-[11px] leading-5 text-zinc-600">
        Credit card checkout is currently issued manually by secure payment link.
      </div>
    </div>
  );
}
