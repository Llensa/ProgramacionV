import { Injectable, Signal, computed, signal } from '@angular/core';

const LS_KEY = 'yenzaplayg.favorites.v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private idsSig = signal<number[]>(this.read());

  /** ✅ lista reactiva (Signal) */
  readonly ids: Signal<number[]> = this.idsSig.asReadonly();

  /** ✅ set reactivo para checks rápidos */
  readonly idsSet = computed(() => new Set(this.idsSig()));

  has(id: number): boolean {
    return this.idsSet().has(Number(id));
  }

  toggle(id: number): void {
    const n = Number(id);
    const current = this.idsSig();
    const next = current.includes(n)
      ? current.filter(x => x !== n)
      : [...current, n];

    this.idsSig.set(next);
    this.write(next);
  }

  add(id: number): void {
    const n = Number(id);
    if (this.has(n)) return;
    const next = [...this.idsSig(), n];
    this.idsSig.set(next);
    this.write(next);
  }

  remove(id: number): void {
    const n = Number(id);
    const next = this.idsSig().filter(x => x !== n);
    this.idsSig.set(next);
    this.write(next);
  }

  clear(): void {
    this.idsSig.set([]);
    this.write([]);
  }

  // ✅ aliases por compatibilidad (si algún componente viejo los usa)
  isFavorite(id: number): boolean {
    return this.has(id);
  }
  toggleFavorite(gameOrId: any): void {
    const id = typeof gameOrId === 'number' ? gameOrId : Number(gameOrId?.id);
    if (!Number.isFinite(id)) return;
    this.toggle(id);
  }

  private read(): number[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(Number).filter(n => Number.isFinite(n));
    } catch {
      return [];
    }
  }

  private write(ids: number[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch {}
  }
}
