"use client";

type AsyncStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-sm text-zinc-400" role="status" aria-live="polite">
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: Omit<AsyncStateProps, "onRetry" | "retryLabel">) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mt-2 leading-6 text-zinc-400">{description}</p>
    </section>
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = "Try again" }: AsyncStateProps) {
  return (
    <section className="rounded-3xl border border-red-400/25 bg-red-500/[0.06] p-6" role="alert">
      <h2 className="text-xl font-black text-red-100">{title}</h2>
      <p className="mt-2 leading-6 text-zinc-300">{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-5 rounded-full border border-red-300/40 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-300">
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
