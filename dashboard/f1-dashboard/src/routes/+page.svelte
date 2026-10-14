<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import DashboardHeader from '../lib/components/dashboard/DashboardHeader.svelte';
  import DashboardSecondaryPanels from '../lib/components/dashboard/DashboardSecondaryPanels.svelte';
  import DriverTable from '../lib/components/driver-table/DriverTable.svelte';

  import { dashboardData, type DashboardDataMode } from '../lib/stores/dashboardStore';
  import { visibleColumns } from '../lib/stores/columnsStore';
  import { raceControlStore } from '../lib/stores/raceControlStore';
  import { teamRadioStore } from '../lib/stores/teamRadioStore';

  let dataMode = $derived($dashboardData.mode);
  let activeSession = $derived($dashboardData.session);
  let activeDrivers = $derived($dashboardData.drivers);

  let replayProgressLabel = $derived.by(() => {
    return `${Math.round($dashboardData.replayProgress * 100)}%`;
  });

  onMount(() => {
    dashboardData.loadReplays();
    dashboardData.connectLiveWebSocket();
  });

  onDestroy(() => {
    dashboardData.disconnectWebSocket();
  });

  function handleModeChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const mode = select.value as DashboardDataMode;

    if (mode === 'live') {
      dashboardData.connectLiveWebSocket();
      return;
    }

    const replayId = $dashboardData.selectedReplayId ?? $dashboardData.replays[0]?.id;

    if (replayId) {
      dashboardData.connectReplayById(replayId);
    }
  }

  function handleReplayChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    if (select.value) {
      dashboardData.connectReplayById(select.value);
    }
  }

  function handleReplayToggle() {
    if ($dashboardData.replayPaused) {
      dashboardData.playReplay();
      return;
    }

    dashboardData.pauseReplay();
  }

  function handleReplaySpeedChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    dashboardData.setReplaySpeed(Number(select.value));
  }

  function handleReplaySeek(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    dashboardData.seekReplay(Number(input.value) / 1000);
  }

  function replayMarkerClass(kind: string) {
    if (kind === 'start') return 'border-emerald-300 bg-emerald-400 shadow-emerald-400/40';
    if (kind === 'aborted') return 'border-red-200 bg-red-500 shadow-red-500/40';
    return 'border-sky-200 bg-sky-400 shadow-sky-400/40';
  }

  function replayMarkerSegmentClass(kind: string) {
    if (kind === 'safety_car') return 'bg-yellow-400/45';
    if (kind === 'virtual_safety_car') return 'bg-yellow-300/30';
    if (kind === 'red_flag') return 'bg-red-500/50';
    return '';
  }

  function isReplaySegment(kind: string) {
    return ['safety_car', 'virtual_safety_car', 'red_flag'].includes(kind);
  }
</script>

<svelte:head>
  <title>F1 Live Dashboard</title>
</svelte:head>

