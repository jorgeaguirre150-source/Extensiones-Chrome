# Checklist para subir FocusGuard al Chrome Web Store

Sigue estos pasos en orden. Tiempo estimado: 30–45 minutos (sin contar revisión de Google).

## A. Antes de empezar (una sola vez en tu vida)

- [ ] **Cuenta de Chrome Web Store Developer.** Si no la tienes:
  1. Ve a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
  2. Inicia sesión con tu cuenta de Google personal o de empresa.
  3. Paga la cuota única de registro: **5 USD** (Google Pay).
  4. Confirma email.

- [ ] **Hostear la política de privacidad en una URL pública.** Es obligatorio. Opciones rápidas:
  - **GitHub Pages**: crea un repo público, sube `04-privacy-policy.md` como `privacy.md`, activa Pages. URL: `https://<usuario>.github.io/<repo>/privacy`.
  - **Notion**: pega el contenido en una página de Notion → Share → Publish to web → copia URL.
  - **Telegraph**: `telegra.ph`, pega el markdown, publica. URL pública instantánea.

## B. Subir la extensión

- [ ] Ve a [Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
- [ ] Click en **"New item"** (esquina superior derecha).
- [ ] **Sube el ZIP**: `C:\Users\Aguir\Desktop\Jorge\Documentos Varios\Code\focus-guard-v1.0.0.zip` (56 KB).
- [ ] Espera 5–10 segundos a que se procese.

## C. Rellenar la ficha de tienda (Store Listing)

- [ ] **Product name**: pega el contenido de `01-listing-name.txt`.
- [ ] **Short description** (132 chars max): pega `02-description-short.txt`.
- [ ] **Detailed description**: pega el contenido completo de `03-description-long.md`.
- [ ] **Category**: `Productivity`.
- [ ] **Language**: `Spanish`. (Si quieres también inglés, traduces después.)
- [ ] **Store icon 128×128**: sube `focus-guard/icons/icon128.png`.
- [ ] **Screenshots**: sube 1 a 5 de la carpeta `screenshots/` (mínimo 1, máximo 5, **1280×800** o **640×400**).
- [ ] **Small promotional tile 440×280**: sube `promo/promo-440x280.png`.
- [ ] **Large promotional tile 920×680** (opcional): sube `promo/promo-920x680.png` si quieres salir destacado.
- [ ] **Marquee promo tile 1400×560** (opcional, solo para destacados): `promo/promo-1400x560.png`.

## D. Privacy practices (panel obligatorio)

- [ ] **Single purpose**: pega del bloque "Single Purpose declaration" de `05-permissions-justification.md`.
- [ ] **Permission justification**: para cada permiso pedido, pega el bloque correspondiente de `05-permissions-justification.md`:
  - `storage` → texto del bloque storage
  - `alarms` → texto del bloque alarms
  - `declarativeNetRequest` → texto del bloque declarativeNetRequest
  - `tabs` → texto del bloque tabs
  - `<all_urls>` host permission → texto del bloque host_permissions
- [ ] **Data usage disclosures**:
  - "Personally identifiable information": **No**
  - "Health information": **No**
  - "Financial and payment information": **No**
  - "Authentication information": **No**
  - "Personal communications": **No**
  - "Location": **No**
  - "Web history": **No**
  - "User activity": **No** (los stats internos no salen del dispositivo)
  - "Website content": **No**
- [ ] Marca las tres certificaciones:
  - [x] I do not sell or transfer user data to third parties.
  - [x] I do not use user data for purposes unrelated to my item's single purpose.
  - [x] I do not use user data to determine creditworthiness or for lending purposes.
- [ ] **Privacy policy URL**: pega la URL pública donde subiste la política.

## E. Distribución

- [ ] **Visibility**: elige
  - **Public**: cualquiera puede descargar (recomendado si quieres compartirla)
  - **Unlisted**: solo accesible con el link directo
  - **Private**: solo para emails que tú especifiques (útil si solo es para ti y amigos)
- [ ] **Countries**: All (o selecciona los que prefieras)
- [ ] **Pricing**: Free
- [ ] **Mature content**: No

## F. Enviar

- [ ] Click en **"Submit for review"** (esquina superior derecha).
- [ ] **Tiempo de revisión**: 1–3 días hábiles (a veces unas horas, depende de Google).
- [ ] Recibirás email con el resultado: aprobada / rechazada con motivo.

## G. Si la rechazan (motivos típicos)

- **"Your privacy policy URL is not accessible"** → hostéala en otro sitio.
- **"Permissions are not justified"** → expande los textos del paso D con ejemplos concretos.
- **"Screenshots don't match item"** → asegúrate de que las screenshots muestren la extensión real, no mockups inventados.
- **"Single purpose"** → afina la descripción para que quede MUY claro que solo hace una cosa.

## H. Post-publicación

- [ ] Comparte la URL pública. Tu extensión queda en `https://chromewebstore.google.com/detail/<id-generado>`.
- [ ] **Versiones futuras**: incrementa el `version` en `manifest.json`, recrea el ZIP, sube en "Package" → "Upload new package".
