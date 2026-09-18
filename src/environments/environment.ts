export const environment = {
  production: false,

  /**
   * URLs de servicios externos. Viven aca y no dentro de cada servicio
   * para que se puedan cambiar en un solo lugar y para que quede a la
   * vista de que depende la aplicacion.
   */
  /** Proxy propio en Cloudflare: resuelve CORS, pagina y cachea */
  apiBaseUrl: 'https://freetogame-proxy.juanpablollensa.workers.dev/api',
  /** API de traduccion usada por el modulo adicional */
  translationApiUrl: 'https://api.mymemory.translated.net/get',

  firebase: {
    apiKey: "AIzaSyBhcaujSMFWwubk6R2llVom8BC192YNkOM",
    authDomain: "yenzaplayg.firebaseapp.com",
    projectId: "yenzaplayg",
    storageBucket: "yenzaplayg.firebasestorage.app",
    messagingSenderId: "226624826487",
    appId: "1:226624826487:web:33bae4b03587012bc06a72",
    measurementId: "G-G4MBNQTS70",
  },
};
