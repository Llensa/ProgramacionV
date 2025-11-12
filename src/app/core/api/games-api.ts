import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, retry, shareReplay } from 'rxjs/operators';

export interface GameListItem {
  id: number; title: string; thumbnail: string; short_description: string;
  genre: string; platform: string; publisher: string; developer: string; release_date: string;
}
export interface GameListResponse { page: number; pageSize: number; total: number; items: GameListItem[]; }

type CacheEntry<T> = { exp: number; obs$: Observable<T> };

@Injectable({ providedIn: 'root' })
export class GamesApiService {
  private http = inject(HttpClient);
  private readonly baseUrl =
  (typeof window !== 'undefined' && (window as any).__CFG__?.apiBaseUrl)
  || 'https://freetogame-proxy.juanpablollensa.workers.dev/api';


  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttlMs = 1000 * 60 * 5;

  private getWithCache<T>(path: string, params: HttpParams): Observable<T> {
    const key = `${path}?${params.toString()}`;
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.exp > now) return hit.obs$;

    const obs$ = this.http.get<T>(`${this.baseUrl}${path}`, { params }).pipe(
      retry({ count: 2, delay: (_, i) => timer(300 * (i + 1)) }),
      shareReplay(1)
    );

    this.cache.set(key, { exp: now + this.ttlMs, obs$ });
    return obs$;
  }

  getGames(o?: { page?: number; pageSize?: number; platform?: string; category?: string; sortBy?: string; }): Observable<GameListResponse> {
    let params = new HttpParams()
      .set('page', String(o?.page ?? 1))
      .set('pageSize', String(o?.pageSize ?? 24));
    if (o?.platform) params = params.set('platform', o.platform);
    if (o?.category) params = params.set('category', o.category);
    if (o?.sortBy) params = params.set('sort-by', o.sortBy);

    return this.getWithCache<GameListResponse>('/games', params).pipe(
      catchError(err => {
        console.error('[GamesApi] getGames error', err);
        return of({ page: 1, pageSize: 0, total: 0, items: [] });
      })
    );
  }

  getGameById(id: number): Observable<any> {
    const params = new HttpParams().set('id', String(id));
    return this.getWithCache<any>('/game', params).pipe(
      catchError(err => { console.error('[GamesApi] getGameById error', err); return of(null); })
    );
  }
}
