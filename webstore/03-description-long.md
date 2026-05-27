# FocusGuard

**Tu guardián del foco. Bloquea distracciones, construye tu racha.**

Los bloqueadores rígidos fallan porque al final terminas desinstalándolos. Los bloqueadores con racha funcionan porque nadie quiere perder lo que ha construido. FocusGuard es lo segundo: bloqueo real durante los horarios que tú decides + gamificación honesta que premia la constancia + fricción deliberada para romper el bloqueo cuando flaqueas.

## ✦ Lo que hace

▸ **Bloqueo por horarios.** Crea uno o varios bloques al día (mañana profunda 09:00–13:00, tarde 16:00–19:00) y elige los días (L–V, fin de semana, personalizado). Fuera de horario, Chrome navega normal. Dentro, las webs distractoras se bloquean.

▸ **Lista de webs personalizable.** Defaults razonables: YouTube, X, Instagram, Reddit, TikTok, Facebook, Netflix. Añade o quita las que quieras. Una entrada (`youtube.com`) cubre todos los subdominios automáticamente (`m.youtube.com`, `music.youtube.com`, etc.).

▸ **Pantalla de bloqueo a página completa.** No un alert genérico — una página cuidada con countdown vivo al fin del bloque, tu racha actual, minutos enfocados hoy, y una de 40 frases motivacionales rotativas (estoicas, prácticas, empáticas, directas, con humor seco).

▸ **Sistema de rachas.** Cada día completo sin romper el bloqueo suma 1. Si rompes una vez, racha a 0. Evaluación a medianoche local. Verás tu racha actual y tu mejor histórica.

▸ **Romper el bloqueo con fricción.** Cuando flaqueas, el botón está visible pero no agresivo. Al pulsarlo: paso 1, "¿seguro? vas a perder tu racha". Paso 2, escribir literalmente la palabra `ROMPER` en mayúsculas. Solo entonces el botón se activa. Confirmado: 5 minutos de acceso a ese dominio, después se bloquea solo automáticamente.

▸ **Minutos enfocados.** Suma cada minuto dentro de bloque activo sin breaks. Reset diario a medianoche. Gráfico de barras CSS con los últimos 7 días.

▸ **Página de opciones completa.** Stats agregados, gráfico semanal grande, gestión holgada de bloques y webs, export/import JSON para backup.

## ✦ Por qué es distinto

▸ **No regaña.** El tono evita la motivación cursi de Instagram. Las 40 frases mezclan cinco tonos: estoico, práctico, empático, directo, humor seco.

▸ **Estética cuidada.** Inspirada en Things 3, Linear, Raycast. Glassmorphism sutil, tipografía Manrope + Inter + JetBrains Mono, paleta dark refinada, microinteracciones por todas partes.

▸ **Manifest V3 nativo.** Bloqueo real con `declarativeNetRequest` (rápido, sin ralentizar Chrome). Service worker como módulo ES. Sin librerías externas.

▸ **Privacidad total.** Toda tu configuración vive en `chrome.storage.local` de tu navegador. Cero servidores, cero analytics, cero tracking. Solo se piden favicons a `google.com/s2/favicons` para que veas los iconos de las webs bloqueadas (sin identificador).

## ✦ Stack técnico

- Manifest V3
- `chrome.declarativeNetRequest` con reglas dinámicas y regex
- `chrome.alarms` para tick periódico, transición exacta entre bloques y expiración de breaks
- ES Modules en todos los scripts
- Sin dependencias externas

## ✦ Permisos

- **storage**: guardar tu configuración local
- **alarms**: detectar inicio/fin de bloques y rollover de medianoche
- **declarativeNetRequest**: bloquear las webs en horario
- **tabs**: cerrar la pestaña bloqueada con "Volver atrás"
- **`<all_urls>`**: necesario para que las reglas dinámicas cubran cualquier dominio que añadas

## ✦ Roadmap

- v1.1: temas de acento (verde / ámbar / azul / púrpura)
- v1.2: notificaciones de Chrome cuando logras hitos de racha (3, 7, 14, 30, 90 días)
- v1.3: modo Pomodoro rápido (25/50/90 min ad-hoc)
- v1.4: menú contextual "Bloquear esta web"

## ✦ Soporte

¿Bug? ¿Sugerencia? Abre un issue: [repo URL]. Open source MIT.

---

*Hecho con cariño para quienes nos cansamos de pelearnos con nuestra propia atención.*
