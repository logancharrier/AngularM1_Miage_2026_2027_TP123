import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TrackService } from './track.service';

describe('TrackService', () => {
  it('list() transmet page et limit dans les query params', () => {
    const mockHttp = {
      get: vi.fn().mockReturnValue(of({ items: [], page: 2, limit: 5, total: 0, pages: 1 })),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: TrackService, useClass: TrackService },
      ],
    });

    const service = injector.get(TrackService);

    service.list(2, 5).subscribe((res) => {
      expect(res.page).toBe(2);
    });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/tracks', {
      params: { page: 2, limit: 5 },
    });
  });

  it('delete() appelle DELETE /api/tracks/:id', () => {
    const mockHttp = {
      delete: vi.fn().mockReturnValue(of(undefined)),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: TrackService, useClass: TrackService },
      ],
    });

    const service = injector.get(TrackService);

    service.delete('track-abc').subscribe();

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/tracks/track-abc');
  });

  it('upload() construit un FormData avec audio et title et demande la progression', () => {
    const mockHttp = {
      post: vi.fn().mockReturnValue(of({ type: 0 })),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: TrackService, useClass: TrackService },
      ],
    });

    const service = injector.get(TrackService);
    const file = new File(['contenu-audio'], 'morceau.mp3', { type: 'audio/mpeg' });

    service.upload(file, 'Solo blues').subscribe();

    const [url, body, options] = mockHttp.post.mock.calls[0];
    expect(url).toBe('/api/tracks');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('title')).toBe('Solo blues');
    expect((body.get('audio') as File).name).toBe('morceau.mp3');
    expect(options).toEqual({ reportProgress: true, observe: 'events' });
  });

  it('audio() demande le flux en responseType blob', () => {
    const blob = new Blob(['audio'], { type: 'audio/mpeg' });
    const mockHttp = {
      get: vi.fn().mockReturnValue(of(blob)),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: TrackService, useClass: TrackService },
      ],
    });

    const service = injector.get(TrackService);

    service.audio('track-abc').subscribe((response) => {
      expect(response).toBe(blob);
    });

    expect(mockHttp.get).toHaveBeenCalledWith('/api/tracks/track-abc/audio', {
      responseType: 'blob',
    });
  });
});
