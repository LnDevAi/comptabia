import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LoadingBarService } from '../../../core/services/loading-bar.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bar.loading()) {
      <div class="fixed top-0 left-0 right-0 z-[10000] h-0.5 overflow-hidden bg-blue-100">
        <div class="h-full bg-blue-500 loading-bar-track"></div>
      </div>
    }
  `,
  styles: [`
    @keyframes loading-bar {
      0%   { transform: translateX(-100%); width: 60%; }
      60%  { transform: translateX(40%);  width: 80%; }
      100% { transform: translateX(200%); width: 60%; }
    }
    .loading-bar-track {
      animation: loading-bar 1.4s ease-in-out infinite;
    }
  `]
})
export class LoadingBarComponent {
  readonly bar = inject(LoadingBarService);
}
