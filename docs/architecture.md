# Arquitectura

## Objetivo

Ofrecer una miniweb de Live Timing de Fórmula 1 ejecutable con Docker. El módulo debe poder integrarse en una aplicación existente —Flask, Django, FastAPI u otro framework— sin que esa aplicación tenga que conectarse a SignalR ni procesar archivos de replay.

## Decisión principal

El módulo es autónomo y se comunica mediante HTTP y WebSocket estándar.

La miniweb forma parte siempre del módulo Docker. Una aplicación anfitriona puede montarla en una ruta propia, por ejemplo `/livetiming/`, y mantener por su cuenta el login, los usuarios y los permisos.

## Servicios Docker

### backend-f1

Backend único del módulo. Incluye dos responsabilidades internas:

- API HTTP y WebSocket para la miniweb y para integraciones externas.
- Proceso automático que consulta el calendario, se conecta a SignalR, captura sesiones y guarda replays.

Sus responsabilidades son:

- exponer el estado del servicio y de la captura live;
- listar y reproducir sesiones guardadas;
- emitir el estado live a los clientes WebSocket;
- detectar cuándo debe iniciarse una sesión;
- conectarse al Live Timing de Fórmula 1 mediante SignalR;
- guardar los eventos recibidos como archivos `.jsonl`;
- detectar el final de sesión y cerrar la grabación.

### dashboard

Miniweb Svelte incluida en el módulo Docker.

Muestra Live Timing y replays, y se comunica con `backend-f1` mediante HTTP y WebSocket. Se podrá publicar directamente o montar detrás de una ruta de una aplicación anfitriona.

### data

Volumen Docker persistente compartido por los servicios del módulo. Contiene:

- replays `.jsonl`;
- estado del scheduler;
- datos generados durante una sesión.

Los datos deben sobrevivir a reinicios y actualizaciones de los contenedores.

## Flujo de datos

```text
SignalR de Fórmula 1
          |
          v
backend-f1 -----> volumen data (.jsonl)
     |
     v
dashboard Docker
     |
     v
web anfitriona: /livetiming/
```

## Integración en una web externa

La aplicación anfitriona no necesita implementar lógica específica de Fórmula 1.

Puede integrar la miniweb de dos formas:

1. Enlazar o incrustar la URL publicada por el módulo Docker.
2. Hacer proxy de una ruta propia, por ejemplo `/livetiming/`, hacia el contenedor `dashboard`.

La aplicación anfitriona puede proteger esa ruta con su sistema de autenticación. El módulo F1 no depende de Flask, Django, FastAPI ni de otro framework concreto.

## API v1

### Estado

- `GET /health`
- `GET /api/v1/live/status`

### Replays

- `GET /api/v1/replays`

### Control live

- `POST /api/v1/live/start`
- `POST /api/v1/live/stop`

Los controles manuales sirven para desarrollo y pruebas. El proceso automático iniciará y detendrá normalmente la captura según el calendario y el estado de la sesión.

### WebSocket

- `WS /ws/live`
- `WS /ws/replay?replayId=<id>`

Los mensajes se enviarán en JSON:

- `live_status`
- `replay_started`
- `dashboard_state`
- `replay_finished`
- `error`

## Migración del código actual

### Lógica de replay

Se reutilizará la lógica actual de `backend/replay/` para leer replays, reconstruir el estado y generar los datos del dashboard.

### Lógica live

Se reutilizarán `backend/live/live_runner.py`, `backend/live/signalr_client.py` y `backend/live/jsonl_writer.py` como base para la captura.

Del archivo histórico `main.py` se extraerán únicamente las URLs SignalR, la lista de topics y la función de decodificación de payloads comprimidos. No se migrará el capturador CLI completo ni la lógica OpenF1 que no sea necesaria.

### Código Flask del backup

Las rutas Flask, JWT y el bridge Flask-Socket.IO no forman parte del núcleo. Se conservan como referencia para una posible integración de compatibilidad futura.
