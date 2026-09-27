import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'danger';
export type Toast = { id: number; message: string; tone: ToastTone; action?: { label: string; onPress: () => void } };

type ToastState = { current: Toast | null; show: (t: Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone }) => void; hide: () => void };

let seq = 0;
export const useToast = create<ToastState>()((set) => ({
  current: null,
  show: (t) => set({ current: { tone: 'default', ...t, id: ++seq } }),
  hide: () => set({ current: null }),
}));

export const toast = (message: string, opts: { tone?: ToastTone; action?: Toast['action'] } = {}) =>
  useToast.getState().show({ message, ...opts });
