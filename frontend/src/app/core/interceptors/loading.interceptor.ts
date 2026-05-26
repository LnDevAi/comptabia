import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingBarService } from '../services/loading-bar.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const bar = inject(LoadingBarService);
  bar.increment();
  return next(req).pipe(finalize(() => bar.decrement()));
};
