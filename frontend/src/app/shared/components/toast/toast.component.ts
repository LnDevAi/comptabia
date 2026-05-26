import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';

const WRAP: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      @for (t of svc.toasts(); track t.id) {
        <div [class]="wrapClass(t.type)"
             class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm toast-enter">
          <span class="shrink-0 mt-0.5 font-bold">{{ icon(t.type) }}</span>
          <span class="flex-1 leading-snug">{{ t.message }}</span>
          <button (click)="svc.dismiss(t.id)"
                  class="shrink-0 opacity-50 hover:opacity-100 transition leading-none ml-1">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-enter {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    .toast-enter { animation: toast-enter 0.22s ease-out; }
  `]
})
export class ToastComponent {
  readonly svc = inject(ToastService);

  wrapClass(type: ToastType): string { return WRAP[type]; }
  icon(type: ToastType): string      { return ICON[type]; }
}
