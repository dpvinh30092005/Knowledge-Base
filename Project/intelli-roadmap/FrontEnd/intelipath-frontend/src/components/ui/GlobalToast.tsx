import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  key: string;
  message: string;
  type: ToastType;
  expiresAt: number;
}

const TTL = 4000;
const MAX_VISIBLE = 3;

export const GlobalToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add incoming toasts, but de-duplicate: an identical message that's still
  // showing just refreshes its timer instead of stacking another copy. Cap the
  // number of visible toasts so a burst never floods the screen.
  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType };
      const key = `${type}|${message}`;
      const expiresAt = Date.now() + TTL;
      setToasts(prev => {
        const idx = prev.findIndex(t => t.key === key);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], expiresAt };
          return copy;
        }
        const next = [...prev, { id: Date.now() + Math.random(), key, message, type, expiresAt }];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
    };

    window.addEventListener('global-toast', handleToast);
    return () => window.removeEventListener('global-toast', handleToast);
  }, []);

  // Single ticking cleanup (only while toasts exist) — avoids per-toast timers
  // that could double-fire in StrictMode.
  useEffect(() => {
    if (toasts.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => t.expiresAt > now));
    }, 300);
    return () => clearInterval(interval);
  }, [toasts.length]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-black/5 pointer-events-auto bg-white/95 backdrop-blur-xl w-full mx-auto`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
              toast.type === 'error' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' :
              toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
              'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
            }`} />
            <span className="text-[14.5px] font-semibold text-slate-800 leading-snug">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
