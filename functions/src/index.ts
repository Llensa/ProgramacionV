import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

type FieldKey = "description" | "short_description";

function docId(gameId: number, lang: string, field: string) {
  // id estable y seguro para Firestore
  return `${gameId}_${lang}_${field}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export const translateText = onCall(
  { region: "us-central1" },
  async (req) => {
    // Si querés exigir login (recomendado para evitar abuso):
    // if (!req.auth) throw new HttpsError("unauthenticated", "Iniciá sesión para traducir.");

    const gameId = Number(req.data?.gameId);
    const targetLang = String(req.data?.targetLang || "").toLowerCase();
    const field = String(req.data?.field || "") as FieldKey;
    const text = String(req.data?.text || "");

    if (!Number.isFinite(gameId) || gameId <= 0) {
      throw new HttpsError("invalid-argument", "gameId inválido.");
    }
    if (!targetLang || targetLang.length < 2 || targetLang.length > 10) {
      throw new HttpsError("invalid-argument", "targetLang inválido.");
    }
    if (field !== "description" && field !== "short_description") {
      throw new HttpsError("invalid-argument", "field inválido.");
    }
    if (!text || text.length < 5) {
      return { translated: text };
    }
    if (text.length > 6000) {
      throw new HttpsError("invalid-argument", "Texto demasiado largo (máx 6000).");
    }

    // Cache en Firestore
    const id = docId(gameId, targetLang, field);
    const ref = db.collection("translations").doc(id);
    const snap = await ref.get();

    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.translatedText) {
        return { translated: data.translatedText, cached: true };
      }
    }

    // MyMemory: asume source EN -> target
    const sourceLang = "en";
    const url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text) +
      "&langpair=" +
      encodeURIComponent(`${sourceLang}|${targetLang}`);

    const r = await fetch(url);
    if (!r.ok) {
      throw new HttpsError("unavailable", "No se pudo traducir (servicio externo).");
    }

    const json: any = await r.json();
    const translated = String(json?.responseData?.translatedText || "").trim();

    // Si falla raro, devolvemos original
    const finalText = translated || text;

    await ref.set(
      {
        gameId,
        field,
        sourceLang,
        targetLang,
        sourceText: text,
        translatedText: finalText,
        provider: "mymemory",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { translated: finalText, cached: false };
  }
);
