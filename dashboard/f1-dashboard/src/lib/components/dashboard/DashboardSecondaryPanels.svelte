<script lang="ts">
  import type { RaceControlMessage } from '../../types/raceControl';
  import type { TeamRadioCapture } from '../../types/teamRadio';

  import RaceControlPanel from '../race-control/RaceControlPanel.svelte';
  import TeamRadioPanel from '../team-radio/TeamRadioPanel.svelte';

  interface Props {
    teamRadio: TeamRadioCapture[];
    raceControlMessages: RaceControlMessage[];
  }

  let { teamRadio, raceControlMessages }: Props = $props();
</script>

<div class="mt-2 grid items-stretch gap-2 xl:grid-cols-[0.95fr_1.25fr]">
  <TeamRadioPanel captures={teamRadio} />
  <RaceControlPanel messages={raceControlMessages} />
</div>
