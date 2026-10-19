import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext, type ToastApi, type ToastOptions, type ToastTone } from '../../context/feedbackContext';
import Icon from './Icon';

interface ToastItem extends Required<Omit<ToastOptions, 'description'>> {
  id: number;
  description?: string;
  leaving: boolean;
}

const toneIcon: Record<ToastTone, 'check-circle' | 'alert' | 'info'> = {
  success: 'check-circle',
  error: 'alert',
  info: 'info',
};

const MAX_TOASTS = 4;
const EXIT_DURATION = 220;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, EXIT_DURATION);
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ title, description, tone = 'info', duration = 4200 }: ToastOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, title, description, tone, duration, leaving: false }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ title, description, tone: 'success' }),
      error: (title, description) => show({ title, description, tone: 'error', duration: 6000 }),
      info: (title, description) => show({ title, description, tone: 'info' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.tone}${toast.leaving ? ' toast--leaving' : ''}`}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__icon">
              <Icon name={toneIcon[toast.tone]} size={18} />
            </span>
            <div className="toast__body">
              <p className="toast__title">{toast.title}</p>
              {toast.description ? <p className="toast__description">{toast.description}</p> : null}
            </div>
            <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              <Icon name="x" size={14} />
            </button>
            <span className="toast__progress" style={{ animationDuration: `${toast.duration}ms` }} aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
