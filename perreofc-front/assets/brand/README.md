<!--
Documentation file for perreofc-front: readme.
It captures project notes that help developers understand or operate this area.
-->

# Assets de marca — Perreo FC

Directorio para todos los assets exportados desde Figma.
**Sustituye cada archivo placeholder por el real** manteniendo el nombre exacto.

| Archivo | Formato | Tamaño | Uso |
|---|---|---|---|
| `logo-main.png` | PNG | 1024×1024 | Login, Register, Forgot, header del home, profile |
| `logo-main@2x.png` | PNG | 1024×1024 | Retina fallback |
| `logo-main@3x.png` | PNG | 1536×1536 | Retina 3x |
| `logo-splash.png` | PNG | 1024×1024 | Pantalla de carga |
| `favicon.png` | PNG | 48×48 / 96×96 / 192×192 / 512×512 | `app.json` → `web.favicon` |
| `icon.png` | PNG | 1024×1024 | `app.json` → `icon` (iOS/Android) |
| `adaptive-icon.png` | PNG | 1024×1024 (safe zone 432) | Android adaptive icon |
| `splash.png` | PNG | 1284×2778 | Expo splash |
| `mascota-melocoton.png` | PNG | 512×512 | Chatbot hero y avatars |
| `player-placeholder.png` | PNG | 512×512 | Foto por defecto de jugador |
| `user-placeholder.png` | PNG | 512×512 | Avatar por defecto de usuario |

## Notas de exportación desde Figma
- SVG con "Outline stroke" si tienen trazos y fuentes pasadas a paths
- PNG a 1x (nombre base), 2x y 3x
- Los archivos placeholder actuales son copias del template de Expo — reemplazar antes del build final
