import { io, type Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import type { DashboardSessionState, DriverRow } from '../types/dashboard';

import { teamRadioStore } from './teamRadioStore';
import { raceControlStore } from './raceControlStore';
import type { TeamRadioCapture } from '../types/teamRadio';
import type { RaceControlMessage } from '../types/raceControl';

export type DashboardDataMode = 'live' | 'replay';
export type DashboardRuntimeMode = 'remote' | 'static';

export const dashboardRuntimeMode: DashboardRuntimeMode =
  import.meta.env.VITE_DASHBOARD_SOURCE === 'static' ? 'static' : 'remote';

export interface ReplayMarker {
  index: number;
  progress: number;
  label: string;
  status: string;
  kind:
    | 'start'
    | 'end'
    | 'aborted'
    | 'safety_car'
    | 'virtual_safety_car'
    | 'red_flag'
    | string;
  end_index?: number | null;
  end_progress?: number | null;
}

export interface ReplayOption {
  id: string;
  label: string;
  parts: number;
}

interface StaticReplayCatalogEntry {
  id: string;
  label: string;
  parts: string[];
}

interface DashboardDataState {
  mode: DashboardDataMode;
  session: DashboardSessionState | null;
  drivers: DriverRow[];
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastTopic: string | null;
  lastReceivedAt: string | null;
  liveRunning: boolean;
  replays: ReplayOption[];
  selectedReplayId: string | null;
  replayProgress: number;
  replaySpeed: number;
  replayPaused: boolean;
  replayCurrentIndex: number;
  replayTotalEvents: number;
  replayMarkers: ReplayMarker[];
}

interface DashboardStateMessage {
  type: 'dashboard_state';
  receivedAt: string | null;
  topic: string;
  lineNumber: number;
  currentIndex?: number;
  totalEvents?: number;
  progress?: number;
  speed?: number;
  paused?: boolean;
  payload: {
    session: DashboardSessionState;
    drivers: DriverRow[];
    secondaryPanels?: {
      teamRadio?: TeamRadioCapture[];
      raceControlMessages?: RaceControlMessage[];
    };
  };
}

interface ReplayStartedMessage {
  type: 'replay_started';
  path: string;
  paths?: string[];
  totalEvents: number;
  speed: number;
  paused: boolean;
  markers: ReplayMarker[];
}

interface ReplayFinishedMessage {
  type: 'replay_finished';
  path: string;
  paths?: string[];
}

interface LiveStatusMessage {
  type: 'live_status';
  running: boolean;
  hasState?: boolean;
  output?: string | null;
  reason?: string;
  sessionEndDetected?: boolean;
  sessionEndDetectedAt?: string;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type DashboardSocketMessage =
  | DashboardStateMessage
  | ReplayStartedMessage
  | ReplayFinishedMessage
  | LiveStatusMessage
  | ErrorMessage;

const initialState: DashboardDataState = {
  mode: dashboardRuntimeMode === 'static' ? 'replay' : 'live',
  session: null,
  drivers: [],
  connected: false,
  connecting: false,
  error: null,
  lastTopic: null,
  lastReceivedAt: null,
  liveRunning: false,
  replays: [],
  selectedReplayId: null,
  replayProgress: 0,
  replaySpeed: 10,
  replayPaused: false,
  replayCurrentIndex: 0,
  replayTotalEvents: 0,
  replayMarkers: []
};

function remoteUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}

function replayWebSocketUrl(replayId: string) {
  const url = new URL(
    remoteUrl('/ws/replay'),
    window.location.origin
  );

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('replayId', replayId);

  return url.toString();
}

function replayApiUrl() {
  return remoteUrl('/api/v1/replays');
}

function staticAssetUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${cleanPath}`;
}

function staticCatalogUrl() {
  return staticAssetUrl('/replays/catalog.json');
}

function staticReplayUrl(replayId: string) {
  return staticAssetUrl(`/replays/generated/${replayId}.jsonl`);
}

function createDashboardDataStore() {
  const { subscribe, update } = writable<DashboardDataState>(initialState);

  let socket: Socket | null = null;
  let replaySocket: WebSocket | null = null;
  let connectionId = 0;
  let staticMessages: DashboardSocketMessage[] = [];
  let staticMessageIndex = 0;
  let staticTimer: ReturnType<typeof window.setTimeout> | null = null;
  let staticPaused = false;
  let staticSpeed = 10;

  function disconnectWebSocket() {
    connectionId += 1;
    stopStaticReplay();

    if (replaySocket) {
      replaySocket.close();
      replaySocket = null;
    }

    if (socket) {
      socket.emit('livetiming:stop');
      socket.disconnect();
      socket = null;
    }

    teamRadioStore.reset();
    raceControlStore.reset();

    update((state) => ({
      ...state,
      connected: false,
      connecting: false,
      replayPaused: false
    }));
  }

  function stopStaticReplay() {
    if (staticTimer) {
      window.clearTimeout(staticTimer);
      staticTimer = null;
    }

    staticMessages = [];
    staticMessageIndex = 0;
    staticPaused = false;
  }

  function handleDashboardMessage(message: DashboardSocketMessage, mode: DashboardDataMode) {
    if (message.type === 'live_status') {
      update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        liveRunning: Boolean(message.running),
        lastTopic: message.running ? 'live_status' : 'live_inactive',
        error: null
      }));

      return;
    }

    if (message.type === 'error') {
      update((state) => ({
        ...state,
        error: message.error
      }));

      return;
    }

    if (message.type === 'replay_started') {
      teamRadioStore.reset();
      raceControlStore.reset();

      update((state) => ({
        ...state,
        replayTotalEvents: message.totalEvents,
        replaySpeed: message.speed,
        replayPaused: message.paused,
        replayProgress: 0,
        replayCurrentIndex: 0,
        replayMarkers: message.markers,
        lastTopic: 'replay_started'
      }));

      return;
    }

    if (message.type === 'replay_finished') {
      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        replayPaused: true,
        replayProgress: 1,
        lastTopic: 'replay_finished'
      }));

      return;
    }

    teamRadioStore.setCaptures(message.payload.secondaryPanels?.teamRadio ?? []);
    raceControlStore.setMessages(message.payload.secondaryPanels?.raceControlMessages ?? []);

    update((state) => ({
      ...state,
      session: message.payload.session,
      drivers: message.payload.drivers,
      connected: true,
      connecting: false,
      liveRunning: mode === 'live' ? true : state.liveRunning,
      lastTopic: message.topic,
      lastReceivedAt: message.receivedAt,
      replayProgress: message.progress ?? state.replayProgress,
      replaySpeed: message.speed ?? state.replaySpeed,
      replayPaused: message.paused ?? state.replayPaused,
      replayCurrentIndex: message.currentIndex ?? state.replayCurrentIndex,
      replayTotalEvents: message.totalEvents ?? state.replayTotalEvents,
      error: null
    }));
  }

  function connectSocket(mode: DashboardDataMode, replayId?: string) {
    if (dashboardRuntimeMode === 'static') {
      if (mode === 'replay' && replayId) {
        void connectStaticReplayById(replayId);
        return;
      }

      update((state) => ({
        ...state,
        mode: 'replay',
        connected: false,
        connecting: false,
        liveRunning: false,
        error: 'Live timing is not available in the static build'
      }));
      return;
    }

    if (mode === 'replay' && replayId) {
      connectReplayWebSocket(replayId);
      return;
    }

    disconnectWebSocket();
    const currentConnectionId = connectionId;

    update((state) => ({
      ...state,
      mode,
      connected: false,
      connecting: true,
      error: null,
      lastTopic: null,
      lastReceivedAt: null,
      liveRunning: mode === 'live' ? false : state.liveRunning,
      replayProgress: 0,
      replayPaused: false,
      replayCurrentIndex: 0,
      replayTotalEvents: 0,
      replayMarkers: []
    }));

    socket = io('/livetiming', {
      transports: ['websocket'],
      withCredentials: true
    });

    socket.on('connect', () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        error: null
      }));

      if (mode === 'live') {
        socket?.emit('livetiming:live');
        return;
      }

      socket?.emit('livetiming:replay', { replayId });
    });

    socket.on('livetiming:message', (message: DashboardSocketMessage) => {

      if (currentConnectionId !== connectionId) {
        return;
      }

      handleDashboardMessage(message, mode);
    });

    socket.on('livetiming:error', (message: ErrorMessage) => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        error: message.error
      }));
    });

    socket.on('disconnect', () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        liveRunning: mode === 'live' ? false : state.liveRunning,
        replayPaused: mode === 'replay' ? true : state.replayPaused
      }));

      socket = null;
    });

    socket.on('connect_error', () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        liveRunning: mode === 'live' ? false : state.liveRunning,
        error: mode === 'live'
          ? 'Live timing websocket connection failed'
          : 'Replay websocket connection failed'
      }));
    });
  }

  function connectReplayWebSocket(replayId: string) {
    disconnectWebSocket();
    const currentConnectionId = connectionId;

    update((state) => ({
      ...state,
      mode: 'replay',
      connected: false,
      connecting: true,
      error: null,
      lastTopic: null,
      lastReceivedAt: null,
      replayProgress: 0,
      replayPaused: false,
      replayCurrentIndex: 0,
      replayTotalEvents: 0,
      replayMarkers: []
    }));

    replaySocket = new WebSocket(replayWebSocketUrl(replayId));

    replaySocket.onopen = () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        error: null
      }));
    };

    replaySocket.onmessage = (event) => {
      if (currentConnectionId !== connectionId) return;

      try {
        const message = JSON.parse(event.data) as DashboardSocketMessage;
        handleDashboardMessage(message, 'replay');
      } catch {
        update((state) => ({
          ...state,
          error: 'Invalid replay message received'
        }));
      }
    };

    replaySocket.onerror = () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: 'Replay websocket connection failed'
      }));
    };

    replaySocket.onclose = () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        replayPaused: true
      }));

      replaySocket = null;
    };
  }

  async function loadReplays() {
    try {
      const response = await fetch(
        dashboardRuntimeMode === 'static' ? staticCatalogUrl() : replayApiUrl()
      );

      if (!response.ok) {
        throw new Error('Could not load replays');
      }

      const data = await response.json();
      const replays = dashboardRuntimeMode === 'static'
        ? ((data.replays ?? []) as StaticReplayCatalogEntry[]).map((replay) => ({
          id: replay.id,
          label: replay.label,
          parts: replay.parts.length
        }))
        : (data.replays ?? []) as ReplayOption[];

      update((state) => ({
        ...state,
        replays,
        selectedReplayId: state.selectedReplayId ?? replays[0]?.id ?? null
      }));
    } catch {
      update((state) => ({
        ...state,
        error: 'Could not load replays'
      }));
    }
  }

  function connectLiveWebSocket() {
    connectSocket('live');
  }

  function connectReplayById(replayId: string) {
    update((state) => ({
      ...state,
      selectedReplayId: replayId
    }));

    connectSocket('replay', replayId);
  }

  async function connectStaticReplayById(replayId: string) {
    disconnectWebSocket();
    const currentConnectionId = connectionId;

    update((state) => ({
      ...state,
      mode: 'replay',
      selectedReplayId: replayId,
      connected: false,
      connecting: true,
      error: null,
      lastTopic: null,
      lastReceivedAt: null,
      replayProgress: 0,
      replayPaused: false,
      replayCurrentIndex: 0,
      replayTotalEvents: 0,
      replayMarkers: []
    }));

    try {
      const response = await fetch(staticReplayUrl(replayId));

      if (!response.ok) {
        throw new Error('Could not load static replay');
      }

      const text = await response.text();
      staticMessages = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as DashboardSocketMessage);
      staticMessageIndex = 0;
      staticPaused = false;
      staticSpeed = 10;

      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        error: null
      }));

      runStaticReplay(currentConnectionId);
    } catch {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: 'Could not load static replay'
      }));
    }
  }

  function runStaticReplay(currentConnectionId: number) {
    if (currentConnectionId !== connectionId || staticPaused) return;

    const message = staticMessages[staticMessageIndex];

    if (!message) {
      handleDashboardMessage({
        type: 'replay_finished',
        path: ''
      }, 'replay');
      return;
    }

    handleDashboardMessage(message, 'replay');
    staticMessageIndex += 1;

    const nextMessage = staticMessages[staticMessageIndex];
    const delay = staticDelay(message, nextMessage);

    staticTimer = window.setTimeout(() => {
      runStaticReplay(currentConnectionId);
    }, delay);
  }

  function staticDelay(
    currentMessage: DashboardSocketMessage,
    nextMessage: DashboardSocketMessage | undefined
  ) {
    if (!nextMessage || currentMessage.type !== 'dashboard_state' || nextMessage.type !== 'dashboard_state') {
      return 0;
    }

    if (!currentMessage.receivedAt || !nextMessage.receivedAt) {
      return 1000 / staticSpeed;
    }

    const currentTime = Date.parse(currentMessage.receivedAt);
    const nextTime = Date.parse(nextMessage.receivedAt);

    if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime)) {
      return 1000 / staticSpeed;
    }

    return Math.max(0, (nextTime - currentTime) / staticSpeed);
  }

  function sendReplayControl(payload: Record<string, unknown>) {
    if (dashboardRuntimeMode === 'static') {
      handleStaticReplayControl(payload);
      return;
    }

    if (replaySocket?.readyState === WebSocket.OPEN) {
      replaySocket.send(JSON.stringify({
        type: 'replay_control',
        ...payload
      }));
      return;
    }

    if (!socket || !socket.connected) return;

    socket.emit('livetiming:control', {
      type: 'replay_control',
      ...payload
    });
  }

  function handleStaticReplayControl(payload: Record<string, unknown>) {
    const action = payload.action;

    if (action === 'play') {
      staticPaused = false;
      update((state) => ({ ...state, replayPaused: false }));
      runStaticReplay(connectionId);
      return;
    }

    if (action === 'pause') {
      staticPaused = true;
      if (staticTimer) window.clearTimeout(staticTimer);
      update((state) => ({ ...state, replayPaused: true }));
      return;
    }

    if (action === 'set_speed') {
      staticSpeed = Number(payload.speed) || 10;
      update((state) => ({ ...state, replaySpeed: staticSpeed }));
      return;
    }

    if (action === 'seek') {
      const progress = Math.min(Math.max(Number(payload.progress) || 0, 0), 1);
      const targetIndex = staticMessages.findIndex((message) => (
        message.type === 'dashboard_state' && (message.progress ?? 0) >= progress
      ));

      staticMessageIndex = targetIndex === -1
        ? Math.max(0, staticMessages.length - 1)
        : targetIndex;

      if (staticTimer) window.clearTimeout(staticTimer);
      if (staticPaused) {
        const message = staticMessages[staticMessageIndex];

        if (message) {
          handleDashboardMessage(message, 'replay');
          staticMessageIndex += 1;
        }

        return;
      }

      runStaticReplay(connectionId);
    }
  }

  function playReplay() {
    sendReplayControl({ action: 'play' });

    update((state) => ({
      ...state,
      replayPaused: false
    }));
  }

  function pauseReplay() {
    sendReplayControl({ action: 'pause' });

    update((state) => ({
      ...state,
      replayPaused: true
    }));
  }

  function seekReplay(progress: number) {
    const safeProgress = Math.min(Math.max(progress, 0), 1);
    sendReplayControl({ action: 'seek', progress: safeProgress });

    update((state) => ({
      ...state,
      replayProgress: safeProgress
    }));
  }

  function setReplaySpeed(speed: number) {
    sendReplayControl({ action: 'set_speed', speed });

    update((state) => ({
      ...state,
      replaySpeed: speed
    }));
  }

  return {
    subscribe,
    loadReplays,
    connectLiveWebSocket,
    connectReplayById,
    disconnectWebSocket,
    playReplay,
    pauseReplay,
    seekReplay,
    setReplaySpeed
  };
}

export const dashboardData = createDashboardDataStore();
