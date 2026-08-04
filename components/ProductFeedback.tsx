"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };
type FeedbackContextValue = { notify: (message: string, tone?: ToastTone) => void };

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function ProductFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="product-toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`product-toast product-toast-${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
            <span className="product-toast-icon" aria-hidden="true">{toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}</span>
            <p>{toast.message}</p>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useProductFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useProductFeedback must be used within ProductFeedbackProvider");
  return context;
}
