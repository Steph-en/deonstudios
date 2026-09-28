import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Camera,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number; // in milliseconds
  createdAt: number;
}

export interface ConfirmDialogOptions {
  title?: string;
  subtitle?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface AlertDialogOptions {
  title?: string;
  subtitle?: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface DialogState {
  isOpen: boolean;
  isAlertOnly: boolean;
  options: ConfirmDialogOptions;
  resolve?: (value: boolean) => void;
}

interface AdminUIContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  alert: (options: AlertDialogOptions | string) => Promise<void>;
}

const AdminUIContext = createContext<AdminUIContextType | null>(null);

export const AdminUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    isAlertOnly: false,
    options: { message: '' },
  });

  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Toast functions
  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const defaultTitles: Record<ToastType, string> = {
        success: 'ACTION SUCCESSFUL',
        error: 'ACTION FAILED',
        info: 'SYSTEM NOTIFICATION',
        warning: 'ATTENTION REQUIRED',
      };

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = {
        id,
        type,
        title: title || defaultTitles[type],
        message,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts on screen
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, title?: string, dur?: number) => addToast('success', msg, title, dur),
    error: (msg: string, title?: string, dur?: number) => addToast('error', msg, title, dur),
    info: (msg: string, title?: string, dur?: number) => addToast('info', msg, title, dur),
    warning: (msg: string, title?: string, dur?: number) => addToast('warning', msg, title, dur),
  };

  // Confirm dialog function
  const confirm = useCallback((options: ConfirmDialogOptions | string): Promise<boolean> => {
    const normalizedOptions: ConfirmDialogOptions =
      typeof options === 'string'
        ? {
            title: 'CONFIRM ACTION',
            subtitle: 'CONFIRMATION REQUIRED',
            message: options,
            confirmText: 'CONFIRM',
            cancelText: 'CANCEL',
            variant: 'danger',
          }
        : {
            title: options.title || 'CONFIRM ACTION',
            subtitle: options.subtitle || 'CONFIRMATION REQUIRED',
            message: options.message,
            confirmText: options.confirmText || 'CONFIRM',
            cancelText: options.cancelText || 'CANCEL',
            variant: options.variant || 'danger',
          };

    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        isAlertOnly: false,
        options: normalizedOptions,
        resolve,
      });
    });
  }, []);

  // Alert dialog function
  const alert = useCallback((options: AlertDialogOptions | string): Promise<void> => {
    const normalizedOptions: AlertDialogOptions =
      typeof options === 'string'
        ? {
            title: 'NOTICE',
            subtitle: 'INFORMATION',
            message: options,
            confirmText: 'GOT IT',
            variant: 'info',
          }
        : {
            title: options.title || 'NOTICE',
            subtitle: options.subtitle || 'INFORMATION',
            message: options.message,
            confirmText: options.confirmText || 'GOT IT',
            variant: options.variant || 'info',
          };

    return new Promise<void>((resolve) => {
      setDialog({
        isOpen: true,
        isAlertOnly: true,
        options: {
          ...normalizedOptions,
          cancelText: '',
        },
        resolve: () => resolve(),
      });
    });
  }, []);

  const handleDialogConfirm = () => {
    dialog.resolve?.(true);
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDialogCancel = () => {
    dialog.resolve?.(false);
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard navigation for modal dialog (Escape to cancel, Enter to confirm)
  useEffect(() => {
    if (!dialog.isOpen) return;

    // Focus confirm button when dialog opens
    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDialogCancel();
      } else if (e.key === 'Enter' && !dialog.isAlertOnly) {
        // Confirm on Enter
        e.preventDefault();
        handleDialogConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen]);

  const variant = dialog.options.variant || 'danger';

  return (
    <AdminUIContext.Provider value={{ toast, confirm, alert }}>
      {children}

      {/* ========================================================================= */}
      {/* MACBOOK / macOS STYLE TOAST NOTIFICATIONS (TOP-RIGHT FIXED) */}
      {/* ========================================================================= */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[120] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full"
      >
        {toasts.map((item) => (
          <MacToast key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </div>

      {/* ========================================================================= */}
      {/* CENTERED LIGHTBOX CONFIRMATION / ALERT MODAL DIALOG (LIGHT THEME) */}
      {/* Replaces browser confirm() and alert() matching light design system */}
      {/* ========================================================================= */}
      {dialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDialogCancel();
            }
          }}
        >
          <div className="relative w-full max-w-[460px] bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 text-neutral-900 overflow-hidden ring-1 ring-black/5 transform scale-100 transition-all">
            {/* Top decorative accent glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] ${
                variant === 'danger'
                  ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
                  : variant === 'warning'
                  ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-neutral-300 to-transparent'
              }`}
            />

            {/* Header: Icon + Title & Subtitle + Close Button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {/* Rounded Icon Circle Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    variant === 'danger'
                      ? 'bg-rose-50 border border-rose-200 text-rose-600'
                      : variant === 'warning'
                      ? 'bg-amber-50 border border-amber-200 text-amber-600'
                      : 'bg-neutral-100 border border-neutral-200 text-neutral-700'
                  }`}
                >
                  {variant === 'danger' ? (
                    <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                  ) : variant === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <Info className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-900 font-sans">
                    {dialog.options.title || 'CONFIRM ACTION'}
                  </h3>
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-neutral-500 mt-0.5">
                    {dialog.options.subtitle || 'CONFIRMATION REQUIRED'}
                  </p>
                </div>
              </div>

              {/* Close X Button */}
              <button
                type="button"
                onClick={handleDialogCancel}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Description */}
            <div className="mt-4 mb-6">
              <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                {dialog.options.message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              {!dialog.isAlertOnly && (
                <button
                  type="button"
                  onClick={handleDialogCancel}
                  className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] text-neutral-700 text-xs font-semibold uppercase tracking-wider transition border border-neutral-200 cursor-pointer"
                >
                  {dialog.options.cancelText || 'CANCEL'}
                </button>
              )}

              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleDialogConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider active:scale-[0.98] transition shadow-sm cursor-pointer ${
                  variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                {dialog.options.confirmText || (dialog.isAlertOnly ? 'GOT IT' : 'DELETE PERMANENTLY')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminUIContext.Provider>
  );
};

// MacBook style individual Toast item with 4-second auto-dismiss and progress bar (Light Theme)
const MacToast: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [item.duration, onDismiss]);

  const typeConfig = {
    success: {
      badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      progressClass: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />,
    },
    error: {
      badgeClass: 'bg-rose-50 border-rose-200 text-rose-600',
      progressClass: 'bg-rose-600',
      icon: <AlertCircle className="w-4 h-4 stroke-[2.5]" />,
    },
    warning: {
      badgeClass: 'bg-amber-50 border-amber-200 text-amber-600',
      progressClass: 'bg-amber-500',
      icon: <AlertTriangle className="w-4 h-4 stroke-[2.5]" />,
    },
    info: {
      badgeClass: 'bg-sky-50 border-sky-200 text-sky-600',
      progressClass: 'bg-sky-600',
      icon: <Info className="w-4 h-4 stroke-[2.5]" />,
    },
  }[item.type];

  return (
    <div
      role="alert"
      className="pointer-events-auto relative w-full bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-xl rounded-2xl p-3.5 text-neutral-900 overflow-hidden ring-1 ring-black/5 transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-8 fade-in"
    >
      {/* Top macOS Notification Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600">
            <Camera className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
            Deon Studios
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 font-mono">now</span>
          <button
            type="button"
            onClick={onDismiss}
            className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg border shrink-0 ${typeConfig.badgeClass}`}>
          {typeConfig.icon}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wide truncate">
            {item.title}
          </p>
          {item.message && (
            <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed break-words font-normal">
              {item.message}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar (4-second duration visual indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100">
        <div
          className={`h-full transition-all duration-75 ease-linear ${typeConfig.progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const useAdminUI = (): AdminUIContextType => {
  const context = useContext(AdminUIContext);
  if (!context) {
    throw new Error('useAdminUI must be used within an AdminUIProvider');
  }
  return context;
};

export const useToast = () => useAdminUI().toast;
export const useConfirm = () => {
  const { confirm, alert } = useAdminUI();
  return { confirm, alert };
};
