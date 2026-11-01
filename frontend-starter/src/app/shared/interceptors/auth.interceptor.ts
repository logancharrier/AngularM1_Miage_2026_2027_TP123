import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Adds the bearer token to protected API requests and handles 401 Unauthorized errors. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authReq = token
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : request;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Redirige vers /login et nettoie la session si le token est invalide ou expiré
        // (sauf pour la requête de login elle-même afin de laisser la page afficher son erreur)
        if (!request.url.includes('/api/auth/login')) {
          auth.logout();
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => error);
    }),
  );
};
