<script lang="ts">
  import type { RaceControlMessage } from '../../types/raceControl';
  import RaceControlItem from './RaceControlItem.svelte';
  import {
    raceControlFilters,
    raceControlKind,
    type RaceControlFilterId
  } from './raceControlFilters';

  interface Props {
    messages: RaceControlMessage[];
  }

  let { messages }: Props = $props();

  let activeFilter = $state<RaceControlFilterId>('all');

  let filterCounts = $derived.by(() => {
    const counts = new Map<RaceControlFilterId, number>();
    counts.set('all', messages.length);

    for (const message of messages) {
      const kind = raceControlKind(message);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }

    return counts;
  });

  let visibleFilters = $derived.by(() => {
    return raceControlFilters.filter((filter) => {
      if (filter.id === 'all') return true;
      return (filterCounts.get(filter.id) ?? 0) > 0;
    });
  });

  let filteredMessages = $derived.by(() => {
    if (activeFilter === 'all') return messages;

    return messages.filter((message) => raceControlKind(message) === activeFilter);
  });

  $effect(() => {
    if (activeFilter !== 'all' && (filterCounts.get(activeFilter) ?? 0) === 0) {
      activeFilter = 'all';
    }
  });
</script>

<section class="flex h-80 min-h-0 flex-col overflow-hidden rounded border border-zinc-800 bg-zinc-950/70">
  <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-3 py-2">
    <h2 class="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
      Race Control
    </h2>

    <div class="flex items-center gap-2">
      {#if activeFilter !== 'all'}
        <span class="text-[10px] font-black uppercase tracking-wide text-zinc-600">
          {filteredMessages.length} shown
        </span>
      {/if}

      <span class="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-black tabular-nums text-zinc-400">
        {messages.length}
      </span>
    </div>
  </div>

  <div class="border-b border-zinc-800 bg-zinc-950/80 px-3 py-2">
    <div class="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
      {#each visibleFilters as filter}
        {@const count = filterCounts.get(filter.id) ?? 0}
        <button
          type="button"
          class={[
            'shrink-0 rounded border px-2 py-1 text-[10px] font-black uppercase tracking-wide transition',
            activeFilter === filter.id
              ? 'border-sky-400 bg-sky-500/15 text-sky-200'
              : 'border-zinc-800 bg-zinc-900/70 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200'
          ]}
          onclick={() => (activeFilter = filter.id)}
        >
          {filter.label}
          <span class="ml-1 tabular-nums opacity-70">{count}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#71717a_#18181b] [scrollbar-width:thin]">
    {#if messages.length === 0}
      <div class="px-3 py-4 text-xs font-semibold text-zinc-600">
        No race control messages
      </div>
    {:else if filteredMessages.length === 0}
      <div class="px-3 py-4 text-xs font-semibold text-zinc-600">
        No messages for this filter
      </div>
    {:else}
      {#each filteredMessages as message}
        <RaceControlItem {message} kind={raceControlKind(message)} />
      {/each}
    {/if}
  </div>
</section>
