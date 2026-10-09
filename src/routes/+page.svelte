<script lang="ts">
  import DashboardHeader from '../lib/components/dashboard/DashboardHeader.svelte';
  import DriverTable from '../lib/components/driver-table/DriverTable.svelte';

  // import { mockDriverRows, mockSessionState } from '../lib/data/mockDashboard';
  import {
    mockQualifyingQ1LiveDriverRows as mockDriverRows,
    mockQualifyingQ1LiveSessionState as mockSessionState
  } from '../lib/data/mockDashboard';

  import { visibleColumns } from '../lib/stores/columnsStore';
</script>

<section class="min-h-screen bg-zinc-950 p-6 text-zinc-100">

  <DashboardHeader session={mockSessionState} />

  <DriverTable
    session={mockSessionState}
    drivers={mockDriverRows}
    columns={$visibleColumns}
  />
</section>

<!-- <PageShell>
  <DashboardHeader session={session} />

  <DriverTable
    drivers={drivers}
    columns={visibleColumns}
  />
</PageShell> -->





<!-- <script lang="ts">
    // lógica Typescript
    import { mockDriverRows, mockSessionState } from '../lib/data/mockDashboard';
    import type { DriverRow } from '../lib/types/dashboard';

    function tyreLetter(compound: string) {
        if (compound === 'SOFT') return 'S';
        if (compound === 'MEDIUM') return 'M';
        if (compound === 'HARD') return 'H';
        if (compound === 'INTERMEDIATE') return 'I';
        if (compound === 'WET') return 'W';
        return '?';
    }

    function pitState(driver: (typeof mockDriverRows)[number]) {
        if (driver.retired) return 'RET';
        if (driver.stopped) return 'STOP';
        if (driver.inPit) return 'IN';
        if (driver.pitOut) return 'OUT';
        return '';
    }

    function gridDeltaLabel(gridDelta: number | null) {
        if (gridDelta === null) return { symbol: '—', value: '', direction: 'same' };
        if (gridDelta > 0) return { symbol: '▲', value: String(gridDelta), direction: 'up' };
        if (gridDelta < 0) return { symbol: '▼', value: String(Math.abs(gridDelta)), direction: 'down' };
        return { symbol: '—', value: '0', direction: 'same' };
    }

    function lastSectorValues(driver: DriverRow) {
        return driver.sectors.map((sector) => sector.value || '-');
    }

</script>

<svelte:head>
    <title>F1 Live Dashboard</title>
</svelte:head>

