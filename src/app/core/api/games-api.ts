import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  freetogame_profile_url?: string;
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

  private readonly baseUrl =
    (typeof window !== 'undefined' && (window as any).__CFG__?.apiBaseUrl)
    || 'https://freetogame-proxy.juanpablollensa.workers.dev/api';

  /** Listado con paginado simulado por el proxy */
  getGames(opts: GetGamesOptions): Observable<GameListResponse> {
    let params = new HttpParams();
    if (opts.platform) params = params.set('platform', opts.platform);
    if (opts.category) params = params.set('category', opts.category);
    if (opts.sortBy)  params = params.set('sort-by', opts.sortBy);

    // nuestro worker admite ?page=&pageSize=
    if (opts.page)     params = params.set('page', String(opts.page));
    if (opts.pageSize) params = params.set('pageSize', String(opts.pageSize));

    const url = `${this.baseUrl}/games`;
    return this.http.get<GameListItem[] | { items: GameListItem[]; total: number }>(url, { params }).pipe(
      map((res: any) => {
        // si el worker ya devuelve {items,total}, lo respetamos; si no, lo adaptamos
        if (res && Array.isArray(res.items)) return res as GameListResponse;
        const arr = Array.isArray(res) ? (res as GameListItem[]) : [];
        const page = opts.page ?? 1;
        const pageSize = opts.pageSize ?? arr.length;
        const start = (page - 1) * pageSize;
        const sliced = arr.slice(start, start + pageSize);
        return { items: sliced, total: arr.length } as GameListResponse;
      }),
    );
  }

  
  getGameById(id: number) {
  const params = new HttpParams().set('id', String(id));
  const url = `${this.baseUrl}/game`;
  return this.http.get<any>(url, { params });
}

}
