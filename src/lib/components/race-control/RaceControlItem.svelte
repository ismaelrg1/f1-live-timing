<script lang="ts">
  import type { RaceControlMessage } from '../../types/raceControl';

  interface Props {
    message: RaceControlMessage;
  }

  let { message }: Props = $props();

  function categoryClass(category: string, flag: string) {
    const value = `${category} ${flag}`.toLowerCase();

    if (value.includes('red')) return 'border-red-400/40 bg-red-500/15 text-red-300';
    if (value.includes('yellow')) return 'border-yellow-300/40 bg-yellow-400/15 text-yellow-200';
    if (value.includes('green')) return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300';
    if (value.includes('clear')) return 'border-sky-400/40 bg-sky-500/15 text-sky-300';
    if (value.includes('chequered')) return 'border-zinc-200/40 bg-zinc-100/15 text-zinc-100';

    return 'border-zinc-500/40 bg-zinc-700/30 text-zinc-300';
  }

  function formatTime(value: string) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  let badgeText = $derived(message.flag || message.category || 'INFO');
</script>

<div class="grid grid-cols-[4rem_3rem_7.5rem_minmax(0,1fr)] items-center gap-3 border-b border-zinc-800/80 px-3 py-2.5 transition hover:bg-zinc-900/70 last:border-b-0">
  <span class="text-[10px] font-bold tabular-nums leading-tight text-zinc-500">
    {formatTime(message.utc)}
  </span>

  <span class="text-center text-[10px] font-black tabular-nums text-zinc-500">
    {message.lap ? `L${message.lap}` : '-'}
  </span>

  <span
    class={[
      'inline-flex w-fit min-w-16 justify-center rounded border px-2 py-1 text-[10px] font-black uppercase',
      categoryClass(message.category, message.flag)
    ]}
  >
    {badgeText}
  </span>

  <div class="min-w-0">
    <p class="truncate text-xs font-black text-zinc-200">
      {message.message || '-'}
    </p>

    <p class="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-zinc-600">
      {#if message.driverTla}
        {message.driverTla}
      {:else if message.racingNumber}
        #{message.racingNumber}
      {:else}
        Race control
      {/if}

      {#if message.sector}
        · Sector {message.sector}
      {/if}

      {#if message.status}
        · {message.status}
      {/if}
    </p>
  </div>
</div>
