# YenzaPlayG

SPA desarrollada en **Angular 20** para explorar el catálogo de juegos
free-to-play de [FreeToGame](https://www.freetogame.com), con autenticación,
persistencia en la nube y comunidad.

**Aplicación en producción:** https://yenzaplayg.web.app

Proyecto final de **Programación V** — Licenciatura en Sistemas de Información.

---

## Funcionalidades

- **Explorar**: catálogo con scroll infinito, buscador por texto con debounce y
  filtros por plataforma, categoría y orden. El estado de los filtros vive en la
  URL, así que cualquier búsqueda se puede compartir como enlace.
- **Detalle**: galería de capturas con slider, requisitos mínimos y traducción
  automática de la descripción a cinco idiomas.
- **Autenticación**: registro, inicio de sesión, verificación por email y
  recuperación de contraseña con Firebase Authentication.
- **Rutas protegidas**: guard funcional asíncrono que espera a que Firebase
  restaure la sesión antes de decidir.
- **Favoritos**: CRUD completo sobre Cloud Firestore, sincronizado en tiempo real
  entre pestañas y dispositivos.
- **Comunidad**: comentarios y calificaciones por juego, con promedios calculados
  mediante transacciones atómicas.
- **Cuenta**: nombre visible único y preferencias de notificaciones.
- **Tema claro / oscuro** con detección de la preferencia del sistema.

## Arquitectura

```
src/app/
├── core/          # servicios, guards, interceptores, modelos (singleton)
│   ├── api/       # consumo de la API externa
│   ├── guards/    # protección de rutas
│   ├── models/    # interfaces de dominio
│   └── services/  # auth, favoritos, comunidad, traducción, tema
├── features/      # una carpeta por ruta, todas con lazy loading
└── shared/        # componentes, pipes y directivas reutilizables
```

Decisiones principales:

- **Componentes standalone** y carga diferida por ruta (`loadComponent`).
- **Zoneless change detection** con *signals* en lugar de Zone.js.
- **Los componentes no conocen Firebase**: acceden solo a través de servicios,
  de modo que la capa de persistencia queda aislada.
- **Proxy en Cloudflare Workers** para consumir FreeToGame, que no expone
  cabeceras CORS. El worker además pagina y cachea las respuestas.
- **Reglas de seguridad en Firestore** que validan campo por campo con
  `hasOnly()`, en vez de confiar solo en la validación del cliente.

## Stack

Angular 20 · TypeScript 5.9 · RxJS 7.8 · Firebase (Auth, Firestore, Hosting) ·
AngularFire 20 · Cloudflare Workers

## Puesta en marcha

```bash
npm install
npm start           # servidor de desarrollo en http://localhost:4200
```

Las credenciales de Firebase se configuran en `src/environments/environment.ts`.

## Despliegue

```bash
npm run deploy      # ng build && firebase deploy --only hosting
```

Reglas de Firestore:

```bash
firebase deploy --only firestore:rules
```

## Autor

Juan Pablo Llensa — Programación V, 2026.
