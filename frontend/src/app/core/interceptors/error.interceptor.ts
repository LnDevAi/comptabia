import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');

      if (err.status === 401 && !isAuthEndpoint) {
        router.navigate(['/auth/login']);
      } else if (err.status === 403) {
        toast.error('Accès refusé — vous n\'avez pas les droits nécessaires.');
      } else if (err.status === 409) {
        const msg = err.error?.message ?? 'Conflit — cette ressource existe déjà.';
        toast.warning(msg);
      } else if (err.status === 400 || err.status === 422) {
        const msg = err.error?.message ?? 'Données invalides.';
        toast.warning(msg);
      } else if (err.status >= 500) {
        toast.error('Erreur serveur — veuillez réessayer ou contacter le support.');
      } else if (err.status === 0) {
        toast.error('Erreur réseau — vérifiez votre connexion internet.');
      }

      return throwError(() => err);
    })
  );
};
