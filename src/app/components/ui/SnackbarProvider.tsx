"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import useModeStore from "@/app/lib/useModeStore";

type SnackbarTone = "success" | "error" | "info";

type Snackbar = {
  id: number;
  message: string;
  tone: SnackbarTone;
};

type SnackbarContextValue = {
  showSnackbar: (message: string, tone?: SnackbarTone) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);

  const dismissSnackbar = useCallback((id: number) => {
    setSnackbars((current) => current.filter((snackbar) => snackbar.id !== id));
  }, []);

  const showSnackbar = useCallback(
    (message: string, tone: SnackbarTone = "info") => {
      const id = Date.now() + Math.random();
      setSnackbars((current) => [...current.slice(-3), { id, message, tone }]);
    },
    [],
  );

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-100 flex flex-col items-end gap-3 sm:left-auto sm:w-96"
      >
        {snackbars.map((snackbar) => (
          <SnackbarItem
            key={snackbar.id}
            snackbar={snackbar}
            onDismiss={dismissSnackbar}
          />
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

function SnackbarItem({
  snackbar,
  onDismiss,
}: {
  snackbar: Snackbar;
  onDismiss: (id: number) => void;
}) {
  const { lightMode } = useModeStore();

  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(snackbar.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, snackbar.id]);

  const toneClass =
    snackbar.tone === "success"
      ? lightMode
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-emerald-800 bg-emerald-950 text-emerald-200"
      : snackbar.tone === "error"
        ? lightMode
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-red-800 bg-red-950 text-red-200"
        : lightMode
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-sky-800 bg-sky-950 text-sky-200";

  return (
    <div
      role={snackbar.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toneClass}`}
    >
      {snackbar.tone === "success" ? (
        <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
      ) : (
        <CircleAlert className="mt-0.5 shrink-0" size={17} />
      )}
      <p className="min-w-0 flex-1 wrap-break-word">{snackbar.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(snackbar.id)}
        className="shrink-0 opacity-70 transition hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error("useSnackbar must be used inside SnackbarProvider");
  }

  return context;
}