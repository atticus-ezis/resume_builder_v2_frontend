"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const TOAST_DURATION_MS = 6000;
const API_SERVER_ERROR_EVENT = "api-server-error";

export type ToastItem = {
  id: string;
  message: string;
  detail?: string;
};

type ToastContextValue = {
  toasts: ToastItem[];
  addToast: (message: string, detail?: string) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, detail?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, detail }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; detail?: string }>;
      const { message = "Server error", detail } = customEvent.detail ?? {};
      addToast(message, detail);
    };
    window.addEventListener(API_SERVER_ERROR_EVENT, handler);
    return () => window.removeEventListener(API_SERVER_ERROR_EVENT, handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-800 dark:bg-red-900/30"
          >
            <p className="font-medium text-red-800 dark:text-red-200">{toast.message}</p>
            {toast.detail && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{toast.detail}</p>
            )}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="mt-2 text-xs underline focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Dispatches a server-error toast from outside React (e.g. axios interceptor). */
export function dispatchServerErrorToast(payload: { message?: string; detail?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(API_SERVER_ERROR_EVENT, { detail: payload })
  );
}
