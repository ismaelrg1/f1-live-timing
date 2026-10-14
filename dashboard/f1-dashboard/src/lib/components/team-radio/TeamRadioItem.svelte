<script lang="ts">
  import Pause from 'lucide-svelte/icons/pause';
  import Play from 'lucide-svelte/icons/play';
  import Radio from 'lucide-svelte/icons/radio';
  import type { TeamRadioCapture } from '../../types/teamRadio';

  interface Props {
    capture: TeamRadioCapture;
  }

  let { capture }: Props = $props();

  let audioElement = $state<HTMLAudioElement | null>(null);
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  function formatTime(value: string) {
    if (!value) return '-';

    const normalizedValue = value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)
      ? value
      : `${value}Z`;
    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function formatDuration(value: number) {
    if (!Number.isFinite(value) || value <= 0) return '0:00';

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  async function togglePlayback() {
    if (!audioElement) return;

    if (audioElement.paused) {
      await audioElement.play();
      playing = true;
      return;
    }

    audioElement.pause();
    playing = false;
  }

  function handleLoadedMetadata() {
    duration = audioElement?.duration ?? 0;
  }

  function handleTimeUpdate() {
    currentTime = audioElement?.currentTime ?? 0;
  }

  function handleEnded() {
    playing = false;
    currentTime = 0;
  }

  let progress = $derived.by(() => {
    if (!duration) return 0;

    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  });
</script>

<div class="grid grid-cols-[4rem_5rem_minmax(0,1fr)_11rem] items-center gap-3 border-b border-zinc-800/80 px-3 py-2.5 transition hover:bg-zinc-900/70 last:border-b-0">
  <span class="text-[10px] font-bold tabular-nums leading-tight text-zinc-500">
    {formatTime(capture.utc)}
  </span>

  <span class="inline-flex min-w-0 items-center gap-2">
    <span
      class="h-6 w-1 rounded-full shadow-[0_0_12px_currentColor]"
      style={`background-color: #${capture.teamColour || '71717a'}`}
    ></span>

    <span class="truncate text-xs font-black text-zinc-100">
      {capture.driverTla || capture.racingNumber}
    </span>
  </span>

  <span class="truncate text-xs font-semibold text-zinc-400">
    {capture.driverName || 'Unknown driver'}
  </span>

  {#if capture.url}
    <div class="grid grid-cols-[2rem_1fr_2.25rem] items-center gap-2">
      <button
        type="button"
        class="grid size-8 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-sky-400 hover:bg-sky-500/10"
        onclick={togglePlayback}
        title={playing ? 'Pause' : 'Play'}
      >
        {#if playing}
          <Pause size={14} fill="currentColor" />
        {:else}
          <Play size={14} fill="currentColor" />
        {/if}
      </button>

      <div class="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          class="h-full rounded-full bg-sky-400 transition-[width]"
          style={`width: ${progress}%`}
        ></div>
      </div>

      <span class="text-right text-[10px] font-black tabular-nums text-zinc-500">
        {formatDuration(duration || currentTime)}
      </span>

      <audio
        bind:this={audioElement}
        preload="metadata"
        src={capture.url}
        onloadedmetadata={handleLoadedMetadata}
        ontimeupdate={handleTimeUpdate}
        onended={handleEnded}
        onpause={() => (playing = false)}
        onplay={() => (playing = true)}
      ></audio>
    </div>
  {:else}
    <Radio size={14} class="text-zinc-600" />
  {/if}
</div>
