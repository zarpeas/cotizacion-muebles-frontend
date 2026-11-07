import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts = signal<Toast[]>([]);

  success(message: string, duration = 3000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4000): void {
    this.show('error', message, duration);
  }

  info(message: string, duration = 3000): void {
    this.show('info', message, duration);
  }

  private show(type: ToastType, message: string, duration: number): void {
    const id = ++this.counter;
    const toast: Toast = { id, type, message };
    this.toasts.update(arr => [...arr, toast]);

    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number): void {
    this.toasts.update(arr => arr.filter(t => t.id !== id));
  }
}