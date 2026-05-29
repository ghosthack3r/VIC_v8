import { useMemo, useState } from 'react';
import { useHudTheme } from './hudTheme';
import { useObdStream, useTacClock, useTickingValue } from './hooks';
import { Bracket, MetricTile, Panel, Sparkline, Stat, TireDiagram } from './primitives';
import type { CoreState, VicData } from './types';
import { VicCore } from './VicCore';
import { ObdPanel } from './ObdPanel';
import type { ObdReading, ObdValues } from './pcBridge';

interface ScreenProps {
  data: VicData;
  armed: boolean;
  holding: boolean;
  coreState: CoreState;
  reply: string;
  lastInput: string;
  onPress?: () => void;
  onRelease?: () => void;
}

function priorityCode(priority: 'high' | 'med' | 'low') {
  if (priority === 'high') return 'P1';
  if (priority === 'med') return 'P2';
  return 'P3';
}

function pickValue(reading: ObdReading | undefined, fallback: number): { value: number; live: boolean } {
  if (reading && Number.isFinite(reading.value) && !reading.error) return { value: reading.value, live: true };
  return { value: fallback, live: false };
}

export function DrivingScreen({ data, armed, holding, coreState, reply, onPress, onRelease }: ScreenProps) {
  const { values, status } = useObdStream();
  const mockSpeed = useTickingValue(42, 0.8, 0.4);
  const mockRpm = useTickingValue(1.8, 0.5, 0.3);
  const speedHistory = useMemo(() => Array.from({ length: 24 }, (_, index) => 30 + Math.sin(index / 2) * 10 + Math.random() * 4), []);

  const speed = pickValue(values.SPEED, mockSpeed);
  const rpm = pickValue(values.RPM, mockRpm * 1000);
  const coolant = pickValue(values.COOLANT, data.telemetry.coolant);
  const fuel = pickValue(values.FUEL_LEVEL, data.telemetry.fuel * 100);
  const battery = pickValue(values.BATTERY, data.telemetry.battery);
  const live = status.connected;

  return (
    <div className="screen-grid driving-grid">
      <div className="screen-column">
        <Panel title="Speed" flag={live ? 'OBD' : 'MPH'}>
          <div className="speed-readout">
            <strong>{Math.round(speed.value)}</strong>
            <span>{live ? 'KPH' : 'MPH'}</span>
          </div>
          <div className="spark-block">
            <Sparkline data={speedHistory} width={260} height={32} />
            <div className="micro-label">{speed.live ? 'LIVE / OBD' : 'MOCK / 60S ROLLING'}</div>
          </div>
        </Panel>

        <Panel title="Engine" flag={live ? 'LIVE OBD' : 'MOCK'}>
          <Stat label="RPM" value={rpm.value} max={6000} />
          <Stat label="Coolant" value={coolant.value} max={250} unit={live ? 'C' : 'F'} />
          <Stat label="Oil PSI" value={data.telemetry.oilPressure} max={80} />
          <Stat label="Battery" value={battery.value} max={14.5} unit="V" tone="ok" />
          <Stat label="Fuel" value={fuel.value} max={100} unit="%" />
        </Panel>
      </div>

      <div className="screen-column core-column">
        <Panel className="core-panel">
          <div className="panel-status-row">
            <span>// ASSISTANT CORE</span>
            <strong className={armed ? 'ok-text' : 'warn-text'}>STATUS / {armed ? 'ARMED' : 'DISARMED'}</strong>
          </div>
          <div className="core-stage">
            <VicCore
              size={280}
              mode="driving"
              state={coreState || (holding ? 'listening' : 'idle')}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onPress?.();
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                onRelease?.();
              }}
            />
          </div>
          <div className={`core-caption core-caption-${coreState}`}>
            {coreState === 'listening'
              ? 'CAPTURING INPUT / RELEASE TO SEND'
              : coreState === 'thinking'
                ? '// PROCESSING / TOOLS / ROUTING'
                : coreState === 'speaking'
                  ? 'SPEAKING'
                  : 'SPACEBAR OR HOLD MIC TO TALK'}
          </div>
        </Panel>

        <Panel title="Latest Reply" flag="VIC">
          <div className="latest-reply">{reply}</div>
        </Panel>
      </div>

      <div className="screen-column">
        <Panel title="Next Up" flag={`${data.tasks.length} ACTIVE`}>
          <div className="list-stack">
            {data.tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="queue-item">
                <div className="queue-title">
                  <span className={task.priority === 'high' ? 'warn-text' : 'yellow-text'}>{priorityCode(task.priority)}</span>
                  <strong>{task.title}</strong>
                </div>
                <div className="micro-label indent">{task.tag} / DUE {task.due.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Signals" tone="warn" flag={`${data.counts.openIssues} OPEN`}>
          <div className="list-stack">
            {data.notes
              .filter((note) => note.kind === 'ISSUE')
              .slice(0, 3)
              .map((note) => (
                <div key={note.id} className="signal-item">
                  <span className="red-dot" />
                  <div>
                    <strong>{note.title}</strong>
                    <div className="micro-label">{note.when.toUpperCase()}</div>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ParkedScreen({ data, holding, coreState, onPress, onRelease }: ScreenProps) {
  const [input, setInput] = useState('');

  return (
    <div className="screen-grid parked-grid">
      <div className="screen-column">
        <Panel title="Vehicle" flag={data.vehicle.plate}>
          <div className="mono-readout">
            <div>{data.vehicle.year} CROWN VIC / P71</div>
            <div>VIN / {data.vehicle.vin}</div>
            <div>ODO / {data.vehicle.mileage.toLocaleString()} MI</div>
            <div>ENG / {data.vehicle.engine}</div>
            <div>TRA / {data.vehicle.trans}</div>
          </div>
        </Panel>

        <Panel title="Counts">
          <div className="metric-grid">
            <MetricTile label="OPEN" value={String(data.counts.openIssues).padStart(2, '0')} tone="warn" />
            <MetricTile label="TASKS" value={String(data.counts.pendingTasks).padStart(2, '0')} />
            <MetricTile label="PARTS" value={String(data.counts.trackedParts).padStart(2, '0')} />
            <MetricTile label="TRIPS" value={String(data.counts.trips).padStart(2, '0')} tone="ok" />
          </div>
        </Panel>

        <Panel title="Parts" flag={`${data.parts.length} TRACKED`} className="stretch-panel">
          <div className="list-stack">
            {data.parts.map((part) => (
              <div key={part.id} className="part-item">
                <strong>{part.name}</strong>
                <div className="part-meta">
                  <span className={part.status === 'ON-ORDER' ? 'yellow-text' : part.status === 'IN-STOCK' ? 'ok-text' : ''}>{part.status}</span>
                  <span>{part.vendor}</span>
                  <span>{part.eta}</span>
                  <span>${part.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="screen-column core-column">
        <Panel>
          <div className="parked-hero">
            <VicCore
              size={200}
              mode="parked"
              state={coreState || (holding ? 'listening' : 'idle')}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onPress?.();
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                onRelease?.();
              }}
            />
            <div>
              <div className="micro-label">// VIC / PARKED SESSION</div>
              <div className="parked-summary">
                Engine off, three open issues to resolve. Suggested next action: <span>order dome light LEDs</span>.
              </div>
              <div className="button-row">
                <button className="hud-action-button">ACCEPT</button>
                <button className="hud-ghost-button">DEFER</button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Comm Log" flag="LAST 6" className="stretch-panel">
          <div className="comm-log">
            {data.transcript.slice(0, 6).map((message, index) => (
              <div key={`${message.t}-${index}`} className="comm-row" style={{ opacity: 1 - index * 0.1 }}>
                <span>{message.t}</span>
                <Bracket tone={message.who === 'vic' ? 'ok' : 'default'}>{message.who === 'vic' ? 'VIC' : 'DRV'}</Bracket>
                <strong className={message.who === 'vic' ? 'ok-text' : undefined}>
                  {message.who !== 'vic' ? '> ' : ''}
                  {message.text}
                </strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel compact>
          <div className="command-line">
            <span>&gt;</span>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a command, note, or question..." />
            <button className="hud-action-button">SEND</button>
          </div>
        </Panel>
      </div>

      <div className="screen-column">
        <Panel title="Maintenance Notes" flag={`${data.notes.length} ENTRIES`} className="stretch-panel">
          <div className="scroll-list">
            {data.notes.slice(0, 4).map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-title">
                  <span className={note.kind === 'ISSUE' ? 'warn-text' : note.kind === 'MAINTENANCE' ? 'yellow-text' : ''}>{note.kind}</span>
                  <strong>{note.title}</strong>
                </div>
                <p>{note.body}</p>
                <div className="micro-label">{note.when.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Event Stream" flag="TAIL" className="stretch-panel">
          <div className="event-log">
            {data.eventLog.map((event, index) => (
              <div key={`${event.t}-${index}`} className="event-row" style={{ opacity: 1 - index * 0.07 }}>
                <span>{event.t}</span>
                <strong className={event.tag === 'OBD' ? 'warn-text' : event.tag === 'VOICE' || event.tag === 'TOOL' ? 'ok-text' : undefined}>{event.tag}</strong>
                <em>{event.text}</em>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function obdHistoryFromValues(values: ObdValues, key: keyof ObdValues, fallback: number[]): { samples: number[]; live: boolean } {
  const reading = values[key];
  if (reading && Number.isFinite(reading.value)) {
    return { samples: [...fallback.slice(1), reading.value], live: true };
  }
  return { samples: fallback, live: false };
}

export function DiagnosticsScreen({ data, holding, coreState, onPress, onRelease }: ScreenProps) {
  const { palette, base } = useHudTheme();
  const { values, status } = useObdStream();

  const seedBattery = useMemo(() => Array.from({ length: 40 }, (_, index) => 12.3 + Math.sin(index / 4) * 0.2 + Math.random() * 0.1), []);
  const seedCoolant = useMemo(() => Array.from({ length: 40 }, (_, index) => 190 + Math.sin(index / 5) * 6 + Math.random() * 2), []);
  const seedRpm = useMemo(() => Array.from({ length: 40 }, (_, index) => Math.max(0, Math.sin(index / 3) * 1200 + Math.random() * 200)), []);
  const seedThrottle = useMemo(() => Array.from({ length: 40 }, (_, index) => 40 + Math.sin(index / 6) * 5 + Math.random() * 2), []);

  const battery = obdHistoryFromValues(values, 'BATTERY', seedBattery);
  const coolant = obdHistoryFromValues(values, 'COOLANT', seedCoolant);
  const rpm = obdHistoryFromValues(values, 'RPM', seedRpm);
  const throttle = obdHistoryFromValues(values, 'THROTTLE', seedThrottle);

  const sparkRows: [string, { samples: number[]; live: boolean }, string, string, number | undefined][] = [
    ['Battery',  battery,  palette.accent,  'V',   values.BATTERY?.value],
    ['Coolant',  coolant,  palette.primary, 'C',   values.COOLANT?.value],
    ['RPM',      rpm,      base.yellow,     'rpm', values.RPM?.value],
    ['Throttle', throttle, palette.accent,  '%',   values.THROTTLE?.value],
  ];

  return (
    <div className="screen-grid diagnostics-grid">
      <div className="screen-column">
        <ObdPanel />

        <Panel title="Tire Pressure" flag="TPMS / STATIC" className="stretch-panel">
          <TireDiagram psi={data.telemetry.tirePsi} />
          <div className="center micro-label">SPEC / 32 PSI COLD / 35 PSI LOADED</div>
        </Panel>
      </div>

      <div className="screen-column">
        {sparkRows.map(([label, history, color, unit, latest]) => {
          const display = typeof latest === 'number' ? `${latest.toFixed(1)} ${unit}` : '—';
          return (
            <Panel key={label} compact>
              <div className="diagnostic-spark-row">
                <div>
                  <span>{label}</span>
                  <strong style={{ color }}>{display}</strong>
                  <em className="micro-label">{history.live ? 'OBD' : 'mock'}</em>
                </div>
                <Sparkline data={history.samples} width={190} height={38} color={color} />
              </div>
            </Panel>
          );
        })}

        <Panel title="Assistant Core" flag="DIAG" className="stretch-panel">
          <div className="core-stage compact-core">
            <VicCore
              size={180}
              mode="diagnostics"
              state={coreState || (holding ? 'listening' : 'idle')}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onPress?.();
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                onRelease?.();
              }}
            />
          </div>
        </Panel>
      </div>

      <div className="screen-column">
        <Panel title="System Health" flag="OK">
          {[
            ['Assistant Core', 'RUNNING', 'ok'],
            ['Socket Bridge', 'CONNECTED', 'ok'],
            ['Mic Input', 'READY', 'ok'],
            ['OBD-II Link', status.connected ? 'CONNECTED' : 'OFFLINE', status.connected ? 'ok' : 'warn'],
            ['Persistent Store', 'SYNCED', 'ok'],
            ['Motion Sensor', 'STUB', 'default'],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="health-row">
              <span>{label as string}</span>
              <strong className={tone === 'ok' ? 'ok-text' : tone === 'warn' ? 'warn-text' : undefined}>STATUS / {value as string}</strong>
            </div>
          ))}
        </Panel>

        <Panel title="Live OBD Values" flag={status.connected ? 'STREAM' : 'OFFLINE'} className="stretch-panel">
          {status.connected ? (
            <div className="list-stack">
              {Object.entries(values).map(([name, reading]) => (
                <div key={name} className="event-row">
                  <strong>{name}</strong>
                  <em>{reading?.error ? `err / ${reading.error}` : `${reading?.value?.toFixed(2)} ${reading?.unit}`}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="micro-label">Connect an ELM327 adapter to see live PIDs.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function AmbientScreen({ data, holding, coreState, onPress, onRelease }: ScreenProps) {
  const now = useTacClock();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const seconds = now.toLocaleTimeString([], { second: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="ambient-screen">
      <VicCore
        size={240}
        mode="ambient"
        state={coreState || (holding ? 'listening' : 'idle')}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onPress?.();
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          onRelease?.();
        }}
      />
      <div className="ambient-clock">
        <div>
          <strong>{time}</strong>
          <span>:{seconds}</span>
        </div>
        <em>{date}</em>
      </div>
      <div className="ambient-metrics">
        <MetricTile label="TEMP" value={`${data.telemetry.ambient}F`} />
        <MetricTile label="MILES" value={data.vehicle.mileage.toLocaleString()} />
        <MetricTile label="NEXT SVC" value={`${(data.vehicle.nextService - data.vehicle.mileage).toLocaleString()} MI`} />
        <MetricTile label="UPTIME" value="00:47:12" />
      </div>
      <div className="ambient-footer">TAP SPACE / OR SAY "VIC" TO WAKE</div>
    </div>
  );
}
