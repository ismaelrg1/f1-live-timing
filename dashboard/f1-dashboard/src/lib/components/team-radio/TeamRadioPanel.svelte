<script lang="ts">
  import type { TeamRadioCapture } from '../../types/teamRadio';
  import TeamRadioItem from './TeamRadioItem.svelte';

  interface Props {
    captures: TeamRadioCapture[];
  }

  let { captures }: Props = $props();
</script>

<section class="flex h-80 min-h-0 flex-col overflow-hidden rounded border border-zinc-800 bg-zinc-950/70">
  <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-3 py-2">
    <h2 class="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
      Team Radio
    </h2>

    <span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-black tabular-nums text-zinc-400">
      {captures.length}
    </span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#71717a_#18181b] [scrollbar-width:thin]">
    {#if captures.length === 0}
      <div class="px-3 py-4 text-xs font-semibold text-zinc-600">
        No radio captures
      </div>
    {:else}
      {#each captures as capture}
        <TeamRadioItem {capture} />
      {/each}
    {/if}
  </div>
</section>
