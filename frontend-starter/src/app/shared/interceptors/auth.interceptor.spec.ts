import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { runInInjectionContext, Injector, signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  it("ajoute l'en-tête Authorization lorsqu'un token existe", () => {
    const mockAuthService = {
      token: signal('sample-jwt-token'),
      logout: vi.fn(),
    };
    const mockRouter = {
      navigateByUrl: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    const req = new HttpRequest('GET', '/api/tracks');
    let capturedReq: HttpRequest<unknown> | null = null;
    const next: HttpHandlerFn = (r) => {
      capturedReq = r;
      return of({} as any);
    };

    runInInjectionContext(injector, () => {
      authInterceptor(req, next).subscribe();
    });

    expect(capturedReq).not.toBeNull();
    expect(capturedReq!.headers.get('Authorization')).toBe('Bearer sample-jwt-token');
  });

  it("ne modifie pas l'en-tête Authorization si aucun token n'est présent", () => {
    const mockAuthService = {
      token: signal<string | null>(null),
      logout: vi.fn(),
    };
    const mockRouter = {
      navigateByUrl: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    const req = new HttpRequest('GET', '/api/health');
    let capturedReq: HttpRequest<unknown> | null = null;
    const next: HttpHandlerFn = (r) => {
      capturedReq = r;
      return of({} as any);
    };

    runInInjectionContext(injector, () => {
      authInterceptor(req, next).subscribe();
    });

    expect(capturedReq).not.toBeNull();
    expect(capturedReq!.headers.has('Authorization')).toBe(false);
  });

  it('déclenche logout et redirection vers /login sur une erreur 401', () => {
    const mockAuthService = {
      token: signal('expired-jwt'),
      logout: vi.fn(),
    };
    const mockRouter = {
      navigateByUrl: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    const req = new HttpRequest('GET', '/api/tracks');
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));

    runInInjectionContext(injector, () => {
      authInterceptor(req, next).subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
        },
      });
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
