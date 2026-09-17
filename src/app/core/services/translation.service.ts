import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc } from '@angular/fire/firestore';
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

/** MyMemory limita las peticiones anónimas a ~500 caracteres */
const MAX_CHUNK = 450;
const API_URL = 'https://api.mymemory.translated.net/get';

export type TranslatableField = 'description' | 'short_description';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private fs = inject(Firestore);
  private auth = inject(AuthService);
  private injector = inject(Injector);

  /** Id estable y seguro para Firestore */
  private docId(gameId: number, lang: string, field: string): string {
    return `${gameId}_${lang}_${field}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Traduce un texto EN -> targetLang.
   * Estrategia: primero busca en la caché de Firestore; si no está,
   * llama a la API externa y guarda el resultado para próximas consultas.
   */
  async translate(input: {
    gameId: number;
    field: TranslatableField;
    text: string;
    targetLang?: string;
  }): Promise<string> {
    const targetLang = (input.targetLang ?? 'es').toLowerCase();
    const text = (input.text ?? '').trim();
    if (text.length < 5) return text;

    const ref = doc(this.fs, `translations/${this.docId(input.gameId, targetLang, input.field)}`);

    // 1) Caché: evita gastar cuota de la API con textos ya traducidos
    try {
      const snap = await runInInjectionContext(this.injector, () => getDoc(ref));
      const cached = snap.exists() ? (snap.data() as any)?.translatedText : null;
      if (cached) return String(cached);
    } catch {
      // si falla la lectura seguimos con la API
    }

    // 2) Traducción por partes (la API corta en 500 caracteres)
    const chunks = this.splitText(text, MAX_CHUNK);
    const parts: string[] = [];
    for (const c of chunks) {
      parts.push(await this.callApi(c, targetLang));
    }
    const translated = parts.join(' ').trim() || text;

    // 3) Guardar en caché (solo usuarios logueados; si falla, no molestamos)
    if (this.auth.user()) {
      try {
        await setDoc(
          ref,
          {
            gameId: Number(input.gameId),
            field: input.field,
            sourceLang: 'en',
            targetLang,
            translatedText: translated,
            provider: 'mymemory',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // sin permisos de escritura: la traducción igual se muestra
      }
    }

    return translated;
  }

  private async callApi(q: string, targetLang: string): Promise<string> {
    const res: any = await firstValueFrom(
      this.http.get(API_URL, { params: { q, langpair: `en|${targetLang}` } })
    );
    const t = String(res?.responseData?.translatedText ?? '').trim();
    if (!t) throw new Error('Traducción vacía');
    return t;
  }

  /** Corta el texto en bloques respetando el final de las oraciones */
  private splitText(text: string, max: number): string[] {
    if (text.length <= max) return [text];

    const sentences = text.split(/(?<=[.!?])\s+/);
    const out: string[] = [];
    let buf = '';

    for (const s of sentences) {
      if ((buf + ' ' + s).trim().length > max) {
        if (buf) out.push(buf.trim());
        if (s.length > max) {
          // oración más larga que el límite: corte duro
          for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
          buf = '';
        } else {
          buf = s;
        }
      } else {
        buf = buf ? `${buf} ${s}` : s;
      }
    }

    if (buf.trim()) out.push(buf.trim());
    return out;
  }
}