<main class="dashboard">
  <section class="session-header">
    <div>
      <p class="eyebrow">{mockSessionState.meetingName}</p>
      <h1>{mockSessionState.sessionName}</h1>
    </div>

    <div class="session-meta">
      <div>
        <span>Estado</span>
        <strong>{mockSessionState.sessionStatus}</strong>
      </div>

      <div>
        <span>Pista</span>
        <strong>{mockSessionState.trackStatusMessage}</strong>
      </div>

      <div>
        <span>Vuelta</span>
        <strong>{mockSessionState.currentLap ?? '-'}</strong>
      </div>

      <div>
        <span>Reloj</span>
        <strong>{mockSessionState.clockRemaining}</strong>
      </div>
    </div>
  </section>

  <section class="table-panel">
    <table>
      <thead>
        <tr>
          <th>PIT</th>
          <th>DRIVER</th>
          <th>TYRE</th>
          <th>BEST LAP</th>
          <th>GAP</th>
          <th>LAST LAP</th>
          <th class="center-col">SECTORS</th>
          <th class="center-col">LAST SECTORS</th>
          <th>LAPS</th>
        </tr>
      </thead>

      <tbody>
        {#each mockDriverRows as driver}
          {@const delta = gridDeltaLabel(driver.gridDelta)}
          <tr>
            <td>
              {#if pitState(driver)}
                <span class="pit-badge">{pitState(driver)}</span>
              {:else}
                <span class="muted">-</span>
              {/if}
            </td>

            <td>
              <div class="driver-cell">
                <span
                  class="driver-team-bar"
                  style={`background-color: #${driver.teamColour}`}
                ></span>

                <span class="driver-position">{driver.position}</span>

                <div class="driver-info">
                  <div>
                    <strong>{driver.tla}</strong>
                    <span class="driver-number">#{driver.racingNumber}</span>
                  </div>

                  <div class="driver-name-row">
                    <span>{driver.driverName}</span>

                    <span
                        class="grid-delta"
                        class:grid-up={delta.direction === 'up'}
                        class:grid-down={delta.direction === 'down'}
                        class:grid-same={delta.direction === 'same'}
                    >
                        <span>{delta.symbol}</span>
                        {#if delta.value}
                            <strong>{delta.value}</strong>
                        {/if}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <td>
              <div class="tyre-cell">
                <span class={`tyre-dot tyre-${driver.compound.toLowerCase()}`}>
                  {tyreLetter(driver.compound)}
                </span>
                <span>{driver.tyreLaps}</span>
              </div>
            </td>

            <td>{driver.bestLap || '-'}</td>

            <td>{driver.intervalToAhead || '-'}</td>

            <td class:purple={driver.lastLapOverallBest} class:green={driver.lastLapPersonalBest}>
              {driver.lastLap || '-'}
            </td>

            <td class="center-col">
              <div class="sector-board">
                {#each driver.sectors as sector}
                  <div class="sector-group">
                    <div class="mini-sector-group">
                      {#each sector.segments as segment}
                        <span class={`mini-sector mini-sector-${segment.status}`}></span>
                      {/each}
                    </div>

                    <div class="sector-values">
                      <span class:purple={sector.overallFastest} class:green={sector.personalFastest}>
                        {sector.value || '-'}
                      </span>

                      <span>{driver.bestSectors[sector.index]?.value || '-'}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </td>

            <td>
                <div class="last-sector-cell">
                    {#each lastSectorValues(driver) as sectorTime}
                    <span>{sectorTime}</span>
                    {/each}
                </div>
            </td>

            <td>{driver.laps}</td>

          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</main>


<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>


<style>
    /* CSS local del componente */
  :global(body) {
    margin: 0;
    background: #101113;
    color: #f4f4f5;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .dashboard {
    min-height: 100vh;
    padding: 24px;
    background: #101113;
  }

  .session-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }

  .eyebrow {
    margin: 0 0 4px;
    color: #a1a1aa;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h1 {
    margin: 0;
    font-size: 32px;
  }

  .session-meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(90px, 1fr));
    gap: 12px;
  }

  .session-meta div {
    padding: 10px 12px;
    background: #181a1f;
    border: 1px solid #2a2d35;
    border-radius: 8px;
  }

  .session-meta span {
    display: block;
    margin-bottom: 4px;
    color: #a1a1aa;
    font-size: 12px;
  }

  .session-meta strong {
    font-size: 15px;
  }

  .table-panel {
    overflow-x: auto;
    border: 1px solid #2a2d35;
    border-radius: 8px;
    background: #15171b;
  }

  table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 11px 12px;
    border-right: 1px solid #252832;
    border-bottom: 1px solid #252832;
    text-align: left;
    white-space: nowrap;
  }

  th:last-child,
  td:last-child {
    border-right: 0;
  }

  th {
    color: #a1a1aa;
    font-size: 12px;
    font-weight: 700;
    background: #1b1e24;
  }

  td {
    font-size: 14px;
  }

  tbody tr:hover {
    background: #1b1e24;
  }

  .center-col {
    text-align: center;
  }

  .driver-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .driver-team-bar {
    display: inline-block;
    width: 5px;
    height: 34px;
    border-radius: 2px;
  }

  .driver-position {
    min-width: 24px;
    color: #f4f4f5;
    font-size: 18px;
    font-weight: 800;
    text-align: right;
  }

  .driver-info {
    display: grid;
    gap: 2px;
  }

  .driver-info div {
    display: flex;
    align-items: baseline;
    gap: 7px;
  }

  .driver-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a1a1aa;
    font-size: 12px;
  }

  .driver-number,
  .muted {
    color: #a1a1aa;
    font-size: 12px;
  }

.grid-delta {
    display: inline-flex;
    min-width: 30px;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
  }

  .grid-delta span {
    font-size: 13px;
    line-height: 1;
  }

  .grid-delta strong {
    font-size: 12px;
  }

  .grid-up {
    color: #2dd4bf;
  }

  .grid-down {
    color: #fb7185;
  }

  .grid-same {
    color: #71717a;
  }

  .grid-up {
    color: #22c55e;
  }

  .grid-down {
    color: #ef4444;
  }

  .grid-same {
    color: #a1a1aa;
  }

  .tyre-cell {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 800;
  }

  .tyre-dot {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: #111;
    font-size: 12px;
    font-weight: 900;
  }

  .tyre-soft {
    background: #f43f5e;
    color: white;
  }

  .tyre-medium {
    background: #facc15;
  }

  .tyre-hard {
    background: #f4f4f5;
  }

  .tyre-intermediate {
    background: #22c55e;
    color: white;
  }

  .tyre-wet {
    background: #38bdf8;
  }

  .tyre-unknown {
    background: #71717a;
    color: white;
  }

  .pit-badge {
    display: inline-flex;
    min-width: 38px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: #27272a;
    color: #facc15;
    font-size: 12px;
    font-weight: 900;
  }

  .sector-board {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }

  .sector-group {
    display: grid;
    gap: 6px;
    justify-items: center;
  }

  .mini-sector-group {
    display: flex;
    gap: 2px;
  }

  .mini-sector {
    width: 8px;
    height: 5px;
    border-radius: 1px;
    background: #3f3f46;
  }

  .mini-sector-0 {
    background: #27272a;
  }

  .mini-sector-2048 {
    background: #eab308;
  }

  .mini-sector-2049 {
    background: #22c55e;
  }

  .mini-sector-2050,
  .mini-sector-2052 {
    background: #f97316;
  }

  .mini-sector-2051 {
    background: #a855f7;
  }

  .mini-sector-2064 {
    background: #71717a;
  }

  .sector-values {
    display: flex;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .sector-values span:first-child {
    color: #d4d4d8;
  }

  .sector-values span:last-child {
    color: #a1a1aa;
  }

  .green {
    color: #22c55e !important;
    font-weight: 800;
  }

  .purple {
    color: #c084fc !important;
    font-weight: 800;
  }

  .last-sector-cell {
    display: grid;
    grid-template-columns: repeat(3, minmax(54px, 1fr));
    gap: 8px;
    justify-items: center;
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: #e5e7eb;
  }

  .last-sector-cell span {
    min-width: 54px;
    text-align: center;
  }

  @media (max-width: 760px) {
    .dashboard {
      padding: 16px;
    }

    .session-header {
      display: block;
    }

    .session-meta {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 16px;
    }
  }
</style> -->
