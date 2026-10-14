import { writable } from 'svelte/store';
import type { TeamRadioCapture } from '../types/teamRadio';

function createTeamRadioStore() {
  const { subscribe, set } = writable<TeamRadioCapture[]>([]);

  return {
    subscribe,

    setCaptures(captures: TeamRadioCapture[]) {
      set(captures);
    },

    reset() {
      set([]);
    }
  };
}

export const teamRadioStore = createTeamRadioStore();