import { Injectable, signal } from '@angular/core';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  dialog = signal<ConfirmDialog | null>(null);

  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.dialog.set({
        title: options.title ?? 'Confirmar',
        message: options.message,
        confirmText: options.confirmText ?? 'Aceptar',
        cancelText: options.cancelText ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve
      });
    });
  }

  aceptar(): void {
    const d = this.dialog();
    if (d) {
      d.resolve(true);
      this.dialog.set(null);
    }
  }

  cancelar(): void {
    const d = this.dialog();
    if (d) {
      d.resolve(false);
      this.dialog.set(null);
    }
  }
}