# Justificación de permisos (para revisión del Chrome Web Store)

Chrome pedirá que justifiques **cada permiso solicitado** en el formulario de revisión. Aquí tienes los textos exactos para pegar en cada campo.

---

### `storage`

**Texto para Chrome Web Store:**
> Used to persist user configuration: blocked sites, scheduled focus blocks, current streak, focus minutes history and user preferences. All data stays in `chrome.storage.local` on the user's device and is never sent to any external server.

---

### `alarms`

**Texto para Chrome Web Store:**
> Used for three internal time-based tasks: (1) a periodic 1-minute tick to increment the user's daily focus minutes counter and to detect midnight rollover for streak evaluation, (2) one-shot alarms scheduled at the exact start/end time of each focus block to update blocking rules at the right instant, and (3) per-domain expiration alarms for the 5-minute breaks the user can take after explicitly confirming "Break block".

---

### `declarativeNetRequest`

**Texto para Chrome Web Store:**
> This is the core mechanism that implements the blocking. The extension dynamically creates and removes `declarativeNetRequest` rules based on whether the current time falls inside a user-configured focus block. Each rule redirects matching domains to an internal `block.html` page within the extension. No traffic is intercepted, logged or modified — only redirected. Rules are removed automatically when the block ends.

---

### `tabs`

**Texto para Chrome Web Store:**
> Used exclusively to close the current tab when the user clicks "Go back" on the blocking page. `chrome.tabs.remove(sender.tab.id)` is called only in response to that specific user action. No tab content, URL, or history is read or stored.

---

### `host_permissions: <all_urls>`

**Texto para Chrome Web Store:**
> Required because the user can add ANY domain to their personal blocked list. The `declarativeNetRequest` redirect rules must be able to match arbitrary domains chosen by the user. The extension does not read or modify any page content; it only redirects matching navigations to the internal block page before the page loads.

---

## ¿Por qué NO se pide `webRequest` ni `webRequestBlocking`?

Deliberadamente. La extensión usa `declarativeNetRequest`, que es el reemplazo de Manifest V3 para `webRequest` con bloqueo. Es más rápido, más privado (Chrome aplica las reglas sin que la extensión vea las URLs) y no requiere `webRequest`.

## ¿Por qué NO se piden `scripting` ni `activeTab`?

Porque la extensión nunca inyecta scripts en páginas web del usuario. La pantalla de bloqueo es una página interna de la extensión (`block.html`), no un overlay sobre la página visitada.

## Single Purpose declaration

> FocusGuard's single purpose is to block user-defined distracting websites during user-defined time windows, with a streak-based gamification layer to encourage consistency.
