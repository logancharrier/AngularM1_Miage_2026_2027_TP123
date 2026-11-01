import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  key: (index: number) => Object.keys(storage)[index] ?? null,
  get length() { return Object.keys(storage).length; },
};

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login() utilise POST /api/auth/login avec le bon corps et met à jour le token', () => {
    const mockResponse = {
      token: 'jwt-test-token',
      user: { id: 'u1', name: 'Guitarist', email: 'test@example.com', createdAt: '2026-01-01' },
    };

    const mockHttp = {
      post: vi.fn().mockReturnValue(of(mockResponse)),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: AuthService, useClass: AuthService },
      ],
    });

    const service = injector.get(AuthService);

    service.login('test@example.com', 'Secret123!').subscribe((res) => {
      expect(res.token).toBe('jwt-test-token');
      expect(service.token()).toBe('jwt-test-token');
      expect(service.currentUser()?.name).toBe('Guitarist');
    });

    expect(mockHttp.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'Secret123!',
    });
  });

  it('logout() nettoie le token, currentUser et le localStorage', () => {
    const mockHttp = {
      post: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: AuthService, useClass: AuthService },
      ],
    });

    const service = injector.get(AuthService);
    service.token.set('temp-token');
    service.currentUser.set({ id: '1', name: 'A', email: 'a@a.com', createdAt: '2026-01-01' });

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});
