# Monitor Ambiental · Frontend

Interfaz web React + TypeScript para consultar las mediciones y alarmas del sistema de monitoreo ambiental del Tecnológico de La Laguna.

## Aplicación

[Abrir Monitor Ambiental](https://monitor-ambiental-front.onrender.com)

## Vistas

- **Panel:** indicadores, gráfica reciente, últimas mediciones y alarmas activas. Actualiza las mediciones de la última hora cada cinco segundos.
- **Historial:** tabla del archivo de mediciones, con filtros por estación y fecha, y exportación a Excel.
- **Comparativa:** compara estaciones Rural y Urbana por última hora, hoy, últimos 7 días con datos o últimos 30 días con datos; permite exportar a Excel.
- **Alarmas:** crea, activa, desactiva y elimina reglas; muestra eventos activos y permite resolverlos.

La API que alimenta estas vistas está documentada en el [README del backend](../monitor-ambiental-back/README.md#endpoints).

## Requisitos

- Node.js 20.19+ o 22.12+
- El [backend](../monitor-ambiental-back/README.md) iniciado, o una URL de API disponible

## Desarrollo

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abre la dirección que indique Vite. `VITE_API_BASE_URL` debe apuntar al origen del backend, sin `/api` al final. Para desarrollo local usa `http://localhost:3000`; para producción define la URL pública del backend en la configuración de variables de entorno del hosting.

## Producción

```bash
npm run build
npm run preview
```

El frontend se puede desplegar como sitio estático (por ejemplo, en Render Static Site). Configura `VITE_API_BASE_URL` durante el build y habilita el fallback de rutas SPA a `index.html` en el proveedor.
