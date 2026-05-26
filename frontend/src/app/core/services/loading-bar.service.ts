import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private _requests = 0;
  private _routing = false;
  private readonly _loading = signal(false);

  readonly loading = this._loading.asReadonly();

  constructor() {
    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._routing = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationError ||
        event instanceof NavigationCancel
      ) {
        this._routing = false;
      }
      this._sync();
    });
  }

  increment(): void {
    this._requests++;
    this._sync();
  }

  decrement(): void {
    if (this._requests > 0) this._requests--;
    this._sync();
  }

  private _sync(): void {
    this._loading.set(this._requests > 0 || this._routing);
  }
}
