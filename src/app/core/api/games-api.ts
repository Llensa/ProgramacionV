import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';

export interface GameListItem {
  id: number;
  title: string;
  thumbnail: string;
  short_description: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher?: string;
  developer?: string;
  release_date?: string;
}

export interface GameScreenshot {
  id: number;
  image: string;
}

export interface GameDetail extends GameListItem {
  status?: string;
  description?: string;
  freetogame_profile_url?: string;
  screenshots?: GameScreenshot[];
  minimum_system_requirements?: {
    os?: string;
    processor?: string;
    memory?: string;
    graphics?: string;
    storage?: string;
  };
}

export interface GameListResponse {
  items: GameListItem[];
  total: number;
}

export type GetGamesOptions = {
  page?: number;
  pageSize?: number;
  platform?: 'pc' | 'browser' | 'all';
  category?: string;
  sortBy?: 'release-date' | 'alphabetical' | 'popularity' | 'relevance';
};

@Injectable({ providedIn: 'root' })
export class GamesApiService {
  private http = inject(HttpClient);

  // ✅ base del proxy (prod) o override por window.__CFG__ (dev)
  private readonly baseUrl =
    (typeof window !== 'undefined' && (window as any).__CFG__?.apiBaseUrl)
    || 'https://freetogame-proxy.juanpablollensa.workers.dev/api';

  // cache simple 5 min
  private cache = new Map<string, { ts: number; obs$: Observable<any> }>();
  private ttlMs = 5 * 60 * 1000;

  getGames(opts: GetGamesOptions = {}): Observable<GameListResponse> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 24;

    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (opts.platform) params = params.set('platform', opts.platform);
    if (opts.category) params = params.set('category', opts.category);
    if (opts.sortBy) params = params.set('sort-by', opts.sortBy);

    const key = `games?${params.toString()}`;
    return this.cachedGet<any>(`${this.baseUrl}/games`, params, key).pipe(
      map((res: any) => {
        // proxy ideal: { items, total }
        if (res && Array.isArray(res.items)) {
          return { items: res.items as GameListItem[], total: Number(res.total ?? res.items.length) };
        }

        // fallback: si alguna vez viniera array
        const arr = Array.isArray(res) ? (res as GameListItem[]) : [];
        return { items: arr, total: arr.length };
      })
    );
  }

  getGameById(id: number): Observable<GameDetail> {
    const n = Number(id);
    const params = new HttpParams().set('id', String(n));
    const key = `game?id=${n}`;
    return this.cachedGet<GameDetail>(`${this.baseUrl}/game`, params, key);
  }

  private cachedGet<T>(url: string, params: HttpParams, key: string): Observable<T> {
    const hit = this.cache.get(key);
    const now = Date.now();
    if (hit && now - hit.ts < this.ttlMs) return hit.obs$;

    const req$ = this.http.get<T>(url, { params }).pipe(
      retry({ count: 2, delay: (_e, c) => timer(250 * (c + 1)) }),
      catchError((err: HttpErrorResponse) => {
        // 🔥 importantísimo: si falla, no cachear el error
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    this.cache.set(key, { ts: now, obs$: req$ });
    return req$;
  }
}
