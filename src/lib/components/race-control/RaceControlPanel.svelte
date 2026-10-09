<script lang="ts">
  import type { RaceControlMessage } from '../../types/raceControl';
  import RaceControlItem from './RaceControlItem.svelte';

  interface Props {
    messages: RaceControlMessage[];
  }

  let { messages }: Props = $props();
</script>

<section class="min-h-0 overflow-hidden rounded border border-zinc-800 bg-zinc-950/70">
  <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-3 py-2">
    <h2 class="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
      Race Control
    </h2>

    <span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-black tabular-nums text-zinc-400">
      {messages.length}
    </span>
  </div>

  <div class="max-h-64 overflow-y-auto [scrollbar-color:#71717a_#18181b] [scrollbar-width:thin]">
    {#if messages.length === 0}
      <div class="px-3 py-4 text-xs font-semibold text-zinc-600">
        No race control messages
      </div>
    {:else}
      {#each messages as message}
        <RaceControlItem {message} />
      {/each}
    {/if}
  </div>
</section>
