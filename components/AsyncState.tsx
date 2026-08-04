"use client";

type AsyncStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="product-async-state product-loading-state" role="status" aria-live="polite" aria-busy="true">
      <span className="product-state-icon product-spinner" aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="font-bold text-zinc-200">{label}</p><div className="product-skeleton-lines" aria-hidden="true"><span /><span /></div></div>
    </div>
  );
}

export function EmptyState({ title, description }: Omit<AsyncStateProps, "onRetry" | "retryLabel">) {
  return (
    <section className="product-async-state product-empty-state">
      <span className="product-state-icon" aria-hidden="true">◇</span>
      <div>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mt-2 leading-6 text-zinc-400">{description}</p>
      </div>
    </section>
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = "Try again" }: AsyncStateProps) {
  return (
    <section className="product-async-state product-error-state" role="alert">
      <span className="product-state-icon" aria-hidden="true">!</span>
      <div>
      <h2 className="text-xl font-black text-red-100">{title}</h2>
      <p className="mt-2 leading-6 text-zinc-300">{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-5 rounded-full border border-red-300/40 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-300">
          {retryLabel}
        </button>
      ) : null}
      </div>
    </section>
  );
}
