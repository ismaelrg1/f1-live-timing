import { writable } from 'svelte/store';
import type { DashboardSessionState, DriverRow } from '../types/dashboard';

import { teamRadioStore } from './teamRadioStore';
import { raceControlStore } from './raceControlStore';
import type { TeamRadioCapture } from '../types/teamRadio';
import type { RaceControlMessage } from '../types/raceControl';

export type DashboardDataMode = 'mock' | 'replay';

export interface ReplayMarker {
  index: number;
  progress: number;
  label: string;
  status: string;
  kind: 'start' | 'end' | 'aborted' | string;
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
  totalEvents: number;
  speed: number;
  paused: boolean;
  markers: ReplayMarker[];
}

interface ReplayFinishedMessage {
  type: 'replay_finished';
  path: string;
}

type ReplayMessage = DashboardStateMessage | ReplayStartedMessage | ReplayFinishedMessage;

const initialState: DashboardDataState = {
  mode: 'mock',
  session: null,
  drivers: [],
  connected: false,
  connecting: false,
  error: null,
  lastTopic: null,
  lastReceivedAt: null,
  replayProgress: 0,
  replaySpeed: 10,
  replayPaused: false,
  replayCurrentIndex: 0,
  replayTotalEvents: 0,
  replayMarkers: []
};

function createDashboardDataStore() {
  const { subscribe, update, set } = writable<DashboardDataState>(initialState);

  let socket: WebSocket | null = null;
  let connectionId = 0;

  function disconnectReplayWebSocket() {
    connectionId += 1;

    if (socket) {
      socket.close();
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

  function setMockData(session: DashboardSessionState, drivers: DriverRow[]) {
    disconnectReplayWebSocket();

    set({
      mode: 'mock',
      session,
      drivers,
      connected: false,
      connecting: false,
      error: null,
      lastTopic: null,
      lastReceivedAt: null,
      replayProgress: 0,
      replaySpeed: 10,
      replayPaused: false,
      replayCurrentIndex: 0,
      replayTotalEvents: 0,
      replayMarkers: []
    });

    teamRadioStore.reset();
    raceControlStore.reset();
  }

  function connectReplayWebSocket(url = 'ws://127.0.0.1:8765') {
    disconnectReplayWebSocket();
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

    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      if (currentConnectionId !== connectionId) return;

      update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        error: null
      }));
    });

    socket.addEventListener('message', (event) => {
      if (currentConnectionId !== connectionId) return;

      const message = JSON.parse(event.data) as ReplayMessage;

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
        lastTopic: message.topic,
        lastReceivedAt: message.receivedAt,
        replayProgress: message.progress ?? state.replayProgress,
        replaySpeed: message.speed ?? state.replaySpeed,
        replayPaused: message.paused ?? state.replayPaused,
        replayCurrentIndex: message.currentIndex ?? state.replayCurrentIndex,
        replayTotalEvents: message.totalEvents ?? state.replayTotalEvents,
        error: null
      }));
    });

    socket.addEventListener('close', () => {
      if (currentConnectionId !== connectionId) return;

      teamRadioStore.reset();
      raceControlStore.reset();

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        replayPaused: true
      }));

      socket = null;
    });

    socket.addEventListener('error', () => {
      if (currentConnectionId !== connectionId) return;

      teamRadioStore.reset();
      raceControlStore.reset();

      update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: 'Replay websocket connection failed'
      }));
    });
  }

  function sendReplayControl(payload: Record<string, unknown>) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'replay_control',
      ...payload
    }));
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

  function setMode(mode: DashboardDataMode) {
    if (mode === 'mock') {
      disconnectReplayWebSocket();

      update((state) => ({
        ...state,
        mode: 'mock',
        connected: false,
        connecting: false,
        error: null
      }));

      return;
    }

    connectReplayWebSocket();
  }

  return {
    subscribe,
    setMockData,
    connectReplayWebSocket,
    disconnectReplayWebSocket,
    setMode,
    playReplay,
    pauseReplay,
    seekReplay,
    setReplaySpeed
  };
}

export const dashboardData = createDashboardDataStore();
