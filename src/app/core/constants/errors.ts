/**
 * Codigos de error que los servicios lanzan y los componentes interpretan.
 *
 * Se declaran como constantes para que el componente no tenga que comparar
 * contra una cadena escrita a mano, que es facil de escribir mal.
 */

/** Lo lanzan los metodos de escritura cuando no hay sesion iniciada */
export const AUTH_REQUIRED = 'AUTH_REQUIRED';
