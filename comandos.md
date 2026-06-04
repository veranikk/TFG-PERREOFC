
## Docker

```powershell
# Arrancar todos los servicios (primera vez o tras cambiar Dockerfiles/dependencias)
docker compose -f docker-compose.dev.yml up --build -d

# Arrancar sin reconstruir (el resto de veces)
docker compose -f docker-compose.dev.yml up -d

# Parar todos los servicios
docker compose -f docker-compose.dev.yml down

# Ver contenedores corriendo
docker ps
```

## Logs

```powershell
# Ver QR del frontend (expo)
docker compose -f docker-compose.dev.yml logs -f frontend

# Ver logs de un servicio concreto
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f scraper
docker compose -f docker-compose.dev.yml logs -f n8n

# Ver logs de varios servicios a la vez
docker compose -f docker-compose.dev.yml logs -f frontend backend
```

## Alias opcional (añadir al perfil de PowerShell)

```powershell
# Abre el perfil: notepad $PROFILE
# Añade esta línea para usar "dc" en lugar del comando largo:
function dc { docker compose -f docker-compose.dev.yml @args }

# Uso: dc up -d | dc down | dc logs -f frontend
```
