# Instalar FocusGuard (modo desarrollador)

1. Abre Chrome y ve a `chrome://extensions/`.
2. Activa el toggle **Modo desarrollador** en la esquina superior derecha.
3. Click en **Cargar descomprimida** y selecciona esta carpeta (la que contiene
   `manifest.json`).
4. La extensión aparecerá. Click en el icono del puzzle de la barra de Chrome
   y fija FocusGuard pulsando el alfiler para tenerla siempre visible.

## Probar en 60 segundos

1. Click en el icono de FocusGuard → pestaña **Horarios** → `+ Añadir bloque`.
2. Crea un bloque que incluya la hora actual. Por ejemplo, si son las 15:42:
   inicio `15:30`, fin `17:00`, marca solo el día actual. Guarda.
3. Abre una pestaña nueva y entra a `https://youtube.com`. Te redirigirá a la
   pantalla de bloqueo con countdown vivo, racha y mensaje motivacional.
4. Click en **Romper bloqueo** → **Continuar** → escribe `ROMPER` exactamente
   en mayúsculas. El botón rojo se activa solo con esa palabra. Confirma.
5. Tendrás 5 minutos de acceso a youtube.com. Pasados los 5 minutos, vuelve a
   bloquearse automáticamente sin que tengas que hacer nada.

## Atajos útiles

- **Opciones ampliadas con stats agregados:** click derecho sobre el icono de
  la extensión → **Opciones**. O desde el popup, "Opciones ampliadas →".
- **Backup completo:** pestaña **Ajustes** del popup → **Exportar JSON**.
- **Restaurar:** pestaña **Ajustes** → **Importar JSON**.
- **Reset selectivo:** "Resetear racha" reinicia solo el contador de racha;
  "Restablecer todo" borra absolutamente todo y vuelve a defaults.

## Si algo no funciona

- Revisa que `chrome://extensions/` muestre la extensión sin "Errores".
- Comprueba que las reglas dinámicas se están aplicando: durante un bloque
  activo, `chrome://net-export/` con captura de red mostrará el redirect.
- Para depurar el service worker: en `chrome://extensions/` busca FocusGuard y
  click en "Service worker" para abrir DevTools del background.
