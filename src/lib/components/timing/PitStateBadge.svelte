<script lang="ts">
  import type { DriverRow } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();

  let label = $derived.by(() => {
    if (driver.retired) return 'RET';
    if (driver.stopped) return 'STOP';
    if (driver.inPit) return 'IN';
    if (driver.pitOut) return 'OUT';
    return '';
  });

  let title = $derived.by(() => {
    if (driver.retired) return 'Retired';
    if (driver.stopped) return 'Stopped on track';
    if (driver.inPit) return 'In pit lane';
    if (driver.pitOut) return 'Pit out';
    return 'No pit state';
  });

  let colorClass = $derived.by(() => {
    if (driver.retired) return 'bg-red-500/15 text-red-300 ring-red-500/30';
    if (driver.stopped) return 'bg-orange-500/15 text-orange-300 ring-orange-500/30';
    if (driver.inPit) return 'bg-sky-500/15 text-sky-300 ring-sky-500/30';
    if (driver.pitOut) return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';
    return 'text-zinc-600';
  });
</script>

{#if label}
  <span
    class={[
      'inline-flex min-w-9 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-black tracking-wide ring-1',
      colorClass
    ]}
    {title}
  >
    {label}
  </span>
{:else}
  <span class="text-zinc-600" title={title}>-</span>
{/if}
