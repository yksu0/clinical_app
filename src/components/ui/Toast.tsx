"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: "border-green-500/30 bg-green-500/10 text-green-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-accent/30 bg-accent/10 text-accent",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm text-sm max-w-xs ${STYLES[t.type]}`}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}

/**
 * Drop this component anywhere inside a page to automatically show a toast
 * when the URL contains ?toast=success|error|info&message=...
 * The query params are stripped from the URL after display.
 */
export function SearchParamToast() {
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("toast") as ToastType | null;
    const message = params.get("message");
    if (type && message) {
      toast(decodeURIComponent(message), type);
      // Strip params from URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("toast");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
