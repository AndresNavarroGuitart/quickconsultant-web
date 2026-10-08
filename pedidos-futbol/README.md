# Pedidos del equipo

Formulario para que los padres hagan pedidos de productos (recaudación para el campeonato)
y panel del organizador con lista de compras unificada, pedidos y planilla de entregas.

- `public/index.html`: la web (padres en `/`, organizador en `/#admin`).
- `netlify/functions/api.mjs`: API que guarda los pedidos en Netlify Blobs (sin base de datos externa).

## Publicar en Netlify (cuenta personal)

1. Entrar a https://app.netlify.com con la cuenta personal → **Add new project → Import an existing project → GitHub**.
2. Elegir el repo `quickconsultant-web` y la rama a publicar.
3. **Base directory**: `pedidos-futbol` (lo demás lo toma de `netlify.toml`).
4. **Environment variables**: agregar `ADMIN_PIN` con el PIN del panel (sin esto el panel no deja entrar).
   Sin tildar "Contains secret values" (el escaneo de secretos puede frenar el deploy con un PIN corto),
   "Same value for all deploy contexts". Después de crearla hay que volver a publicar: Netlify no toma variables nuevas hasta el próximo deploy.
5. Deploy. Opcional: en *Domain management* cambiar el nombre del sitio (ej. `pedidos-mi-equipo.netlify.app`).

Después de publicar: entrar a `/#admin`, ir a **Productos y datos** y cargar productos, precios, alias y fecha límite.
Si se publica sin `public/` como base no funciona la API: la base tiene que ser `pedidos-futbol`.
