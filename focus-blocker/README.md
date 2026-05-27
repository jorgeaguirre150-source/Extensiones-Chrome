# focus-blocker

Versión más sencilla de FocusGuard. Solo:

- Lista de dominios bloqueados (sin horarios — bloquea 24/7 cuando están en la lista)
- Popup minimalista para añadir/quitar dominios
- Página de bloqueo sobria con botón "Volver atrás"

Sin rachas, sin Pomodoro, sin temas, sin gamificación. Pensada como **starting kit** para construir tu propio bloqueador o como alternativa low-friction si FocusGuard te parece demasiado.

## Estructura

```
manifest.json     # Manifest V3 mínimo
background.js     # Service worker con declarativeNetRequest
popup.html/css/js # UI 320x… para gestionar dominios (chrome.storage.sync)
blocked.html/css/js # Página de bloqueo sencilla
```

## Cargar

1. `chrome://extensions/` → Modo desarrollador
2. Cargar descomprimida → seleccionar esta carpeta
3. Añadir dominios desde el popup

## Diferencias con FocusGuard

| | focus-blocker | FocusGuard |
|---|---|---|
| Manifest | V3 | V3 |
| Horarios | No, bloquea siempre | Sí, bloques configurables |
| Storage | `chrome.storage.sync` | `chrome.storage.local` |
| Gamificación | No | Racha, logros, minutos enfocados |
| Pantalla bloqueo | Mensaje + 2 botones | Orb animado + countdown + mensaje rotativo |
| Tamaño total | ~8 KB | ~75 KB |

Para uso real, recomendamos **FocusGuard** (carpeta raíz del repo).
