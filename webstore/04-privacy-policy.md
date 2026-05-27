# Política de privacidad de FocusGuard

_Última actualización: 22 de mayo de 2026._

FocusGuard ("nosotros", "la extensión") es una extensión de Chrome diseñada para bloquear webs distractoras durante horarios definidos por el usuario, con una capa de gamificación basada en rachas y minutos enfocados.

Esta política explica qué datos maneja la extensión, cómo se almacenan y con quién se comparten. **Resumen: nada sale de tu navegador.**

## 1. Qué datos guarda FocusGuard

La extensión almacena en `chrome.storage.local` (almacenamiento local de tu navegador, en tu propio equipo) la siguiente información:

- **Configuración de bloques horarios**: nombres, horas de inicio/fin, días de la semana, estado activado/desactivado.
- **Lista de dominios bloqueados**: las webs que tú añades a la lista (por defecto: youtube.com, x.com, instagram.com, reddit.com, tiktok.com, facebook.com, netflix.com).
- **Estadísticas de uso personal**: racha actual, mejor racha histórica, minutos enfocados de hoy, historial de minutos enfocados de los últimos 30 días, número total de bloqueos prevenidos, número total de breaks usados.
- **Preferencias**: si los mensajes motivacionales están activados, si los sonidos están activados, tema visual.
- **Breaks activos**: dominios temporalmente desbloqueados tras confirmar "Romper bloqueo" y sus fechas de expiración.

## 2. Dónde se guardan los datos

**Únicamente en tu navegador, en tu equipo.** FocusGuard no tiene servidores propios ni envía nada a ningún servicio remoto.

Los datos persisten entre cierres del navegador gracias a `chrome.storage.local`, que es un almacenamiento gestionado por Chrome equivalente a una base de datos local.

## 3. Datos que NO recoge

FocusGuard **no recoge**:

- Identificadores personales (nombre, email, IP, ID publicitarios).
- Historial de navegación (qué webs visitas fuera del flujo de bloqueo).
- Contenido de páginas web.
- Telemetría, analytics ni métricas de uso.
- Localización geográfica.
- Datos biométricos.
- Información financiera.

## 4. Conexiones de red

La única conexión externa que realiza la extensión es a `google.com/s2/favicons` para obtener los iconos visuales de los dominios que has añadido a tu lista de bloqueo (estos iconos se muestran en el popup junto a cada dominio). Esta petición:

- Es realizada por el navegador, no por nuestros servidores.
- No envía ningún identificador de usuario.
- No se hace en ningún otro momento ni con ningún otro fin.

Puedes verificarlo abriendo DevTools (F12 → Network) mientras usas el popup.

## 5. Compartición con terceros

**Cero.** Como no recogemos datos, no hay nada que compartir.

## 6. Sincronización entre dispositivos

FocusGuard usa `chrome.storage.local` (no `chrome.storage.sync`), por lo que tu configuración **no se sincroniza** entre distintos navegadores ni dispositivos. Si quieres trasladar tu configuración, usa la función "Exportar JSON" del popup → "Importar JSON" en el otro navegador.

## 7. Derechos del usuario

Como toda la información está en tu navegador:

- **Acceder**: la ves directamente en la página de opciones de la extensión.
- **Modificar**: la editas desde el popup o la página de opciones.
- **Exportar**: usa el botón "Exportar JSON" en Ajustes.
- **Eliminar**: usa "Restablecer todo" en Ajustes, o desinstala la extensión desde `chrome://extensions`.

## 8. Cookies y trackers

FocusGuard no usa cookies, ni pixels, ni fingerprinting, ni ningún mecanismo de tracking.

## 9. Menores

La extensión no está dirigida específicamente a menores, ni recoge datos de menores (ni de nadie).

## 10. Cambios en esta política

Si la política cambia, actualizaremos esta página y la fecha de última actualización al inicio del documento. Cambios materiales se anunciarán en las notas de la actualización en Chrome Web Store.

## 11. Contacto

¿Preguntas? Abre un issue en el repositorio: [URL del repo público]

---

**Política aplicable a la versión 1.0.0 y posteriores.**
