/** Tipo de aviso emergente; define el color del borde lateral */
export type ToastKind = 'success' | 'info' | 'warning' | 'error';

/** Aviso emergente en pantalla, manejado por ToastStore */
export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  createdAt: number;
  /** Milisegundos que permanece visible antes de cerrarse solo */
  ttlMs: number;
}
