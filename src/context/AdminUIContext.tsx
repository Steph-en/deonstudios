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
      {/* CENTERED LIGHTBOX CONFIRMATION / ALERT MODAL DIALOG */}
      {/* Replaces browser confirm() and alert() matching provided screenshot design */}
      {/* ========================================================================= */}
      {dialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDialogCancel();
            }
          }}
        >
          <div className="relative w-full max-w-[460px] bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 overflow-hidden transform scale-100 transition-all">
            {/* Top decorative accent glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] ${
                variant === 'danger'
                  ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
                  : variant === 'warning'
                  ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-neutral-400 to-transparent'
              }`}
            />

            {/* Header: Icon + Title & Subtitle + Close Button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {/* Rounded Icon Circle Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    variant === 'danger'
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                      : variant === 'warning'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
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
                  <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-100 font-sans">
                    {dialog.options.title || 'CONFIRM ACTION'}
                  </h3>
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400 mt-0.5">
                    {dialog.options.subtitle || 'CONFIRMATION REQUIRED'}
                  </p>
                </div>
              </div>

              {/* Close X Button */}
              <button
                type="button"
                onClick={handleDialogCancel}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Description */}
            <div className="mt-4 mb-6">
              <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                {dialog.options.message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/80">
              {!dialog.isAlertOnly && (
                <button
                  type="button"
                  onClick={handleDialogCancel}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] text-neutral-300 text-xs font-semibold uppercase tracking-wider transition border border-neutral-700/60"
                >
                  {dialog.options.cancelText || 'CANCEL'}
                </button>
              )}

              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleDialogConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider active:scale-[0.98] transition shadow-lg ${
                  variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                    : variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                    : 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/10'
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

// MacBook style individual Toast item with 4-second auto-dismiss and progress bar
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
      badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      progressClass: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />,
    },
    error: {
      badgeClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      progressClass: 'bg-rose-500',
      icon: <AlertCircle className="w-4 h-4 stroke-[2.5]" />,
    },
    warning: {
      badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      progressClass: 'bg-amber-500',
      icon: <AlertTriangle className="w-4 h-4 stroke-[2.5]" />,
    },
    info: {
      badgeClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      progressClass: 'bg-sky-500',
      icon: <Info className="w-4 h-4 stroke-[2.5]" />,
    },
  }[item.type];

  return (
    <div
      role="alert"
      className="pointer-events-auto relative w-full bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/60 shadow-2xl rounded-2xl p-3.5 text-neutral-100 overflow-hidden transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-8 fade-in"
    >
      {/* Top macOS Notification Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
            <Camera className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
            Deon Studios
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono">now</span>
          <button
            type="button"
            onClick={onDismiss}
            className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex items-start gap-3">
        <div className={`p-1 rounded-lg border shrink-0 ${typeConfig.badgeClass}`}>
          {typeConfig.icon}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-semibold text-neutral-100 uppercase tracking-wide truncate">
            {item.title}
          </p>
          {item.message && (
            <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed break-words">
              {item.message}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar (4-second duration visual indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-800">
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
