/**
 * Imagen de reemplazo (SVG embebido en data-URI) para cuando la miniatura
 * de un juego no existe o falla la descarga.
 * Se define como constante compartida para que cualquier componente que
 * muestre imágenes de la API use el mismo placeholder.
 */
export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#111827"/>
        <stop offset="1" stop-color="#1f2937"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
      fill="#9ca3af" font-family="system-ui,Segoe UI,Roboto,Arial" font-size="28">
      Imagen no disponible
    </text>
  </svg>
`);
