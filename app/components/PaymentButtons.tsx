"use client";
type PaymentButtonsProps = { planName: string; price: string };
export default function PaymentButtons({ planName, price }: PaymentButtonsProps) {
  const message = encodeURIComponent(`ShadowScore payment request: ${planName} ${price}`);
  return <div className="mt-4 grid gap-2"><a href="https://www.paypal.com/" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white hover:border-red-400/30">Pay with PayPal</a><a href={`https://wa.me/972557293979?text=${message}%0ARequesting%20credit%20card%20payment%20link`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-white hover:border-red-400/30">Pay with Credit Card</a></div>;
}
