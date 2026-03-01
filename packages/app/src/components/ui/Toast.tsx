'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, variant }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    text: 'text-danger',
    Icon: XCircle,
  },
  info: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
    Icon: Info,
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { bg, border, text, Icon } = variantStyles[toast.variant];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 ${bg} ${border} border rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in min-w-[280px] max-w-[400px]`}
    >
      <Icon className={`w-4 h-4 ${text} shrink-0`} />
      <span className="text-sm text-text flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
