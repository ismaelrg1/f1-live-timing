<script lang="ts">
  import Flag from 'lucide-svelte/icons/flag';

  import type { TrackStatusCode } from '../../types/dashboard';

  interface Props {
    code: TrackStatusCode;
    message: string;
  }

  let { code, message }: Props = $props();

  let label = $derived.by(() => {
    if (code === '1') return 'TRACK CLEAR';
    if (code === '2') return 'YELLOW';
    if (code === '4') return 'SC';
    if (code === '5') return 'RED';
    if (code === '6') return 'VSC';
    if (code === '7') return 'VSC ENDING';
    return message || 'UNKNOWN';
  });

  let colorClass = $derived.by(() => {
    if (code === '1') return 'bg-emerald-500 text-zinc-950 ring-emerald-300/40';
    if (code === '2') return 'bg-yellow-400 text-zinc-950 ring-yellow-200/50';
    if (code === '4') return 'bg-yellow-300 text-zinc-950 ring-yellow-100/60';
    if (code === '5') return 'bg-red-500 text-white ring-red-300/50';
    if (code === '6') return 'bg-orange-400 text-zinc-950 ring-orange-200/50';
    if (code === '7') return 'bg-orange-300 text-zinc-950 ring-orange-100/50';
    return 'bg-zinc-700/40 text-zinc-300 ring-zinc-600/40';
  });
</script>

<span
  class={[
    'inline-flex h-6 items-center rounded px-2 text-[10px] font-black uppercase tracking-wide ring-1',
    colorClass
  ]}
  title={message}
>
  <Flag size={11} strokeWidth={2.6} class="mr-1" />
  {label}
</span>
