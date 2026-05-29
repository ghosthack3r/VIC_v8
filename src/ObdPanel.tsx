import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { Panel } from './primitives';
import { getBridge, type SerialPortInfo } from './pcBridge';
import { useObdStream } from './hooks';

export function ObdPanel() {
  const { status } = useObdStream();
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [baudRate, setBaudRate] = useState(38400);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dtcs, setDtcs] = useState<string[] | null>(null);

  const bridge = getBridge();

  const refreshPorts = async () => {
    if (!bridge) return;
    const result = await bridge.obd.listPorts();
    if (Array.isArray(result)) {
      setPorts(result);
      if (!selectedPort && result[0]) setSelectedPort(result[0].path);
    }
  };

  useEffect(() => { refreshPorts(); }, []);

  const connect = async () => {
    if (!bridge || !selectedPort) return;
    setBusy(true); setMessage(null);
    const result = await bridge.obd.connect(selectedPort, baudRate);
    if ('error' in result) setMessage(`ERR / ${result.error}`);
    else setMessage(`Linked to ${result.portPath} @ ${result.baudRate}`);
    setBusy(false);
  };

  const disconnect = async () => {
    if (!bridge) return;
    await bridge.obd.disconnect();
    setMessage('Disconnected.');
  };

  const readDtcs = async () => {
    if (!bridge) return;
    const result = await bridge.obd.readDtcs();
    if ('codes' in result) setDtcs(result.codes);
    else setMessage(`ERR / ${result.error}`);
  };

  if (!bridge) {
    return (
      <Panel title="OBD-II Adapter" tone="warn" flag="OFFLINE">
        <div className="micro-label">PC bridge unavailable. Launch via `npm run dev`.</div>
      </Panel>
    );
  }

  return (
    <Panel title="OBD-II Adapter" tone={status.connected ? 'ok' : 'warn'} flag={status.connected ? 'CONNECTED' : 'OFFLINE'}>
      <div className="adapter-status">
        <div className="adapter-icon">
          <Icon name="plug" width={24} height={24} sw={1.8} />
        </div>
        <div>
          <strong>{status.connected ? 'LINKED' : 'NOT CONNECTED'}</strong>
          <span>{status.portPath ? `${status.portPath} @ ${status.baudRate ?? '?'}` : 'Pick a serial port and connect.'}</span>
          {message ? <em>{message}</em> : null}
        </div>
        {status.connected ? (
          <button className="hud-warn-button" onClick={disconnect} disabled={busy}>DISCONNECT</button>
        ) : (
          <button className="hud-action-button" onClick={connect} disabled={busy || !selectedPort}>{busy ? '...' : 'CONNECT'}</button>
        )}
      </div>

      <div className="obd-port-row">
        <select value={selectedPort} onChange={(event) => setSelectedPort(event.target.value)}>
          <option value="">-- select port --</option>
          {ports.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
            </option>
          ))}
        </select>
        <select value={baudRate} onChange={(event) => setBaudRate(Number(event.target.value))}>
          {[9600, 38400, 57600, 115200].map((b) => <option key={b} value={b}>{b} baud</option>)}
        </select>
        <button className="hud-ghost-button" onClick={refreshPorts}><Icon name="reload" width={12} height={12} /> RESCAN</button>
      </div>

      <div className="button-row" style={{ marginTop: 8 }}>
        <button className="hud-ghost-button" onClick={readDtcs} disabled={!status.connected}>READ DTCS</button>
      </div>
      {dtcs ? (
        <div className="code-list" style={{ marginTop: 6 }}>
          {dtcs.length === 0 ? <div className="micro-label">No stored codes.</div> : dtcs.map((code) => (
            <div key={code} className="code-row">
              <strong className="yellow-text">{code}</strong>
              <span>(decode via FORScan or generic OBD lookup)</span>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
