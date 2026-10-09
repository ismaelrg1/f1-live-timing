<script lang="ts">
  import { onDestroy } from 'svelte';

  import DashboardHeader from '../lib/components/dashboard/DashboardHeader.svelte';
  import DriverTable from '../lib/components/driver-table/DriverTable.svelte';
  import { defaultMockScenario, mockScenarios } from '../lib/data/mockScenarios';
  import { dashboardData, type DashboardDataMode } from '../lib/stores/dashboardStore';
  import { visibleColumns } from '../lib/stores/columnsStore';

  let activeScenarioId = $state(defaultMockScenario.id);
  let replayUrl = $state('ws://127.0.0.1:8765');

  let activeScenario = $derived.by(() => {
    return mockScenarios.find((scenario) => scenario.id === activeScenarioId) ?? defaultMockScenario;
  });

  let dataMode = $derived($dashboardData.mode);
  let activeSession = $derived($dashboardData.session ?? activeScenario.session);
  let activeDrivers = $derived(
    $dashboardData.session ? $dashboardData.drivers : activeScenario.drivers
  );

  $effect(() => {
    if (dataMode === 'mock') {
      dashboardData.setMockData(activeScenario.session, activeScenario.drivers);
    }
  });

  function handleModeChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const mode = select.value as DashboardDataMode;

    if (mode === 'mock') {
      dashboardData.setMockData(activeScenario.session, activeScenario.drivers);
      return;
    }

    dashboardData.connectReplayWebSocket(replayUrl);
  }

  function handleReplayConnect() {
    dashboardData.connectReplayWebSocket(replayUrl);
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

  let replayProgressLabel = $derived.by(() => {
    return `${Math.round($dashboardData.replayProgress * 100)}%`;
  });

  function replayMarkerClass(kind: string) {
    if (kind === 'start') return 'border-emerald-300 bg-emerald-400 shadow-emerald-400/40';
    if (kind === 'aborted') return 'border-red-200 bg-red-500 shadow-red-500/40';
    return 'border-sky-200 bg-sky-400 shadow-sky-400/40';
  }

  onDestroy(() => {
    dashboardData.disconnectReplayWebSocket();
  });
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
        {#if dataMode === 'mock'}
          {activeScenario.description}
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
          <option value="mock">Mock</option>
          <option value="replay">Replay</option>
        </select>
      </label>

      {#if dataMode === 'mock'}
        <label
          class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500"
        >
          <span>Scenario</span>
          <select
            bind:value={activeScenarioId}
            class="h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold normal-case tracking-normal text-zinc-100 outline-none focus:border-sky-500"
          >
            {#each mockScenarios as scenario}
              <option value={scenario.id}>{scenario.label}</option>
            {/each}
          </select>
        </label>
      {:else}
        <input
          bind:value={replayUrl}
          class="h-8 w-56 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-semibold text-zinc-100 outline-none focus:border-sky-500"
        />

        <button
          type="button"
          class="h-8 rounded border border-zinc-700 bg-zinc-900 px-3 text-xs font-black text-zinc-100 hover:border-sky-500"
          onclick={handleReplayConnect}
        >
          Connect
        </button>
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
        <div class="relative pt-2">
          <input
            type="range"
            min="0"
            max="1000"
            step="1"
            value={Math.round($dashboardData.replayProgress * 1000)}
            class="relative z-10 w-full accent-sky-500"
            onchange={handleReplaySeek}
            disabled={!$dashboardData.connected}
          />

          <div class="pointer-events-none absolute left-0 right-0 top-0 h-3">
            {#each $dashboardData.replayMarkers as marker}
              <span
                class={[
                  'absolute top-0 h-3 w-1.5 -translate-x-1/2 rounded-full border shadow-[0_0_10px]',
                  replayMarkerClass(marker.kind)
                ]}
                style={`left: ${marker.progress * 100}%`}
                title={`${marker.label} · ${marker.status}`}
              ></span>
            {/each}
          </div>
        </div>
      </label>

      <div class="text-right text-xs font-black tabular-nums text-zinc-300">
        {replayProgressLabel}
      </div>
    </div>
  {/if}

  <DashboardHeader session={activeSession} />

  <DriverTable
    session={activeSession}
    drivers={activeDrivers}
    columns={$visibleColumns}
  />
</section>
