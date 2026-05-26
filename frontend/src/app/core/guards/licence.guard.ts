import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LicenceService } from '../services/licence.service';
import { LicenceModule } from '../models/licence.model';

export function licenceGuard(module: LicenceModule): CanActivateFn {
  return () => {
    const svc = inject(LicenceService);
    const router = inject(Router);
    if (svc.hasModule(module)) return true;
    return router.createUrlTree(['/dashboard'], {
      queryParams: { moduleBloque: module }
    });
  };
}
