import { writable } from 'svelte/store';
import type { RaceControlMessage } from '../types/raceControl';

function createRaceControlStore() {
  const { subscribe, set } = writable<RaceControlMessage[]>([]);

  return {
    subscribe,

    setMessages(messages: RaceControlMessage[]) {
      set(messages);
    },

    reset() {
      set([]);
    }
  };
}

export const raceControlStore = createRaceControlStore();