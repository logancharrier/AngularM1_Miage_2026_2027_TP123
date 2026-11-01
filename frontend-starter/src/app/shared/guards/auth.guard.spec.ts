import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Router, UrlTree } from '@angular/router';
import { runInInjectionContext, Injector, signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  it('autorise la navigation si un token existe', () => {
    const mockAuthService = {
      token: signal('valid-token'),
    };
    const mockRouter = {
      parseUrl: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(mockRouter.parseUrl).not.toHaveBeenCalled();
  });

  it('redirige vers /login si aucun token n’existe', () => {
    const fakeUrlTree = {} as UrlTree;
    const mockAuthService = {
      token: signal<string | null>(null),
    };
    const mockRouter = {
      createUrlTree: vi.fn().mockReturnValue(fakeUrlTree),
    };

    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(fakeUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
