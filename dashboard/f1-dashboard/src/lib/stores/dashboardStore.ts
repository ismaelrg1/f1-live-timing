import { io, type Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import type { DashboardSessionState, DriverRow } from '../types/dashboard';

import { teamRadioStore } from './teamRadioStore';
import { raceControlStore } from './raceControlStore';
import type { TeamRadioCapture } from '../types/teamRadio';
import type { RaceControlMessage } from '../types/raceControl';

export type DashboardDataMode = 'live' | 'replay';

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
  mode: 'live',
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

function replayApiUrl() {
  return `${window.location.origin}/api/livetiming/replays`;
}

function createDashboardDataStore() {
  const { subscribe, update } = writable<DashboardDataState>(initialState);

  let socket: Socket | null = null;
  let connectionId = 0;

  function disconnectWebSocket() {
    connectionId += 1;

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

    socket.onAny((event, ...args) => {
      console.log('[dashboardStore] socket event', event, args);
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
        console.log('[dashboardStore] ignored old message');
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

  async function loadReplays() {
    try {
      const response = await fetch(replayApiUrl());

      if (!response.ok) {
        throw new Error('Could not load replays');
      }

      const data = await response.json();
      const replays = (data.replays ?? []) as ReplayOption[];

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

  function sendReplayControl(payload: Record<string, unknown>) {
    if (!socket || !socket.connected) return;

    socket.emit('livetiming:control', {
      type: 'replay_control',
      ...payload
    });
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
