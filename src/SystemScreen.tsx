import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { MetricTile, Panel, Sparkline, Stat } from './primitives';
import { useSystemTelemetry } from './hooks';
import { getBridge, type OsProcess, type OsWindow } from './pcBridge';

const HISTORY_LEN = 40;

function pushHistory(prev: number[], value: number) {
  const next = [...prev, value];
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

export function SystemScreen() {
  const telemetry = useSystemTelemetry(1500);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [netHistory, setNetHistory] = useState<number[]>([]);
  const [processes, setProcesses] = useState<OsProcess[]>([]);
  const [windows, setWindows] = useState<OsWindow[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!telemetry) return;
    if (telemetry.load) setCpuHistory((prev) => pushHistory(prev, telemetry.load!.total));
    if (telemetry.memory) setMemHistory((prev) => pushHistory(prev, telemetry.memory!.usedPct));
    if (telemetry.net) setNetHistory((prev) => pushHistory(prev, (telemetry.net!.rxPerSec + telemetry.net!.txPerSec) / 1024));
  }, [telemetry]);

  const refreshProcesses = async () => {
    const bridge = getBridge();
    if (!bridge) return;
    const result = await bridge.processes.list(filter);
    if ('processes' in result) setProcesses(result.processes.slice(0, 50));
  };

  const refreshWindows = async () => {
    const bridge = getBridge();
    if (!bridge) return;
    const result = await bridge.windows.list();
    if ('windows' in result) setWindows(result.windows.slice(0, 30));
  };

  useEffect(() => {
    refreshProcesses();
    refreshWindows();
  }, []);

  const killPid = async (pid: number) => {
    const bridge = getBridge();
    if (!bridge) return;
    await bridge.processes.kill(pid, false);
    refreshProcesses();
  };

  const focusWindow = async (handle: number) => {
    const bridge = getBridge();
    if (!bridge) return;
    await bridge.windows.focus(handle);
  };

  const bridgeMissing = !getBridge();

  if (bridgeMissing) {
    return (
      <div className="screen-grid">
        <Panel title="System" tone="warn" flag="OFFLINE">
          <div className="micro-label">PC bridge unavailable — running outside Electron. Use `npm run dev` to launch the desktop shell.</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="screen-grid system-grid">
      <div className="screen-column">
        <Panel title="CPU" flag={telemetry?.cpu ? telemetry.cpu.brand : 'PROBING'}>
          <Stat label="Load" value={telemetry?.load?.total ?? 0} max={100} unit="%" />
          <Sparkline data={cpuHistory.length ? cpuHistory : [0]} width={260} height={36} />
          <div className="metric-grid">
            <MetricTile label="CORES" value={telemetry?.cpu?.cores ?? '—'} />
            <MetricTile label="USER" value={`${(telemetry?.load?.user ?? 0).toFixed(0)}%`} />
            <MetricTile label="SYS" value={`${(telemetry?.load?.system ?? 0).toFixed(0)}%`} />
            <MetricTile label="GHZ" value={telemetry?.cpu ? telemetry.cpu.speedGhz.toFixed(1) : '—'} />
          </div>
        </Panel>

        <Panel title="Memory" flag={telemetry?.memory ? `${telemetry.memory.totalGb.toFixed(0)} GB` : 'PROBING'}>
          <Stat label="Used" value={telemetry?.memory?.usedPct ?? 0} max={100} unit="%" />
          <Sparkline data={memHistory.length ? memHistory : [0]} width={260} height={36} />
          <div className="metric-grid">
            <MetricTile label="USED" value={telemetry?.memory ? `${telemetry.memory.usedGb.toFixed(1)} GB` : '—'} />
            <MetricTile label="FREE" value={telemetry?.memory ? `${telemetry.memory.freeGb.toFixed(1)} GB` : '—'} />
          </div>
        </Panel>

        <Panel title="Disks" flag={`${telemetry?.disks?.length ?? 0} MOUNTED`} className="stretch-panel">
          <div className="list-stack">
            {telemetry?.disks?.slice(0, 5).map((disk) => (
              <div key={disk.mount} className="part-item">
                <strong>{disk.mount}</strong>
                <div className="part-meta">
                  <span>{disk.type}</span>
                  <span>{disk.usedGb.toFixed(0)} / {disk.sizeGb.toFixed(0)} GB</span>
                  <span className={disk.usedPct > 85 ? 'warn-text' : disk.usedPct > 70 ? 'yellow-text' : 'ok-text'}>
                    {disk.usedPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            )) ?? <div className="micro-label">probing...</div>}
          </div>
        </Panel>
      </div>

      <div className="screen-column">
        <Panel title="Network" flag="LIVE">
          <Sparkline data={netHistory.length ? netHistory : [0]} width={260} height={36} />
          <div className="metric-grid">
            <MetricTile label="↓ KB/s" value={telemetry?.net ? (telemetry.net.rxPerSec / 1024).toFixed(1) : '—'} />
            <MetricTile label="↑ KB/s" value={telemetry?.net ? (telemetry.net.txPerSec / 1024).toFixed(1) : '—'} />
          </div>
        </Panel>

        <Panel title="OS" flag={telemetry?.os?.platform.toUpperCase() ?? '—'}>
          <div className="mono-readout">
            <div>HOST / {telemetry?.os?.hostname ?? '—'}</div>
            <div>{telemetry?.os?.distro} {telemetry?.os?.release}</div>
            <div>ARCH / {telemetry?.os?.arch}</div>
            <div>UPTIME / {telemetry ? formatUptime(telemetry.uptimeSec ?? 0) : '—'}</div>
            {telemetry?.gpu ? (
              <>
                <div className="micro-label" style={{ marginTop: 8 }}>GPU</div>
                <div>{telemetry.gpu.vendor} {telemetry.gpu.model}</div>
                <div>VRAM / {telemetry.gpu.vramMb} MB</div>
              </>
            ) : null}
            {telemetry?.battery ? (
              <>
                <div className="micro-label" style={{ marginTop: 8 }}>BATTERY</div>
                <div>{telemetry.battery.percent}% {telemetry.battery.charging ? '↑ CHARGING' : telemetry.battery.acConnected ? '⊃ AC' : '↓ DISCHARGING'}</div>
                {telemetry.battery.timeRemainingMin > 0 ? <div>~{Math.floor(telemetry.battery.timeRemainingMin / 60)}h {telemetry.battery.timeRemainingMin % 60}m left</div> : null}
              </>
            ) : null}
          </div>
        </Panel>

        <Panel title="Windows" flag={`${windows.length} OPEN`} className="stretch-panel">
          <div className="button-row">
            <button className="hud-ghost-button" onClick={refreshWindows}><Icon name="reload" width={12} height={12} /> REFRESH</button>
          </div>
          <div className="scroll-list">
            {windows.map((win) => (
              <div key={win.handle} className="event-row" onClick={() => focusWindow(win.handle)} style={{ cursor: 'pointer' }}>
                <strong>FOCUS</strong>
                <em>{win.title || '(no title)'}</em>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="screen-column">
        <Panel title="Processes" flag={`${processes.length} SHOWN`} className="stretch-panel">
          <form className="nav-search" onSubmit={(event) => { event.preventDefault(); refreshProcesses(); }}>
            <Icon name="search" width={14} height={14} />
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="filter by name" />
            <button className="hud-action-button" type="submit"><Icon name="reload" width={12} height={12} /></button>
          </form>
          <div className="scroll-list">
            {processes.map((proc) => (
              <div key={proc.pid} className="event-row">
                <span>{proc.pid}</span>
                <strong>{proc.name}</strong>
                <em title={proc.cmd}>{proc.cmd?.slice(0, 60)}</em>
                <button className="hud-warn-button" onClick={() => killPid(proc.pid)}>KILL</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
