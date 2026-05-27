# FocusGuard

Versión: **1.1.0** · MIT · Manifest V3

Tu guardián del foco. Bloquea distracciones, construye tu racha.

FocusGuard es una extensión de Chrome (Manifest V3) que bloquea webs distractoras
durante los horarios que tú definas, con una capa de gamificación: rachas
diarias, minutos enfocados acumulados, y fricción deliberada para romper el
bloqueo (incluido un confirm donde tienes que escribir literalmente `ROMPER`).

La idea detrás del diseño: los bloqueos rígidos fallan porque el usuario los
desinstala. Los bloqueos con streaks funcionan porque nadie quiere perder su
racha. Por eso FocusGuard añade fricción para romper, premia la constancia, y
evita el tono de "app que regaña".

## Novedades 1.1.0

- **Pomodoro quick start**: botones 25/50/90 min en el panel Estado para crear un bloque de foco temporal e instantáneo (se autodestruye al expirar).
- **Color de acento configurable**: cuatro paletas (verde, ámbar, azul, púrpura) que cambian toda la UI incluida la pantalla de bloqueo, con transición suave.
- **Bloquear pestaña activa**: botón en la tab Webs que lee la URL actual y la añade en un click.
- **Logros desbloqueables**: 6 badges visuales que se iluminan al alcanzar hitos de racha (3/7/14/30 días) y bloqueos prevenidos (50/250).

## Características

- Bloques horarios configurables por día (L–V, S–D, personalizado).
- Defaults sensatos: YouTube, X/Twitter, Instagram, Reddit, TikTok, Facebook,
  Netflix.
- Subdominios cubiertos automáticamente con una sola entrada
  (`youtube.com` cubre `m.youtube.com`, `music.youtube.com`, etc.).
- Pantalla de bloqueo a página completa con countdown vivo, racha, mensaje
  motivacional rotativo (40 frases) y barra de progreso.
- Sistema de streak con rollover diario a medianoche local.
- "Romper bloqueo" con doble confirmación (escribir `ROMPER`) que reinicia la
  racha y concede 5 minutos antes de volver a bloquear automáticamente.
- Gráfico de barras CSS animado con los últimos 7 días.
- Persistencia local con esquema versionado y migración preparada.
- Página de opciones ampliada con stats agregados y gráfico semanal.

## Estructura

```
manifest.json
background.js          # Service worker MV3 + alarms + reglas dnr
popup.html/css/js      # Popup 360×560 con 4 tabs e indicador deslizante
block.html/css/js      # Pantalla de bloqueo full-screen con orb animado
options.html/css/js    # Página de opciones ampliada
utils/
  storage.js           # Wrapper de chrome.storage.local + esquema versionado
  scheduler.js         # Evaluación de horarios + próxima transición
  streak.js            # Rollover diario + serie 7 días
  domains.js           # Normalización + validación de dominios
  messages.js          # 40 mensajes motivacionales
icons/
  icon.svg             # Fuente vectorial
  icon{16,32,48,128}.png  # PNGs derivados
```

## Stack

- Manifest V3, sin librerías externas (solo Google Fonts vía CSS @import).
- `chrome.declarativeNetRequest` reglas dinámicas con `regexSubstitution` y
  `\\0` para preservar la URL original como parámetro `from`.
- `chrome.alarms` con tres tipos: tick de 1 min, transición exacta entre
  bloques, y expiración de breaks de 5 min por dominio.
- ES Modules en service worker y en todos los scripts de UI.
- Tipografía: Inter, Manrope (display) y JetBrains Mono (datos).

## Decisiones técnicas que vale la pena conocer

- **Bloques que cruzan medianoche se rechazan deliberadamente.** Crea dos
  bloques separados (`22:00–23:59` y `00:00–02:00`). Mantiene la lógica de
  evaluación trivial y predecible.
- **`chrome.alarms` tiene resolución mínima de 1 minuto** en producción, por lo
  que el contador de minutos enfocados se actualiza cada 60 segundos.
- **El `\\0` en `regexSubstitution`** capta la URL entera para incluirla como
  parámetro `from`. En `block.js` se lee a mano con `indexOf('&from=')` porque
  el valor contiene `&` y `=` que romperían `URLSearchParams`.
- **Race condition al fin de bloque:** cuando el countdown llega a 0, se
  esperan 600 ms antes de redirigir para dar tiempo al alarm a borrar las
  reglas dinámicas.

## Privacidad

Toda la configuración vive en `chrome.storage.local`. Nada se envía a servidores
externos. La extensión solo abre conexiones a `google.com/s2/favicons` para
mostrar los favicons de los dominios bloqueados (sin identificador del
usuario).

## Licencia

MIT.