<section class="min-h-screen bg-zinc-950 p-2 text-zinc-100 sm:p-3">
  <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
    <div class="min-w-0">
      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
        Data source
      </p>

      <p class="truncate text-xs font-semibold text-zinc-400">
        {#if dataMode === 'live'}
          {#if $dashboardData.liveRunning}
            Live timing · {$dashboardData.lastTopic ?? 'waiting'}
          {:else if $dashboardData.connecting}
            Connecting live timing...
          {:else}
            Live timing inactive
          {/if}
        {:else if $dashboardData.connected}
          Replay connected · {$dashboardData.lastTopic ?? 'waiting'}
        {:else if $dashboardData.connecting}
          Connecting replay...
        {:else}
          Replay disconnected
        {/if}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500"
      >
        <span>Source</span>
        <select
          value={dataMode}
          class="h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold normal-case tracking-normal text-zinc-100 outline-none focus:border-sky-500"
          onchange={handleModeChange}
        >
          <option value="live">Live Timing</option>
          <option value="replay">Replay</option>
        </select>
      </label>

      {#if dataMode === 'replay'}
        <label
          class="flex min-w-0 items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500"
        >
          <span>Session</span>
          <select
            value={$dashboardData.selectedReplayId ?? ''}
            class="h-8 max-w-[22rem] rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold normal-case tracking-normal text-zinc-100 outline-none focus:border-sky-500"
            onchange={handleReplayChange}
            disabled={$dashboardData.replays.length === 0}
          >
            {#each $dashboardData.replays as replay}
              <option value={replay.id}>
                {replay.label}
              </option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  </div>

  {#if $dashboardData.error}
    <div class="mb-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
      {$dashboardData.error}
    </div>
  {/if}

  {#if dataMode === 'replay'}
    <div class="mb-2 grid gap-2 rounded border border-zinc-800 bg-zinc-900/70 px-3 py-2 lg:grid-cols-[auto_auto_1fr_auto] lg:items-center">
      <button
        type="button"
        class="h-8 rounded border border-zinc-700 bg-zinc-950 px-3 text-xs font-black text-zinc-100 hover:border-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        onclick={handleReplayToggle}
        disabled={!$dashboardData.connected}
      >
        {$dashboardData.replayPaused ? 'Play' : 'Pause'}
      </button>

      <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
        <span>Speed</span>
        <select
          value={String($dashboardData.replaySpeed)}
          class="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs font-bold normal-case tracking-normal text-zinc-100 outline-none focus:border-sky-500"
          onchange={handleReplaySpeedChange}
          disabled={!$dashboardData.connected}
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
          <option value="30">30x</option>
          <option value="50">50x</option>
          <option value="100">100x</option>
        </select>
        <span class="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs font-black normal-case tracking-normal text-sky-300">
          {$dashboardData.replaySpeed}x
        </span>
      </label>

      <label class="grid min-w-0 gap-1">
        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
          <span>Replay timeline</span>
          <span class="tabular-nums">
            {$dashboardData.replayCurrentIndex} / {$dashboardData.replayTotalEvents}
          </span>
        </div>

        <div class="relative h-8">
          <input
            type="range"
            min="0"
            max="1000"
            step="1"
            value={Math.round($dashboardData.replayProgress * 1000)}
            class="absolute left-0 right-0 top-1/2 z-10 w-full -translate-y-1/2 accent-sky-500"
            onchange={handleReplaySeek}
            disabled={!$dashboardData.connected}
          />

          <div class="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-1.5 -translate-y-1/2 overflow-hidden rounded-full">
            {#each $dashboardData.replayMarkers as marker}
              {#if marker.end_progress !== undefined && marker.end_progress !== null && isReplaySegment(marker.kind)}
                <span
                  class={[
                    'absolute top-0 h-full rounded-full',
                    replayMarkerSegmentClass(marker.kind)
                  ]}
                  style={`left: ${marker.progress * 100}%; width: max(3px, ${Math.max(0, marker.end_progress - marker.progress) * 100}%)`}
                  title={`${marker.label} · ${marker.status}`}
                ></span>
              {/if}
            {/each}
          </div>

          <div class="pointer-events-none absolute left-0 right-0 top-1/2 z-30 h-4 -translate-y-1/2">
            {#each $dashboardData.replayMarkers as marker}
              {#if !isReplaySegment(marker.kind)}
                <span
                  class={[
                    'absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[0_0_10px]',
                    replayMarkerClass(marker.kind)
                  ]}
                  style={`left: ${marker.progress * 100}%`}
                  title={`${marker.label} · ${marker.status}`}
                ></span>
              {/if}
            {/each}
          </div>
        </div>
      </label>

      <div class="text-right text-xs font-black tabular-nums text-zinc-300">
        {replayProgressLabel}
      </div>
    </div>
  {/if}

  {#if activeSession && activeDrivers.length > 0}
    <DashboardHeader session={activeSession} />

    <DriverTable
      session={activeSession}
      drivers={activeDrivers}
      columns={$visibleColumns}
    />

    <DashboardSecondaryPanels
      teamRadio={$teamRadioStore}
      raceControlMessages={$raceControlStore}
    />
  {:else}
    <div class="rounded border border-zinc-800 bg-zinc-900/70 p-6 text-sm font-bold text-zinc-400">
      {#if dataMode === 'live'}
        Waiting for live timing data...
      {:else if $dashboardData.replays.length === 0}
        No saved replays found.
      {:else}
        Select a replay session.
      {/if}
    </div>
  {/if}
</section>
