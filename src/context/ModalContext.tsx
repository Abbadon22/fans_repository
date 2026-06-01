import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

export interface AlertOptions {
  title: string;
  message: string;
  okLabel?: string;
}

export interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ModalState =
  | { kind: "confirm"; options: ConfirmOptions }
  | { kind: "alert"; options: AlertOptions }
  | { kind: "prompt"; options: PromptOptions };

interface ModalContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const resolverRef = useRef<((value: unknown) => void) | null>(null);

  const close = useCallback((value: unknown) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setModal(null);
    setPromptValue("");
    resolve?.(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve as (v: unknown) => void;
      setModal({ kind: "confirm", options });
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setModal({ kind: "alert", options });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve as (v: unknown) => void;
      setPromptValue(options.defaultValue ?? "");
      setModal({ kind: "prompt", options });
    });
  }, []);

  const value = useMemo(
    () => ({ confirm, alert, prompt }),
    [alert, confirm, prompt],
  );

  const isOpen = modal !== null;

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              if (modal?.kind === "confirm" || modal?.kind === "prompt") {
                close(modal.kind === "prompt" ? null : false);
              }
            }
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-line-strong bg-panel shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-modal-title"
          >
            {modal?.kind === "confirm" && (
              <>
                <div className="border-b border-line px-5 py-4">
                  <h2 id="app-modal-title" className="text-lg font-semibold text-gray-100">
                    {modal.options.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-400">
                    {modal.options.message}
                  </p>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4">
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() => close(false)}
                  >
                    {modal.options.cancelLabel ?? "Отмена"}
                  </button>
                  <button
                    type="button"
                    className={
                      modal.options.variant === "danger"
                        ? "rounded-lg bg-red-600/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                        : "btn-primary"
                    }
                    onClick={() => close(true)}
                  >
                    {modal.options.confirmLabel ?? "OK"}
                  </button>
                </div>
              </>
            )}

            {modal?.kind === "alert" && (
              <>
                <div className="border-b border-line px-5 py-4">
                  <h2 id="app-modal-title" className="text-lg font-semibold text-gray-100">
                    {modal.options.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-400">
                    {modal.options.message}
                  </p>
                </div>
                <div className="flex justify-end px-5 py-4">
                  <button type="button" className="btn-primary" onClick={() => close(undefined)}>
                    {modal.options.okLabel ?? "OK"}
                  </button>
                </div>
              </>
            )}

            {modal?.kind === "prompt" && (
              <>
                <div className="border-b border-line px-5 py-4">
                  <h2 id="app-modal-title" className="text-lg font-semibold text-gray-100">
                    {modal.options.title}
                  </h2>
                  {modal.options.message && (
                    <p className="mt-2 text-sm text-gray-400">{modal.options.message}</p>
                  )}
                  <input
                    type="text"
                    className="input-field mt-3 w-full"
                    value={promptValue}
                    placeholder={modal.options.placeholder}
                    autoFocus
                    onChange={(e) => setPromptValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") close(promptValue.trim() || null);
                      if (e.key === "Escape") close(null);
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 px-5 py-4">
                  <button type="button" className="btn-soft" onClick={() => close(null)}>
                    {modal.options.cancelLabel ?? "Отмена"}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => close(promptValue.trim() || null)}
                  >
                    {modal.options.confirmLabel ?? "OK"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return ctx;
}
