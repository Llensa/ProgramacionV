import { Injectable, computed, effect, signal } from '@angular/core';

import { Theme } from '../models/theme';
import { STORAGE_KEYS } from '../constants/storage-keys';

/**
 * Maneja el tema visual de la aplicación.
 *
 * El valor se aplica como atributo `data-theme` en el <html>, que es lo que
 * leen los tokens CSS definidos en styles.css. El index.html aplica el tema
 * guardado antes del primer pintado para evitar el parpadeo blanco.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSig = signal<Theme>(this.readInitial());

  /** Tema activo (solo lectura) */
  theme = this.themeSig.asReadonly();
  isDark = computed(() => this.themeSig() === 'dark');

  constructor() {
    // Cada vez que cambia la señal: se aplica al DOM y se persiste.
    effect(() => {
      const t = this.themeSig();
      document.documentElement.setAttribute('data-theme', t);

      try {
        localStorage.setItem(STORAGE_KEYS.theme, t);
      } catch {
        // modo privado o storage deshabilitado: el tema igual se aplica
      }

      // Color de la barra del navegador en móviles
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', t === 'dark' ? '#0B0B0F' : '#f4f5fa');
    });
  }

  toggle() {
    this.themeSig.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  set(t: Theme) {
    this.themeSig.set(t);
  }

  /** Preferencia guardada; si es la primera visita, la del sistema operativo */
  private readInitial(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignorado a propósito
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
