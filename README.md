# F1 Live Timing

Miniweb de Live Timing de Fórmula 1 con dos modalidades:

- Demo estática publicada en GitHub Pages, basada en replays incluidos en el repositorio.
- Módulo Docker autónomo con backend FastAPI, captura SignalR, scheduler y almacenamiento persistente de replays.

La miniweb Docker se publica bajo `/livetiming/` y puede integrarse detrás de Flask, Django, FastAPI, Nginx u otro framework mediante proxy inverso.

## Demo estática

La demo no necesita backend ni Docker. Usa replays estáticos y se despliega automáticamente en GitHub Pages al hacer push a `main`.

<https://ismaelrg1.github.io/f1-live-timing/>

Para construirla localmente:

```bash
cd dashboard/f1-dashboard
npm ci
npm run build:static
```

## Ejecutar con Docker

Requisitos: Docker y Docker Compose.

```bash
git clone git@github.com:ismaelrg1/f1-live-timing.git
cd f1-live-timing

cp .env.example .env
docker compose up --build -d
```

Abre:

```text
http://localhost:8080/livetiming/
```

El servicio `dashboard` publica la miniweb y reenvía las peticiones HTTP y WebSocket al servicio `backend`.

## Configuración

Edita `.env` antes de iniciar los contenedores si necesitas cambiar la configuración:

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `F1_DASHBOARD_PORT` | `8080` | Puerto público de la miniweb. |
| `F1_LIVE_ENABLED` | `true` | Activa el backend de Live Timing. |
| `F1_SCHEDULER_ENABLED` | `true` | Activa la captura automática según el calendario de F1. |
| `F1_SCHEDULER_POLL_SECONDS` | `30` | Frecuencia de consulta del scheduler. |
| `F1_SCHEDULER_LEAD_SECONDS` | `300` | Antelación, en segundos, para iniciar una sesión. |
| `F1_SCHEDULER_MAX_SESSION_SECONDS` | `21600` | Límite de seguridad de una captura. |

Para ejecutar el módulo sin captura automática:

```dotenv
F1_SCHEDULER_ENABLED=false
```

## Persistencia

Las capturas y el estado del scheduler se guardan en el volumen Docker `f1_livetiming_data`. Los datos sobreviven a reinicios y actualizaciones de los contenedores.

```bash
docker compose down
```

El comando anterior conserva las replays. Para eliminar también los datos persistentes:

```bash
docker compose down -v
```

> `docker compose down -v` elimina las capturas guardadas.

## Integración en otra web

La aplicación anfitriona no necesita conocer SignalR, FastF1 ni los archivos `.jsonl`. Solo debe publicar o hacer proxy de la miniweb Docker conservando el prefijo `/livetiming/`.

Ejemplo conceptual con Nginx:

```nginx
location /livetiming/ {
    proxy_pass http://127.0.0.1:8080/livetiming/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

La aplicación anfitriona puede proteger esa ruta con su propio sistema de usuarios, sesión y permisos.

## API

El backend expone internamente estas rutas:

- `GET /health`
- `GET /api/v1/live/status`
- `GET /api/v1/replays`
- `POST /api/v1/live/start`
- `POST /api/v1/live/stop`
- `WS /ws/live`
- `WS /ws/replay?replayId=<id>`

A través de la miniweb Docker, las rutas públicas llevan el prefijo `/livetiming`, por ejemplo:

```text
GET /livetiming/api/v1/replays
WS  /livetiming/ws/live
```

## Desarrollo local

Backend:

```bash
uv sync
uv run uvicorn f1_livetiming.api:app --reload
```

Dashboard:

```bash
cd dashboard/f1-dashboard
npm ci
npm run check
npm run dev
```

## Arquitectura

La descripción de componentes, flujo de datos e integración está en [docs/architecture.md](docs/architecture.md).
