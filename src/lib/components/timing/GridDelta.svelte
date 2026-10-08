<script lang="ts">
  type DeltaDirection = 'up' | 'down' | 'same' | 'unknown';

  interface Props {
    value: number | null;
  }

  let { value }: Props = $props();

  let direction = $derived.by<DeltaDirection>(() => {
    if (value === null) return 'unknown';
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'same';
  });

  let displayValue = $derived.by(() => {
    if (value === null) return '';
    if (value === 0) return '0';
    return String(Math.abs(value));
  });

  let symbol = $derived.by(() => {
    if (direction === 'up') return '▲';
    if (direction === 'down') return '▼';
    return 'ー';
  });
</script>

<span
  class={[
    'inline-flex min-w-8 items-center justify-start gap-1 text-xs font-black tabular-nums leading-none',
    direction === 'up' && 'text-emerald-400',
    direction === 'down' && 'text-red-400',
    (direction === 'same' || direction === 'unknown') && 'text-zinc-500'
  ]}
  title="Grid position change"
>
  <span class="text-sm leading-none">{symbol}</span>

  {#if displayValue}
    <strong class="text-xs leading-none">{displayValue}</strong>
  {/if}
</span>