# Levantar (después de hacer cambios o cuando enciendes el PC)
docker compose up -d

# Parar (no borra nada, los datos se conservan)
docker compose down

# Ver estado
docker compose ps

# Ver logs en vivo
docker compose logs -f n8n
docker compose logs -f postgres

# Reiniciar solo n8n (después de cambiar .env)
docker compose restart n8n

# Actualizar a la última versión
docker compose pull
docker compose up -d

# Borrar TODO (cuidado, perderías los workflows)
docker compose down
rmdir /s data