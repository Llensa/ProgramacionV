import { Injectable } from '@angular/core';

const LS_KEY = 'favorites.v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private read(): number[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  }
  private write(list: number[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
  }

  list(): number[] { return this.read(); }
  has(id: number): boolean { return this.read().includes(id); }
  add(id: number) { if (!this.has(id)) this.write([...this.read(), id]); }
  remove(id: number) { this.write(this.read().filter(x => x !== id)); }
  toggle(id: number) { this.has(id) ? this.remove(id) : this.add(id); }
}
