export type ToastType = 'success' | 'error' | 'info';

export const emitToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('global-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

export const toast = {
  success: (msg: string) => emitToast(msg, 'success'),
  error: (msg: string) => emitToast(msg, 'error'),
  info: (msg: string) => emitToast(msg, 'info'),
};
